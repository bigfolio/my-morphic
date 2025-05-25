import { DataStreamWriter, Message } from 'ai'
import { HandleStreamFinishParams } from './types'

export async function handleStreamFinish({
  responseMessages,
  originalMessages,
  model,
  chatId,
  dataStream,
  skipRelatedQuestions,
  addToolResult
}: HandleStreamFinishParams) {
  const finalMessages: Message[] = responseMessages.map((msg: any) => {
    const id = msg.id || crypto.randomUUID()

    if (msg.role === 'assistant') {
      return {
        id,
        role: 'assistant',
        content: Array.isArray(msg.content)
          ? msg.content
              .filter((c: any) => c.type === 'text')
              .map((c: any) => c.text)
              .join('')
          : msg.content
      }
    }

    if (msg.role === 'tool') {
      return {
        id,
        role: 'data',
        content: JSON.stringify(msg.content) // 🧠 Important: stringify here
      }
    }

    return {
      id,
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : ''
    }
  })

  for (const message of finalMessages) {
    dataStream.write(message)
  }

  // ✅ Add structured tool result so `data` becomes populated in `useChat()`
  const lastToolMsg = responseMessages.find((m: any) => m.role === 'tool')

  if (addToolResult && lastToolMsg) {
    const toolData = {
      role: 'data',
      content: {
        tool: 'search',
        state: 'result',
        ...(typeof lastToolMsg.content === 'object'
          ? lastToolMsg.content
          : JSON.parse(lastToolMsg.content || '{}'))
      }
    }

    console.log('🧪 Sending toolData into addToolResult:', toolData)
    addToolResult(toolData)
    dataStream.write(toolData)
  }

  dataStream.close()
}
