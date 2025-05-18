import { SearchResultItem, SearXNGSearchResults } from '@/lib/types'

const SEARXNG_URL = 'https://searxng-hidden-wildflower-1397.fly.dev' // 🔁 Replace with your actual Fly.io domain

export async function getSearxResults(query: string): Promise<SearXNGSearchResults> {
  const searchParams = new URLSearchParams({
    q: query,
    categories: 'general,images',
    format: 'json'
  })

  const response = await fetch(`${SEARXNG_URL}/search?${searchParams.toString()}`, {
    headers: {
      Accept: 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`SearXNG fetch failed: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  const results: SearchResultItem[] = data.results.map((item: any) => ({
    title: item.title,
    url: item.url,
    content: item.content
  }))

  const images: string[] = data.results
    .filter((item: any) => item.img_src)
    .map((item: any) => item.img_src)

  return {
    query: data.query,
    number_of_results: data.number_of_results,
    results,
    images
  }
}
