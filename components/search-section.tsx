'use client'

import { CHAT_ID } from '@/lib/constants'
import type { SearchResults as TypeSearchResults } from '@/lib/types'
import { ToolInvocation } from 'ai'
import { useChat } from 'ai/react'
import { CollapsibleMessage } from './collapsible-message'
import { SearchSkeleton } from './default-skeleton'
import { SearchResults } from './search-results'
import { SearchResultsImageSection } from './search-results-image'
import { Section, ToolArgsSection } from './section'

interface SearchToolData {
  tool: 'search'
  state: 'result'
  query: string
  results: Array<{ title: string; url: string; content: string }>
  images?: Array<{ url: string; description?: string }>
}


interface SearchSectionProps {
  tool: SearchToolData
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchSection({
  tool,
  isOpen,
  onOpenChange
}: SearchSectionProps) {
  const { isLoading } = useChat({ id: CHAT_ID })

	const query = tool.query
	const includeDomains = [] // or hardcode based on need
	const includeDomainsString = ''


  const header = (
    <ToolArgsSection
  tool="search"
  number={tool.results?.length || 0}
>{`${tool.query}`}</ToolArgsSection>
  )

  // 🔄 Handle different tool states
  if (tool.state === 'partial-call' || tool.state === 'call') {
    return (
      <CollapsibleMessage
        role="assistant"
        isCollapsible={true}
        header={header}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        showIcon={false}
      >
        <SearchSkeleton />
      </CollapsibleMessage>
    )
  }

  if (tool.state === 'error') {
    return (
      <CollapsibleMessage
        role="assistant"
        isCollapsible={true}
        header={header}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        showIcon={false}
      >
        <div className="text-red-500 text-sm py-2">
          Failed to fetch search results. Please try again.
        </div>
      </CollapsibleMessage>
    )
  }

  if (tool.state === 'result') {
    const searchResults: TypeSearchResults = tool.result

    return (
      <CollapsibleMessage
        role="assistant"
        isCollapsible={true}
        header={header}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        showIcon={false}
      >
        {searchResults?.images?.length > 0 && (
          <Section>
            <SearchResultsImageSection
              images={searchResults.images}
              query={query}
            />
          </Section>
        )}

        {searchResults?.results?.length > 0 && (
          <Section title="Sources">
            <SearchResults results={searchResults.results} />
          </Section>
        )}
      </CollapsibleMessage>
    )
  }

  // 🔒 If the state is unrecognized, return null
  return null
}
