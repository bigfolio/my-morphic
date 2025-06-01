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

  interface ToolMessage extends Message {
  role: 'tool'
  content: {
    tool: string
    [key: string]: any
  }
}

const lastToolMsg = (responseMessages as Message[]).find(
  (m): m is ToolMessage =>
    (m as ToolMessage).role === 'tool' &&
    typeof m.content === 'object' &&
    m.content !== null &&
    'tool' in m.content
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
