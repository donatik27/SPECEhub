import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const API_BASE_URL = process.env.API_BASE_URL || 'https://adorable-grace-production-e919.up.railway.app';

  try {
    // Proxy request to Railway API
    const response = await fetch(`${API_BASE_URL}/api/traders-map-static`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Railway API error:', response.status);
      return NextResponse.json([]);
    }

    const traders = await response.json();
    return NextResponse.json(traders);
  } catch (error) {
    console.error('Failed to fetch map traders:', error);
    return NextResponse.json([]);
  }
}
