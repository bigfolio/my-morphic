import { researcher } from '@/lib/agents/researcher'
import {
  convertToCoreMessages,
  CoreMessage,
  createDataStreamResponse,
  DataStreamWriter,
  streamText
} from 'ai'
import { getMaxAllowedTokens, truncateMessages } from '../utils/context-window'
import { isReasoningModel } from '../utils/registry'
import { handleStreamFinish } from './handle-stream-finish'
import { BaseStreamConfig } from '@/lib/streaming/types'
import { searchTool } from '@/lib/tools/search'
import { HandleStreamFinishParams } from '@/lib/streaming/types'

console.log('🧪 Type Keys:', Object.keys({} as HandleStreamFinishParams))


function containsAskQuestionTool(message: CoreMessage) {
  if (message.role !== 'assistant' || !Array.isArray(message.content)) return false
  return message.content.some(
    item => item.type === 'tool-call' && item.toolName === 'ask_question'
  )
}

export function createManualToolStreamResponse(
  config: BaseStreamConfig & { addToolResult?: (result: any) => void }
) {
  return createDataStreamResponse({
    execute: async (dataStream: DataStreamWriter) => {
      const { messages, model, chatId, searchMode, addToolResult } = config
      const modelId = `${model.providerId}:${model.id}`

      const researcherConfig = await researcher({
        messages: truncateMessages(
          convertToCoreMessages(messages),
          getMaxAllowedTokens(model)
        ),
        model: modelId,
        searchMode: 'advanced' // ✅ convert string to boolean
      })

      const result = streamText({
        ...researcherConfig,
        onFinish: async (result) => {
          const shouldSkipRelatedQuestions =
            isReasoningModel(modelId) ||
            (result.response.messages.length > 0 &&
              containsAskQuestionTool(
                result.response.messages[
                  result.response.messages.length - 1
                ] as CoreMessage
              ))

          const plainMessages = result.response.messages.map((msg: any) => {
            const id = 'id' in msg ? msg.id : crypto.randomUUID()

            if (msg.role === 'assistant' || msg.role === 'tool') {
              return {
                id,
                role: msg.role === 'tool' ? 'data' : 'assistant',
                content: Array.isArray(msg.content)
                  ? msg.content
                      .filter((c: any) => c.type === 'text')
                      .map((c: any) => c.text)
                      .join('')
                  : msg.content
              }
            }

            return {
              id,
              role: msg.role,
              content: typeof msg.content === 'string' ? msg.content : ''
            }
          })

          await handleStreamFinish({
            responseMessages: plainMessages,
            originalMessages: messages,
            model,
            chatId,
            dataStream,
            skipRelatedQuestions: shouldSkipRelatedQuestions,
            addToolResult
          })
        }
      })

      result.mergeIntoDataStream(dataStream)
    },
    onError: (err) =>
      err instanceof Error ? err.message : String(err)
  })
}
