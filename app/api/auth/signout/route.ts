import { NextResponse } from "next/server";
import { readAuthToken, verifyToken } from "@/lib/auth/server";
import { query } from "@/lib/db";
import { createHash } from "node:crypto";
import { secureId } from "@/lib/secure";
import logger from "@/lib/logger";

export async function POST() {
  // Best-effort revoke the current session
  try {
    const token = await readAuthToken();
    if (token) {
      const hash = createHash("sha256").update(token).digest();
      // Try to locate the session id before revoking so we can update its event row
      let sessionId: string | null = null;
      try {
        const rows: any[] = await query(
          "SELECT id, user_id FROM sessions WHERE token_hash = :th LIMIT 1",
          { th: hash }
        );
        if (rows && rows.length > 0) sessionId = String(rows[0].id);
      } catch (e) {
        console.error("Failed to lookup session for signout:", e);
      }

      // Revoke this session
      await query(
        "UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = :th AND revoked_at IS NULL",
        { th: hash }
      );

      // Additionally clear any remaining active sessions for this user to remove single-session lock
      try {
        const payload = verifyToken(token);
        if (payload?.id) {
          await query(
            "UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = :uid AND revoked_at IS NULL",
            { uid: payload.id }
          );
        }
      } catch {}

      // Update the session event row (if found) to mark logout timestamp instead of inserting a separate logout event
      try {
        if (sessionId) {
          const eventId = `SESS-${sessionId}`;
          // Use JSON_SET to add logoutAt into metadata while preserving existing metadata
          await query(
            `UPDATE events SET metadata = JSON_SET(COALESCE(metadata, JSON_OBJECT()), '$.logoutAt', CURRENT_TIMESTAMP), details = :details WHERE id = :id`,
            { id: eventId, details: "User session ended" }
          );
          try {
            logger.auth("session.end", { sessionId, eventId });
          } catch {}
        }
      } catch (e) {
        console.error("Failed to update session event on signout:", e);
      }
    }
  } catch {}
  const res = NextResponse.json({ ok: true });
  res.cookies.set("auth_token", "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
