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

export type SearchToolData =
  | {
      tool: 'search'
      state: 'call' | 'partial-call'
    }
  | {
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
  const { isLoading } = useChat({
    id: CHAT_ID
  })

  // 🔄 Handle loading or intermediate tool call states
  if (tool.state === 'partial-call' || tool.state === 'call') {
    return (
      <CollapsibleMessage
        role="assistant"
        isCollapsible
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        showIcon={false}
        header={<ToolArgsSection tool="search" />}
      >
        <SearchSkeleton />
      </CollapsibleMessage>
    )
  }

  // ✅ Extract values from final result
  const query = tool.query
  const results = tool.results
  const images = tool.images || []

  const includeDomainsString = '' // placeholder if you plan to add domains later

  const header = (
    <ToolArgsSection tool="search" number={results?.length}>
      {`${query}${includeDomainsString}`}
    </ToolArgsSection>
  )

  return (
    <CollapsibleMessage
      role="assistant"
      isCollapsible={true}
      header={header}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      showIcon={false}
    >
      {images.length > 0 && (
        <Section>
          <SearchResultsImageSection images={images} query={query} />
        </Section>
      )}
      {results?.length > 0 ? (
        <Section title="Sources">
          <SearchResults results={results} />
        </Section>
      ) : null}
    </CollapsibleMessage>
  )
}
