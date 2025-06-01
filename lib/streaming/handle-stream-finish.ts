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
//  const messages = responseMessages as ExtendedMessage[]

 type ToolMessage = {
  role: 'tool'
  content: {
    tool: string
    [key: string]: any
  }
}

const lastToolMsg = responseMessages.find((m) => {
  return (
    (m as any).role === 'tool' &&
    typeof (m as any).content === 'object' &&
    (m as any).content !== null &&
    'tool' in (m as any).content
  )
})

if (lastToolMsg && addToolResult) {
  const toolDataRaw = (lastToolMsg as any).content

  addToolResult(toolDataRaw)

  const toolData =
    typeof toolDataRaw === 'string'
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


for (const message of responseMessages as ExtendedMessage[]) {
  if (message.role !== 'tool') {
    dataStream.write(message);
  }
}
}
