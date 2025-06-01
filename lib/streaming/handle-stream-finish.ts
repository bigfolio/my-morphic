import { Message } from 'ai'
import { DataStreamWriter } from 'ai'
import { HandleStreamFinishParams, StreamChunk } from './types'
import { castToStreamChunk } from '../utils/stream'

export type ExtendedMessage = Message & {
  role: 'system' | 'user' | 'assistant' | 'tool' | 'data'
}

export async function handleStreamFinish({
  responseMessages,
  originalMessages,
  model,
  chatId,
  dataStream,
  addToolResult
}: Omit<HandleStreamFinishParams, 'responseMessages'> & {
  responseMessages: ExtendedMessage[]
}) {
  console.log('🚀 handleStreamFinish() was called')

  const lastToolMsg = responseMessages.find(
    (m) =>
      m.role === 'tool' &&
      typeof m.content === 'object' &&
      m.content !== null &&
      m.content.tool === 'search'
  )

  console.log('🧪 lastToolMsg:', lastToolMsg)

  if (lastToolMsg && addToolResult) {
    const toolDataRaw = lastToolMsg.content
    const toolData = typeof toolDataRaw === 'string'
      ? JSON.parse(toolDataRaw)
      : toolDataRaw

    addToolResult(toolData)

    const searchToolData = {
      type: 'imageResults',
      images: toolData?.images ?? [],
      toolName: 'searchTool',
    }

    const chunk = `a:${JSON.stringify(searchToolData)}` as StreamChunk
    dataStream.write(castToStreamChunk(chunk))
  }

  for (const message of responseMessages) {
    if (message.role !== 'tool') {
      dataStream.write(message)
    }
  }
}
