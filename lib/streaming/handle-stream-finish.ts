import { DataStreamWriter, Message as BaseMessage } from 'ai'
import { HandleStreamFinishParams, StreamChunk } from './types'
import { castToStreamChunk } from '../utils/stream'

// ✅ Extend Message to include custom 'tool' role
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
  console.log('🚀 handleStreamFinish() was called')

  const lastToolMsg = responseMessages.find((m) => {
    const msg = m as ExtendedMessage
    return (
      msg.role === 'tool' &&
      typeof msg.content === 'object' &&
      msg.content !== null &&
      (msg.content as any).tool === 'search'
    )
  }) as ExtendedMessage | undefined

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
    if (
      message.role === 'system' ||
      message.role === 'user' ||
      message.role === 'assistant' ||
      message.role === 'data'
    ) {
      dataStream.write(message)
    }
  }
}
