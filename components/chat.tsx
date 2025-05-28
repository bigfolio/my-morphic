'use client'

import { CHAT_ID } from '@/lib/constants'
import { Model } from '@/lib/types/models'
import { useChat } from 'ai/react'
import { Message } from 'ai'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { ChatMessages } from './chat-messages'
import { ChatPanel } from './chat-panel'
import { SearchSection } from './search-section'
import type { ToolInvocation } from 'ai'

type SearchToolData = ToolInvocation & {
  tool: 'search'
  state: 'result'
  result?: {
    query?: string
    results?: any[]
    images?: {
      url: string
      description: string
    }[]
  }
}

export function Chat({
  id,
  savedMessages = [],
  query,
  models
}: {
  id: string
  savedMessages?: Message[]
  query?: string
  models?: Model[]
}) {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    setMessages,
    stop,
    append,
    data,
    setData,
    addToolResult
  } = useChat({
    initialMessages: savedMessages,
    id: CHAT_ID,
    body: {
      id
    },
    onFinish: () => {
      window.history.replaceState({}, '', `/search/${id}`)
    },
    onError: error => {
      toast.error(`Error in chat: ${error.message}`)
    },
    sendExtraMessageFields: false,
    experimental_throttle: 100
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    setMessages(savedMessages)
  }, [id])

  const onQuerySelect = (query: string) => {
    append({
      role: 'user',
      content: query
    })
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setData(undefined)
    handleSubmit(e)
  }

  console.log('🧪 useChat().data:', data)

  const isSearchToolResult =
    typeof data === 'object' &&
    data !== null &&
    !Array.isArray(data) &&
    'tool' in data &&
    (data as any).tool === 'search' &&
    'state' in data &&
    (data as any).state === 'result'

  return (
    <div className="flex flex-col w-full max-w-3xl pt-14 pb-32 mx-auto stretch">
      <ChatMessages
        messages={messages}
        data={data}
        onQuerySelect={onQuerySelect}
        isLoading={isLoading}
        chatId={id}
        addToolResult={addToolResult}
      />

      {/* ✅ Conditionally show search section if tool result is available */}
      {isSearchToolResult && (
        <SearchSection
          tool={data as SearchToolData}
          isOpen={true}
          onOpenChange={() => {}}
        />
      )}

      <ChatPanel
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={onSubmit}
        isLoading={isLoading}
        messages={messages}
        setMessages={setMessages}
        stop={stop}
        query={query}
        append={append}
        models={models}
      />
    </div>
  )
}
