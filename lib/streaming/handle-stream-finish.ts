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
    const toolData = lastToolMsg.content
    addToolResult(toolData)

    const imageResults = toolData?.images ?? []

    const searchToolData = {
      type: 'imageResults',
      images: imageResults,
      toolName: 'searchTool',
    }

    console.log('🧪 Writing to stream:', {
      id: 'generated-id',
      role: 'data',
      content: JSON.stringify(searchToolData)
    })

    // ✅ Fix: Cast to correct union type to satisfy TypeScript
    dataStream.write(`a:${JSON.stringify(searchToolData)}` as any)

    // ✅ Write non-tool messages
    for (const message of responseMessages.filter(m => m.role !== 'tool')) {
      dataStream.write(message)
    }
  }
}
