import { NextResponse } from "next/server";

/**
 * Lightweight health check for load balancers and uptime monitoring.
 * No DB or auth; returns 200 when the app is running.
 */
export async function GET() {
  return NextResponse.json({ status: "ok" }, { status: 200 });
}
