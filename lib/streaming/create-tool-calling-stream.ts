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

export function createToolCallingStreamResponse(
  config: BaseStreamConfig & {
    addToolResult?: (result: any) => void
  }
) {
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
  responseMessages: result.response.messages.map((msg: any) => {
    const id = 'id' in msg ? msg.id : crypto.randomUUID()
    if (msg.role === 'assistant') {
      return {
        id,
        role: 'assistant',
        content: Array.isArray(msg.content)
          ? msg.content
              .filter((c: any): c is { type: 'text'; text: string } => c.type === 'text')
              .map(c => c.text)
              .join('')
          : msg.content
      }
    }
    if (msg.role === 'tool') {
      return {
        id,
        role: 'data',
        content: JSON.stringify(msg.content)
      }
    }
    return {
      id,
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : ''
    }
  }),
  originalMessages: messages,
  model: modelId,
  chatId,
  dataStream,
  skipRelatedQuestions: shouldSkipRelatedQuestions,
  ...(config.addToolResult && { addToolResult: config.addToolResult }) // ✅ conditionally spread
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
