import { castToStreamChunk } from '../utils/stream'
import { HandleStreamFinishParams, StreamChunk, ExtendedMessage } from './types'

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

    const toolData =
      typeof toolDataRaw === 'string' ? JSON.parse(toolDataRaw) : toolDataRaw

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
