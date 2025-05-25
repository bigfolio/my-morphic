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
  const finalMessages: Message[] = responseMessages.map(msg => {
    const id = 'id' in msg ? msg.id : crypto.randomUUID()

    if (msg.role === 'assistant') {
      return {
        id,
        role: 'assistant',
        content: Array.isArray(msg.content)
          ? msg.content
              .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
              .map(c => c.text)
              .join('')
          : msg.content
      }
    }

    if ((msg as any).role === 'tool') {
      return {
        id,
        role: 'data',
        content: msg.content as any
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

 if (addToolResult) {
  console.log('✅ addToolResult exists')

  const lastToolMsg = responseMessages.find(m => (m as any).role === 'tool')

  if (lastToolMsg) {
    const toolData = {
      tool: 'search',
      state: 'result',
      ...(typeof lastToolMsg.content === 'object' ? lastToolMsg.content : {})
    }

    console.log('🧪 Sending toolData into addToolResult:', toolData)
    addToolResult(toolData)
  } else {
    console.log('⚠️ No tool message found in responseMessages')
  }
} else {
  console.log('❌ addToolResult is undefined')
}


  dataStream.close()
}
