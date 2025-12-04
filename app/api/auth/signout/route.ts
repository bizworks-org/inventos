import { NextResponse } from "next/server";
import { readAuthToken, verifyToken } from "@/lib/auth/server";
import { query } from "@/lib/db";
import { createHash } from "node:crypto";
import logger from "@/lib/logger";

async function lookupSessionId(hash: Buffer): Promise<string | null> {
  try {
    const rows: any[] = await query(
      "SELECT id, user_id FROM sessions WHERE token_hash = :th LIMIT 1",
      { th: hash }
    );
    if (rows && rows.length > 0) return String(rows[0].id);
    return null;
  } catch (e) {
    console.error("Failed to lookup session for signout:", e);
    return null;
  }
}

async function revokeByHash(hash: Buffer): Promise<void> {
  try {
    await query(
      "UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = :th AND revoked_at IS NULL",
      { th: hash }
    );
  } catch (e) {
    console.error("Failed to revoke session by hash:", e);
  }
}

async function revokeUserSessions(userId: string): Promise<void> {
  try {
    await query(
      "UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = :uid AND revoked_at IS NULL",
      { uid: userId }
    );
  } catch (e) {
    console.error("Failed to revoke sessions by user id:", e);
  }
}

async function updateSessionEvent(sessionId: string): Promise<void> {
  try {
    const eventId = `SESS-${sessionId}`;
    // Use JSON_SET to add logoutAt into metadata while preserving existing metadata
    await query(
      `UPDATE events SET metadata = JSON_SET(COALESCE(metadata, JSON_OBJECT()), '$.logoutAt', CURRENT_TIMESTAMP), details = :details WHERE id = :id`,
      { id: eventId, details: "User session ended" }
    );
    try {
      logger.auth("session.end", { sessionId, eventId });
    } catch {}
  } catch (e) {
    console.error("Failed to update session event on signout:", e);
  }
}

export async function POST() {
  // Best-effort revoke the current session
  try {
    const token = await readAuthToken();
    if (token) {
      const hash = createHash("sha256").update(token).digest();

      const sessionId = await lookupSessionId(hash);

      await revokeByHash(hash);

      // Additionally clear any remaining active sessions for this user to remove single-session lock
      try {
        const payload = verifyToken(token);
        if (payload?.id) {
          await revokeUserSessions(payload.id);
        }
      } catch {}

      // Update the session event row (if found) to mark logout timestamp instead of inserting a separate logout event
      if (sessionId) {
        await updateSessionEvent(sessionId);
      }
    }
  } catch {}
  const res = NextResponse.json({ ok: true });
  res.cookies.set("auth_token", "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
