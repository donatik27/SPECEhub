import { NextResponse } from 'next/server'
import { proxyGet } from '../../_lib/proxy'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { marketId: string } }
) {
  const proxied = await proxyGet(request, `/api/redirect-market/${params.marketId}`)
  if (proxied) return proxied
  
  return NextResponse.json({ error: 'API service not configured' }, { status: 503 })
}
