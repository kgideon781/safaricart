import { NextResponse } from "next/server";
import { db } from "@/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const t0 = Date.now();
  try {
    // Cheap roundtrip — confirms DB credentials, network, and pool are live.
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      db: "ok",
      latencyMs: Date.now() - t0,
      time: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        db: "error",
        error: err instanceof Error ? err.message : "unknown",
        time: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
