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
import { BaseStreamConfig } from './types'
import { searchTool } from '@/lib/tools/search'

function containsAskQuestionTool(message: CoreMessage) {
  if (message.role !== 'assistant' || !Array.isArray(message.content)) return false
  return message.content.some(
    item => item.type === 'tool-call' && item.toolName === 'ask_question'
  )
}

export function createToolCallingStreamResponse(config: BaseStreamConfig) {
  return createDataStreamResponse({
    execute: async (dataStream: DataStreamWriter) => {
      const { messages, model, chatId, searchMode, addToolResult } = config
      const modelId = `${model.providerId}:${model.id}`

      try {
        const coreMessages = convertToCoreMessages(messages)
        const truncatedMessages = truncateMessages(coreMessages, getMaxAllowedTokens(model))

        const researcherConfig = await researcher({
          messages: truncatedMessages,
          model: modelId,
          searchMode
        })

        console.log('🔧 researcherConfig:', JSON.stringify(researcherConfig, null, 2))

        const result = streamText({
          ...researcherConfig,
          onFinish: async result => {
            const shouldSkipRelatedQuestions =
              isReasoningModel(modelId) ||
              (result.response.messages.length > 0 &&
                containsAskQuestionTool(
                  result.response.messages[result.response.messages.length - 1] as CoreMessage
                ))

            await handleStreamFinish({
              responseMessages: result.response.messages,
              originalMessages: messages,
              model: modelId,
              chatId,
              dataStream,
              skipRelatedQuestions: shouldSkipRelatedQuestions,
              addToolResult // ✅ this is what makes `data` available
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
