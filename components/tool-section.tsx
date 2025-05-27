import type { ToolInvocation } from 'ai'
import { QuestionConfirmation } from './question-confirmation'
import RetrieveSection from './retrieve-section'
import { SearchSection } from './search-section'
import { VideoSearchSection } from './video-search-section'
import { SearchSection, SearchToolData } from './search-section'


interface ToolSectionProps {
  tool: ToolInvocation
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  addToolResult?: (params: { toolCallId: string; result: any }) => void
}

// Optional: define a safe type for SearchToolData
type SearchToolData = ToolInvocation & {
  toolName: 'search'
  state: 'call' | 'partial-call' | 'result'
  result?: {
    query?: string
    results?: any[]
    images?: { url: string; description: string }[]
  }
}

export function ToolSection({
  tool,
  isOpen,
  onOpenChange,
  addToolResult
}: ToolSectionProps) {
  if (tool.toolName === 'ask_question') {
    if (tool.state === 'call' && addToolResult) {
      return (
        <QuestionConfirmation
          toolInvocation={tool}
          onConfirm={(toolCallId, approved, response) => {
            addToolResult({
              toolCallId,
              result: approved
                ? response
                : {
                    declined: true,
                    skipped: response?.skipped,
                    message: 'User declined this question'
                  }
            })
          }}
        />
      )
    }

    if (tool.state === 'result') {
      return (
        <QuestionConfirmation
          toolInvocation={tool}
          isCompleted={true}
          onConfirm={() => {}}
        />
      )
    }
  }

  // ✅ Check before asserting tool as SearchToolData
  if (tool.toolName === 'search') {
    return (
      <SearchSection
        tool={tool as SearchToolData}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
      />
    )
  }

  if (tool.toolName === 'video_search') {
    return (
      <VideoSearchSection
        tool={tool}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
      />
    )
  }

  if (tool.toolName === 'retrieve') {
    return (
      <RetrieveSection
        tool={tool}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
      />
    )
  }

  return null
}
