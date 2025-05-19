import { searchSchema } from '@/lib/schema/search'
import {
  SearchResultImage,
  SearchResultItem,
  SearchResults,
  SearXNGResponse,
  SearXNGResult
} from '@/lib/types'
import { sanitizeUrl } from '@/lib/utils'
import { tool } from 'ai'
import Exa from 'exa-js'

export const searchTool = tool({
  description: 'Search the web for information',
  parameters: searchSchema,
  execute: async ({
    query,
    max_results = 20,
    search_depth = 'basic',
    include_domains = [],
    exclude_domains = []
  }) => {
    const filledQuery =
      query.length < 5 ? query + ' '.repeat(5 - query.length) : query
    let searchResult: SearchResults
    const searchAPI =
      (process.env.SEARCH_API as 'tavily' | 'exa' | 'searxng') || 'tavily'

    console.log(`Active Search API: ${searchAPI}`);

    const effectiveSearchDepth =
      searchAPI === 'searxng' &&
      process.env.SEARXNG_DEFAULT_DEPTH === 'advanced'
        ? 'advanced'
        : search_depth || 'basic'

    console.log(
      `Using search API: ${searchAPI}, Depth: ${effectiveSearchDepth}`
    )

    try {
      if (searchAPI === 'searxng' && effectiveSearchDepth === 'advanced') {
        const baseUrl =
          process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        const response = await fetch(`${baseUrl}/api/advanced-search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: filledQuery,
            maxResults: max_results,
            searchDepth: effectiveSearchDepth,
            includeDomains: include_domains,
            excludeDomains: exclude_domains
          })
        })
        if (!response.ok) {
          throw new Error(
            `Advanced search API error: ${response.status} ${response.statusText}`
          )
        }
        searchResult = await response.json()
      } else {
        searchResult = await (searchAPI === 'tavily'
          ? tavilySearch
          : searchAPI === 'exa'
          ? exaSearch
          : searxngSearch)(
          filledQuery,
          max_results,
          effectiveSearchDepth === 'advanced' ? 'advanced' : 'basic',
          include_domains,
          exclude_domains
        )
      }
    } catch (error) {
      console.error('Search API error:', error)
      searchResult = {
        results: [],
        query: filledQuery,
        images: [],
        number_of_results: 0
      }
    }

    return searchResult
  }
})

export async function search(
  query: string,
  maxResults: number = 10,
  searchDepth: 'basic' | 'advanced' = 'basic',
  includeDomains: string[] = [],
  excludeDomains: string[] = []
): Promise<SearchResults> {
  return searchTool.execute(
    {
      query,
      max_results: maxResults,
      search_depth: searchDepth,
      include_domains: includeDomains,
      exclude_domains: excludeDomains
    },
    {
      toolCallId: 'search',
      messages: []
    }
  )
}

async function tavilySearch(
  query: string,
  maxResults: number = 10,
  searchDepth: 'basic' | 'advanced' = 'basic',
  includeDomains: string[] = [],
  excludeDomains: string[] = []
): Promise<SearchResults> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) throw new Error('TAVILY_API_KEY is missing')
  const includeImageDescriptions = true
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: Math.max(maxResults, 5),
      search_depth: searchDepth,
      include_images: true,
      include_image_descriptions: includeImageDescriptions,
      include_answers: true,
      include_domains: includeDomains,
      exclude_domains: excludeDomains
    })
  })
  if (!response.ok)
    throw new Error(
      `Tavily API error: ${response.status} ${response.statusText}`
    )

  const data = await response.json()
  console.log('Raw SearXNG response:', JSON.stringify(data, null, 2))

  const processedImages = includeImageDescriptions
    ? data.images
        .map(({ url, description }: { url: string; description: string }) => ({
          url: sanitizeUrl(url),
          description
        }))
        .filter((image: SearchResultImage): image is { url: string; description: string } =>
  typeof image === 'object' && typeof image.description === 'string' && image.description.trim().length > 0
)
    : data.images.map((url: string) => sanitizeUrl(url))

  return { ...data, images: processedImages }
}

async function exaSearch(
  query: string,
  maxResults: number = 10,
  _searchDepth: string,
  includeDomains: string[] = [],
  excludeDomains: string[] = []
): Promise<SearchResults> {
  const apiKey = process.env.EXA_API_KEY
  if (!apiKey) throw new Error('EXA_API_KEY is missing')

  const exa = new Exa(apiKey)
  const exaResults = await exa.searchAndContents(query, {
    highlights: true,
    numResults: maxResults,
    includeDomains,
    excludeDomains
  })

  return {
    results: exaResults.results.map((r: any) => ({
      title: r.title,
      url: r.url,
      content: r.highlight || r.text
    })),
    query,
    images: [],
    number_of_results: exaResults.results.length
  }
}

async function searxngSearch(
  query: string,
  maxResults: number = 10,
  searchDepth: string,
  includeDomains: string[] = [],
  excludeDomains: string[] = []
): Promise<SearchResults> {

  console.log('🐾 searxngSearch triggered with query:', query)

  const apiUrl = process.env.SEARXNG_API_URL
  if (!apiUrl) throw new Error('SEARXNG_API_URL is missing')

  try {
    const url = new URL(`${apiUrl}/search`)
    url.searchParams.append('q', query)
    url.searchParams.append('format', 'json')
    url.searchParams.append('categories', 'general,images')

    if (searchDepth === 'advanced') {
      url.searchParams.append('time_range', '')
      url.searchParams.append('safesearch', '0')
      url.searchParams.append('engines', 'google,bing,duckduckgo,wikipedia')
    } else {
      url.searchParams.append('time_range', 'year')
      url.searchParams.append('safesearch', '1')
      url.searchParams.append('engines', 'google,bing')
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `SearXNG API error: ${response.status} ${response.statusText} - ${errorText}`
      )
    }

    const data: SearXNGResponse = await response.json()

    const generalResults = data.results
      .filter(result => !result.img_src)
      .slice(0, maxResults)
    const imageResults = data.results
      .filter(result => result.img_src)
      .slice(0, maxResults)

    const processedImages = imageResults
      .map(result => {
        const imgSrc = result.img_src || ''
        const fullUrl = imgSrc.startsWith('http') ? imgSrc : `${apiUrl}${imgSrc}`
        return {
          url: fullUrl,
          description: result.title || ''
        }
      })
      .filter(image => !!image.url)

    console.log('🖼️ Processed SearXNG images:', processedImages)

    return {
      results: generalResults.map(
        (result: SearXNGResult): SearchResultItem => ({
          title: result.title,
          url: result.url,
          content: result.content
        })
      ),
      query: data.query,
      images: processedImages,
      number_of_results: data.number_of_results
    }
  } catch (error) {
    console.error('SearXNG API error:', error)
    throw error
  }
}
