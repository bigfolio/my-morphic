import { DataStreamWriter, Message as BaseMessage } from 'ai'
import { HandleStreamFinishParams } from './types'
import { serializeMessageToChunk } from '../utils/stream'

type ToolRole = 'tool'
type ExtendedMessage = BaseMessage & { role: BaseMessage['role'] | ToolRole }

export async function handleStreamFinish({
  responseMessages,
  originalMessages,
  model,
  chatId,
  dataStream,
  addToolResult,
}: Omit<HandleStreamFinishParams, 'responseMessages'> & {
  responseMessages: ExtendedMessage[]
}) {
  console.log('🚀 handleStreamFinish() called')

  const lastToolMsg = responseMessages.find((m): m is ExtendedMessage => {
    return (
      m.role === 'tool' &&
      typeof m.content === 'object' &&
      m.content !== null &&
      (m.content as any).tool === 'search'
    )
  })

  console.log('🧪 lastToolMsg:', lastToolMsg)

  if (lastToolMsg && addToolResult) {
    const rawContent = lastToolMsg.content
    addToolResult(rawContent)

    const parsed =
      typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent

    const chunkPayload = {
      type: 'imageResults',
      images: parsed?.images ?? [],
      toolName: 'searchTool',
    }

    const chunk = `a:${JSON.stringify(chunkPayload)}` as const
    dataStream.write(chunk)
  }

  // ✅ Correctly serialize and stream remaining messages
  for (const message of responseMessages) {
    if (
      message.role === 'system' ||
      message.role === 'user' ||
      message.role === 'assistant' ||
      message.role === 'data'
    ) {
      dataStream.write(serializeMessageToChunk(message))
    }
  }
}
