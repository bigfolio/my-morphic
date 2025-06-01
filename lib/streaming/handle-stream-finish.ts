import { Message } from 'ai'
import { DataStreamWriter } from 'ai'
import { HandleStreamFinishParams } from './types'
import { castToStreamChunk } from '../utils/stream'

export async function handleStreamFinish({
  responseMessages,
  originalMessages,
  model,
  chatId,
  dataStream,
  addToolResult
}: HandleStreamFinishParams) {
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

// ✅ Parse it if it's a string (extra safety)
const toolData = typeof toolDataRaw === 'string'
  ? JSON.parse(toolDataRaw)
  : toolDataRaw

const imageResults = toolData?.images ?? []

const searchToolData = {
  type: 'imageResults',
  images: imageResults,
  toolName: 'searchTool',
}

dataStream.write(
  castToStreamChunk(`a:${JSON.stringify(searchToolData)}` as StreamChunk)
)
  }

  // ✅ Write non-tool messages
  for (const message of responseMessages.filter(m => m.role !== 'tool')) {
    dataStream.write(message)
  }
}
