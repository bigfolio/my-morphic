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
  // Step 1: Convert assistant and user messages to basic format
  const finalMessages: Message[] = responseMessages.map((msg: any) => {
    const id = 'id' in msg ? msg.id : crypto.randomUUID()

    if (msg.role === 'assistant') {
  return {
    id,
    role: 'assistant',
    content: Array.isArray(msg.content)
      ? msg.content
          .filter((c: any): c is { type: 'text'; text: string } => c.type === 'text')
          .map((c: { type: 'text'; text: string }) => c.text)
          .join('')
      : msg.content
  }
}


    // Stream tool results into data
    if (msg.role === 'tool') {
      return {
        id,
        role: 'data',
        content: JSON.stringify({
          tool: 'search',
          state: 'result',
          ...(typeof msg.content === 'object' ? msg.content : {})
        })
      }
    }

    return {
      id,
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : ''
    }
  })

  // Step 2: Stream all formatted messages back
  for (const message of finalMessages) {
    dataStream.write(message)
  }

  // Step 3: Use addToolResult to populate the `data` field if provided
  const lastToolMsg = responseMessages.find(m => m.role === 'tool')

  if (addToolResult && lastToolMsg) {
    const toolData = {
      tool: 'search',
      state: 'result',
      ...(typeof lastToolMsg.content === 'object' ? lastToolMsg.content : {})
    }

    console.log('🧪 Sending toolData into addToolResult:', toolData)
    addToolResult(toolData)
  }

  dataStream.close()
}
