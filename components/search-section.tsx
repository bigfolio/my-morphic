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

interface SearchSectionProps {
  tool: ToolInvocation
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchSection({
  tool,
  isOpen,
  onOpenChange
}: SearchSectionProps) {
  const { isLoading } = useChat({ id: CHAT_ID })

  // ✅ Declare values early to avoid reference errors
  const query = tool.args?.query as string | undefined
  const includeDomains = tool.args?.includeDomains as string[] | undefined
  const includeDomainsString = includeDomains
    ? ` [${includeDomains.join(', ')}]`
    : ''

  const isToolLoading = tool.state === 'call' || tool.state === 'partial-call'
  const searchResults: TypeSearchResults =
    tool.state === 'result' ? tool.result : undefined

  // Header to show query string and domains
  const header = (
    <ToolArgsSection tool="search" number={searchResults?.results?.length}>
      {query || 'Searching...'}
      {includeDomainsString}
    </ToolArgsSection>
  )

  if (isToolLoading) {
    return (
      <CollapsibleMessage
        role="assistant"
        isCollapsible={true}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        showIcon={false}
        header={header}
      >
        <SearchSkeleton />
      </CollapsibleMessage>
    )
  }

  return (
    <CollapsibleMessage
      role="assistant"
      isCollapsible={true}
      header={header}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      showIcon={false}
    >
      {/* Images section */}
      {searchResults?.images?.length > 0 && (
        <Section>
          <SearchResultsImageSection images={searchResults.images} query={query} />
        </Section>
      )}

      {/* Text results */}
      {searchResults?.results?.length > 0 && (
        <Section title="Sources">
          <SearchResults results={searchResults.results} />
        </Section>
      )}
    </CollapsibleMessage>
  )
}
