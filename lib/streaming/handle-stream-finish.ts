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

  for (const message of finalMessages) {
    dataStream.write(message)
  }

  const lastToolMsg = responseMessages.find(
    (m: any) =>
      m.role === 'tool' &&
      typeof m.content === 'object' &&
      m.content !== null &&
      'tool' in m.content &&
      m.content.tool === 'search'
  )

  if (addToolResult && lastToolMsg) {
    const toolData = {
      role: 'data',
      content: {
        tool: 'search',
        state: 'result',
        ...(typeof lastToolMsg.content === 'object' ? lastToolMsg.content : {})
      }
    }

    console.log('🧪 Sending toolData into addToolResult:', toolData)

    addToolResult(toolData)
    dataStream.write({
      id: crypto.randomUUID(),
      role: 'data',
      content: JSON.stringify(toolData.content)
    })
  }

  dataStream.close()
}
