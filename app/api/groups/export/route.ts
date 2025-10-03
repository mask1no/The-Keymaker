import { NextResponse } from 'next/server';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export async function GET(){ return NextResponse.json({ ok:false, stub:true, route:'app/api/groups/export/route.ts' }, { status: 501 }); }
export async function POST(req: Request){ return GET(); }
export async function PUT(req: Request){ return GET(); }
export async function DELETE(req: Request){ return GET(); }
