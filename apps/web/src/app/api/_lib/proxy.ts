import { NextResponse } from 'next/server'

export async function proxyGet(request: Request, path: string) {
  const base = process.env.API_BASE_URL
  if (!base) return null

  const url = new URL(request.url)
  const target = `${base.replace(/\/$/, '')}${path}${url.search}`
  const upstream = await fetch(target, {
    headers: {
      accept: request.headers.get('accept') || 'application/json',
    },
  })

  const body = await upstream.text()
  return new NextResponse(body, {
    status: upstream.status,
    headers: {
      'content-type': upstream.headers.get('content-type') || 'application/json',
    },
  })
}
