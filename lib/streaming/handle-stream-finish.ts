import { castToStreamChunk } from '../utils/stream'
import { HandleStreamFinishParams, StreamChunk } from './types'
import type { Message } from 'ai'

type ExtendedMessage = Message & {
  role: 'system' | 'user' | 'assistant' | 'tool' | 'data'
}

export async function handleStreamFinish({
  responseMessages,
  originalMessages,
  model,
  chatId,
  dataStream,
  addToolResult
}: HandleStreamFinishParams) {
  console.log('🚀 handleStreamFinish() was called')

  // 👇 Forcefully cast array to ExtendedMessage[]
  const messages = responseMessages as ExtendedMessage[]

  const lastToolMsg = messages.find(
    (m) =>
      m.role === 'tool' &&
      typeof m.content === 'object' &&
      m.content !== null &&
      (m.content as any).tool === 'search'
  )

  console.log('🧪 lastToolMsg:', lastToolMsg)

  if (lastToolMsg && addToolResult) {
    const toolDataRaw = lastToolMsg.content
    addToolResult(toolDataRaw)

    const toolData = typeof toolDataRaw === 'string'
      ? JSON.parse(toolDataRaw)
      : toolDataRaw

    const searchToolData = {
      type: 'imageResults',
      images: toolData?.images ?? [],
      toolName: 'searchTool',
    }

    const chunk = `a:${JSON.stringify(searchToolData)}` as StreamChunk
    dataStream.write(castToStreamChunk(chunk))
  }

  for (const message of messages) {
    if (message.role !== 'tool') {
      dataStream.write(message)
    }
  }
}
