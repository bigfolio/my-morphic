'use client'

import { CHAT_ID } from '@/lib/constants'
import { Model } from '@/lib/types/models'
import { useChat } from 'ai/react' // ✅ NOT '@ai-sdk/react'
import { Message } from 'ai/react'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { ChatMessages } from './chat-messages'
import { ChatPanel } from './chat-panel'
import { SearchSection } from './search-section' // ✅ Make sure this path is correct

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

// ✅ Log the data AFTER the hook runs
console.log('🧪 useChat().data:', data)

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
   // setData(undefined) // reset data to clear tool call
    handleSubmit(e)
  }

  // ✅ DEBUG LOG
  console.log('🧪 tool data:', data)

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
     {typeof data === 'object' &&
  data !== null &&
  !Array.isArray(data) &&
  'role' in data &&
  (data as any).role === 'data' &&
  'content' in data &&
  typeof (data as any).content === 'object' &&
  (data as any).content.tool === 'search' &&
  (data as any).content.state === 'result' && (
    <SearchSection
      tool={(data as any).content}
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
