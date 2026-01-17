import { NextResponse } from 'next/server'

// Force dynamic rendering - uses searchParams
export const dynamic = 'force-dynamic'


// Known parent event slugs for popular series
const KNOWN_SERIES: Record<string, string> = {
  'super bowl 2026': 'super-bowl-champion-2026-731',
  'nfc championship': 'nfc-championship-2026',
  'afc championship': 'afc-championship-2026',
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const marketId = searchParams.get('marketId')

  if (!marketId) {
    return NextResponse.json({ error: 'marketId is required' }, { status: 400 })
  }

  try {
    console.log(`🔍 Finding event for market ${marketId}...`)
    
    // Get market details first
    const marketRes = await fetch(`https://gamma-api.polymarket.com/markets/${marketId}`, { cache: 'no-cache' })
    if (!marketRes.ok) {
      return NextResponse.json({ eventSlug: null })
    }
    const market = await marketRes.json()
    
    // Check known series first
    const question = (market.question || '').toLowerCase()
    for (const [pattern, slug] of Object.entries(KNOWN_SERIES)) {
      if (question.includes(pattern)) {
        console.log(`✅ Matched known series: "${slug}"`)
        return NextResponse.json({ eventSlug: slug })
      }
    }
    
    // APPROACH 1: Search in events list
    const eventsRes = await fetch('https://gamma-api.polymarket.com/events?limit=300', { cache: 'no-cache' })
    
    if (eventsRes.ok) {
      const events = await eventsRes.json()
      
      for (const event of events) {
        // Check if this event contains our market
        if (event.markets && Array.isArray(event.markets)) {
          const hasThisMarket = event.markets.some((m: any) => m.id === marketId)
          
          if (hasThisMarket) {
            console.log(`✅ Found in events list: "${event.slug}"`)
            return NextResponse.json({ eventSlug: event.slug })
          }
        }
      }
    }
    
    // APPROACH 2: Generate likely event slug and verify
    if (market.slug) {
      let cleanSlug = market.slug
        // Fed Chair pattern: "will-trump-nominate-[name]-as-the-next-fed-chair" → "who-will-trump-nominate-as-fed-chair"
        .replace(/^will-trump-nominate-[a-z-]+-as-the-next-fed-chair$/i, 'who-will-trump-nominate-as-fed-chair')
        .replace(/^will-trump-nominate-[a-z-]+-as-fed-chair$/i, 'who-will-trump-nominate-as-fed-chair')
        // Date cleanup
        .replace(/-(january|february|march|april|may|june|july|august|september|october|november|december)-\d+(-\d{4})?.*$/i, '')
        .replace(/-\d{6,}.*$/i, '')  // Remove long number sequences
        .replace(/-\d+-\d+-\d+.*$/i, '')  // Remove date patterns
        .replace(/-+$/g, '')
      
      console.log(`🔍 Trying direct slug: "${cleanSlug}" (from "${market.slug}")`)
      
      const directRes = await fetch(`https://gamma-api.polymarket.com/events?slug=${cleanSlug}`, { cache: 'no-cache' })
      if (directRes.ok) {
        const directEvents = await directRes.json()
        if (directEvents && directEvents.length > 0) {
          console.log(`✅ Found via direct search: "${directEvents[0].slug}"`)
          return NextResponse.json({ eventSlug: directEvents[0].slug })
        }
      }
    }
    
    console.log(`ℹ️ No parent event found (using search fallback)`)
    return NextResponse.json({ eventSlug: null })
  } catch (error) {
    console.error('Failed to resolve eventSlug:', error)
    return NextResponse.json({ eventSlug: null })
  }
}
