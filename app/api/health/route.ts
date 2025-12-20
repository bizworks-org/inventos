import { NextResponse } from "next/server";

export async function GET() {
  const uptime =
    typeof process.uptime === "function" ? Math.round(process.uptime()) : 0;
  const time = new Date().toISOString();
  return NextResponse.json({
    ok: true,
    time,
    uptime_seconds: uptime,
    env: process.env.NODE_ENV || "unknown",
  });
}
