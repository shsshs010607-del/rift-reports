import { NextResponse } from 'next/server';

export async function GET() {
  return new NextResponse('b1e95845-0e3c-4f44-b843-ea10274ae03b', {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
