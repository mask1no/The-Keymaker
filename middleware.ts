import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED=[/^\/api\//];
export function middleware(req:NextRequest){
  const isApi = PROTECTED.some(re=>re.test(req.nextUrl.pathname));
  if(!isApi) return NextResponse.next();
  if(['POST','PUT','PATCH','DELETE'].includes(req.method)){
    const origin=req.headers.get('origin');
    if(origin){
      try { if(new URL(origin).host !== req.nextUrl.host) return new NextResponse('forbidden: origin',{status:403}); } catch {}
    }
    const hdr=req.headers.get('x-csrf-token'); const cookie=req.cookies.get('csrf')?.value; if(!hdr || !cookie || hdr!==cookie) return new NextResponse('forbidden: csrf',{status:403});
  }
  return NextResponse.next();
}
export const config={ matcher:['/api/:path*'] };