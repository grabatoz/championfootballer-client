import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const base = process.env.API_URL || process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    // Forward query params directly
    const { searchParams } = new URL(req.url);
    const url = `${base.replace(/\/$/, '')}/world-ranking?${searchParams.toString()}`;
    
    const r = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
    if (!r.ok) {
      const text = await r.text().catch(() => '');
      return NextResponse.json(
        { message: 'Upstream error', status: r.status, detail: text },
        { status: r.status }
      );
    }

    const data = await r.json();
    
    // Disable caching to always return fresh data
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    
    return NextResponse.json(data, {
      status: 200,
      headers
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { message: 'Proxy failure', error: errorMessage },
      { status: 500 }
    );
  }
}
