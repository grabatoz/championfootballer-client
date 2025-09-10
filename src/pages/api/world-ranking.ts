import type { NextApiRequest, NextApiResponse } from 'next'

// Simple proxy to the Koa API's /world-ranking endpoint so the client can also call
// our Next.js domain at /api/world-ranking (useful on Vercel and for CORS simplicity).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'GET') {
		res.setHeader('Allow', 'GET');
		return res.status(405).json({ message: 'Method Not Allowed' });
	}

	try {
		// Prefer a server-side env var for the backend base URL; fallback to the public one for dev
		const base = process.env.API_URL || process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

		// Forward query params directly
		const qs = new URLSearchParams();
		Object.entries(req.query).forEach(([k, v]) => {
			if (Array.isArray(v)) {
				v.forEach((vi) => qs.append(k, String(vi)));
			} else if (v !== undefined) {
				qs.append(k, String(v));
			}
		});

		const url = `${base.replace(/\/$/, '')}/world-ranking${qs.toString() ? `?${qs.toString()}` : ''}`;
		const r = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
		if (!r.ok) {
			const text = await r.text().catch(() => '');
			return res.status(r.status).json({ message: 'Upstream error', status: r.status, detail: text });
		}

		// Cache briefly at the edge/CDN if possible
		res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
		const data = await r.json();
		return res.status(200).json(data);
	} catch (err: any) {
		return res.status(500).json({ message: 'Proxy failure', error: err?.message || String(err) });
	}
}

