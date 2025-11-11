import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const ca = url.searchParams.get("ca") || "";
    const folder = url.searchParams.get("folder") || "";
    if (!ca || !folder) {
      return NextResponse.json({ error: "BAD_PARAMS" }, { status: 400 });
    }
    const base = process.env.NEXT_PUBLIC_WS_URL?.replace(/^ws/, "http") || "http://localhost:8787";
    const headers: Record<string, string> = {};
    const token = process.env.DAEMON_HTTP_TOKEN;
    if (token) headers["x-keymaker-auth"] = token;
    const res = await fetch(`${base}/positions?ca=${encodeURIComponent(ca)}&folder=${encodeURIComponent(folder)}`, { cache: "no-store", headers });
    const j = await res.json();
    return NextResponse.json(j);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}



