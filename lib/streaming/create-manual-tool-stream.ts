
import { researcher } from '@/lib/agents/researcher'
import {
  convertToCoreMessages,
  CoreMessage,
  createDataStreamResponse,
  DataStreamWriter,
  streamText,
} from 'ai'
import { getMaxAllowedTokens, truncateMessages } from '../utils/context-window'
import { isReasoningModel } from '../utils/registry'
import { handleStreamFinish } from './handle-stream-finish'
import { BaseStreamConfig, HandleStreamFinishParams } from './types'
import { searchTool } from '@/lib/tools/search'

function containsAskQuestionTool(message: CoreMessage) {
  if (message.role !== 'assistant' || !Array.isArray(message.content)) {
    return false
  }

  return message.content.some(
    item => item.type === 'tool-call' && item.toolName === 'ask_question'
  )
}

export function createManualToolStreamResponse(config: BaseStreamConfig & { addToolResult?: (result: any) => void }) {
  return createDataStreamResponse({
    execute: async (dataStream: DataStreamWriter) => {
      const { messages, model, chatId, searchMode } = config
      const modelId = `${model.providerId}:${model.id}`

      try {
        const coreMessages = convertToCoreMessages(messages)
        const truncatedMessages = truncateMessages(
          coreMessages,
          getMaxAllowedTokens(model)
        )

        const researcherConfig = await researcher({
          messages: truncatedMessages,
          model: modelId,
          searchMode
        })

        const result = streamText({
          ...researcherConfig,
          onFinish: async result => {
            const shouldSkipRelatedQuestions =
              isReasoningModel(modelId) ||
              (result.response.messages.length > 0 &&
                containsAskQuestionTool(
                  result.response.messages[
                    result.response.messages.length - 1
                  ] as CoreMessage
                ))

            // ✅ Convert ResponseMessage[] to Message[]
            const convertedMessages = result.response.messages.map(msg => {
              if (msg.role === 'assistant') {
                return {
                  role: msg.role,
                  content: Array.isArray(msg.content)
					? msg.content.map(c => c.text ?? '').join('')
					: msg.content
                }
              } else {
                return {
                  role: msg.role,
                  content: typeof msg.content === 'string' ? msg.content : ''
                }
              }
            })

            await handleStreamFinish({
              responseMessages: result.response.messages as any[], // Casting to avoid type error
              originalMessages: messages,
              model: modelId,
              chatId,
              dataStream,
              skipRelatedQuestions: shouldSkipRelatedQuestions,
              addToolResult: config.addToolResult
            })
          }
        })

        result.mergeIntoDataStream(dataStream)
      } catch (error) {
        console.error('Stream execution error:', error)
        throw error
      }
    },
    onError: error => {
      return error instanceof Error ? error.message : String(error)
    }
  })
}
