import type { NextApiRequest, NextApiResponse } from 'next'

// Proxy endpoint to shield the frontend from VPS path differences and CORS
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const base = (process.env.SERVER_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');
    const q: Record<string, string> = {};
    Object.entries(req.query || {}).forEach(([k, v]) => {
      if (Array.isArray(v)) q[k] = v[0] ?? '';
      else if (v !== undefined) q[k] = String(v);
    });
    const search = new URLSearchParams(q).toString();

    // Prefer direct world-ranking; server also supports /api/world-ranking via our mounts
    const candidates = [
      `${base}/world-ranking${search ? `?${search}` : ''}`,
      `${base}/api/world-ranking${search ? `?${search}` : ''}`,
    ];

    const headers: Record<string,string> = { 'Accept': 'application/json' };
    if (req.headers.authorization) headers['Authorization'] = String(req.headers.authorization);

    let lastErr: any = null;
    for (const url of candidates) {
      try {
        const upstream = await fetch(url, { headers });
        const text = await upstream.text();
        const contentType = upstream.headers.get('content-type') || '';
        const body = contentType.includes('application/json') ? JSON.parse(text || '{}') : text;
        if (!upstream.ok) {
          lastErr = { status: upstream.status, body };
          continue;
        }
        // Pass-through success
        if (typeof body === 'string') {
          res.setHeader('Content-Type', contentType || 'application/json');
          return res.status(upstream.status).send(body);
        }
        return res.status(upstream.status).json(body);
      } catch (e: any) {
        lastErr = e;
        continue;
      }
    }

    return res.status(502).json({ error: 'Upstream failed', detail: lastErr });
  } catch (error: any) {
    return res.status(500).json({ error: 'Proxy error', message: error?.message || 'Unknown error' });
  }
}
