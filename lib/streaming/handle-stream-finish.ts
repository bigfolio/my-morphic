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
  // Convert the response messages into standard format
  const finalMessages: Message[] = responseMessages.map(msg => {
    const id = 'id' in msg ? msg.id : crypto.randomUUID()

    if (msg.role === 'assistant') {
      return {
        id,
        role: 'assistant',
        content: Array.isArray(msg.content)
          ? msg.content
              .filter((c: any): c is { type: 'text'; text: string } => c.type === 'text')
              .map(c => c.text)
              .join('')
          : msg.content
      }
    }

    if ((msg as any).role === 'tool') {
      return {
        id,
        role: 'data',
        content: JSON.stringify((msg as any).content)
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

  // ✅ Add structured tool result to render search UI
  const lastToolMsg = responseMessages.find(m => (m as any).role === 'tool')

if (addToolResult && lastToolMsg) {
  const toolResult = {
    tool: 'search',
    state: 'result',
    ...(typeof lastToolMsg.content === 'object' ? lastToolMsg.content : {})
  }

  console.log('🧪 Sending toolResult into addToolResult:', toolResult)
  addToolResult(toolResult) // ✅ This is how Morphic gets the structured data
}
}


  dataStream.close()
}
