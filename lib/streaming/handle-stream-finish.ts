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
    const id = 'id' in msg ? msg.id : crypto.randomUUID()

    if (msg.role === 'assistant') {
      return {
        id,
        role: 'assistant',
        content: Array.isArray(msg.content)
          ? msg.content
              .filter((c: any): c is { type: 'text'; text: string } => c.type === 'text')
              .map((c: { text: string }) => c.text)
              .join('')
          : msg.content
      }
    }

    // ✅ Do NOT stringify tool message content here — we’ll handle it cleanly below
    if (msg.role === 'tool') {
      return {
        id,
        role: 'tool',
        content: msg.content
      }
    }

    return {
      id,
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : ''
    }
  })

  // ✅ Write messages (excluding tool result formatting)
  for (const message of finalMessages) {
    if (message.role !== 'tool') {
      dataStream.write(message)
    }
  }

  // ✅ Pull tool result and format it *once*
  const lastToolMsg = responseMessages.find(
    (m: any) =>
      m.role === 'tool' &&
      typeof m.content === 'object' &&
      m.content !== null &&
      'tool' in m.content &&
      m.content.tool === 'search'
  )

  if (addToolResult && lastToolMsg) {
    const toolResultContent = {
      tool: 'search',
      state: 'result',
      ...(typeof lastToolMsg.content === 'object' ? lastToolMsg.content : {})
    }

    console.log('🧪 Sending toolData into addToolResult:', toolResultContent)

    addToolResult({
      role: 'data',
      content: toolResultContent
    })

    dataStream.write({
      id: crypto.randomUUID(),
      role: 'data',
      content: JSON.stringify(toolResultContent)
    })
  }

  dataStream.close()
}
