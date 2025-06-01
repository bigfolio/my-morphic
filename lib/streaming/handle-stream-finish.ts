import { Message } from 'ai'
import { DataStreamWriter } from 'ai'
import { HandleStreamFinishParams, StreamChunk } from './types' // ✅ StreamChunk from types.ts
import { castToStreamChunk } from '../utils/stream' // ✅ castToStreamChunk from utils/stream

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
}: HandleStreamFinishParams & { responseMessages: ExtendedMessage[] }) {
  console.log('🚀 handleStreamFinish() was called')

  const lastToolMsg = responseMessages.find(
    (m: any) =>
      m.role === 'tool' &&
      typeof m.content === 'object' &&
      m.content !== null &&
      m.content.tool === 'search'
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

  // ✅ Write non-tool messages
  for (const message of responseMessages.filter(m => m.role !== 'tool')) {
    dataStream.write(message)
  }
}
