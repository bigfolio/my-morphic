import { Message } from 'ai'
import { DataStreamWriter } from 'ai'
import { HandleStreamFinishParams } from './types'

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

let toolData: any = toolDataRaw
if (typeof toolDataRaw === 'string') {
  try {
    toolData = JSON.parse(toolDataRaw)
  } catch (err) {
    console.error('Failed to parse toolData:', err)
    toolData = {}
  }
}

const imageResults = toolData?.images ?? []

const searchToolData = {
  type: 'imageResults',
  images: imageResults,
  toolName: 'searchTool',
}

dataStream.write(`a:${JSON.stringify(searchToolData)}` as any)

    // ✅ Write non-tool messages
    for (const message of responseMessages) {
  // Skip message if it's the special search tool message we already handled
  if (
    typeof message.content === 'object' &&
    message.content !== null &&
    (message.content as any).tool === 'search'
  ) {
    continue
  }

  dataStream.write(message)
}
  }
}
