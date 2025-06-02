import { DataStreamWriter, Message } from 'ai'
import { HandleStreamFinishParams, StreamChunk } from './types'
import { serializeMessageToChunk, castToStreamChunk } from '../utils/stream'

export async function handleStreamFinish({
  responseMessages,
  originalMessages,
  model,
  chatId,
  dataStream,
  addToolResult,
}: Omit<HandleStreamFinishParams, 'responseMessages'> & {
  responseMessages: Message[]
}) {
  console.log('🚀 handleStreamFinish() called')

  const lastToolMsg = responseMessages.find((m) => {
    return (
      (m as any).role === 'tool' &&
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

    const chunkString = `a:${JSON.stringify(chunkPayload)}`;
// Ensure the prefix is valid
if (!['a'].includes(chunkString.split(':')[0])) {
  throw new Error('Invalid prefix');
}

// Cast to StreamChunk only after confirming the format
dataStream.write(castToStreamChunk(chunkString)); 
  }

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
