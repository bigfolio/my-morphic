'use client'

import type { ToolInvocation } from 'ai'
import { QuestionConfirmation } from './question-confirmation'
import RetrieveSection from './retrieve-section'
import { VideoSearchSection } from './video-search-section'
import { SearchSection, SearchToolData } from './search-section' // ✅ Only one source

interface ToolSectionProps {
  tool: ToolInvocation
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  addToolResult?: (params: { toolCallId: string; result: any }) => void
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
