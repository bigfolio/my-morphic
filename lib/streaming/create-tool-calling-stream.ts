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
//import { handleStreamFinish } from './handle-stream-finish'
import { BaseStreamConfig } from './types'

// ✅ Import search tool for debug testing
import { searchTool } from '@/lib/tools/search'

// ✅ Inline this interface here to avoid TS build error
interface HandleStreamFinishParams {
  responseMessages: CoreMessage[]
  originalMessages: CoreMessage[]
  model: string
  chatId: string
  dataStream: DataStreamWriter
  skipRelatedQuestions: boolean
  addToolResult?: (result: any) => void
}

// ✅ Extended config with addToolResult
export function createToolCallingStreamResponse(
  config: BaseStreamConfig & { addToolResult?: (result: any) => void }
) {
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

        let researcherConfig = await researcher({
          messages: truncatedMessages,
          model: modelId,
          searchMode
        })

        console.log('🔧 researcherConfig:', JSON.stringify(researcherConfig, null, 2))

        // 🧪 DEBUG: Manually test searchTool
        try {
          console.log('🧪 Forcing searchTool to run manually with query "cats"')
          const debugResult = await searchTool.execute(
            {
              query: 'cats',
              max_results: 5,
              search_depth: 'basic',
              include_domains: [],
              exclude_domains: []
            },
            {
              toolCallId: 'debug-test',
              messages: []
            }
          )
          console.log('🧪 Manual search result:', JSON.stringify(debugResult, null, 2))
        } catch (manualError) {
          console.error('❌ Manual searchTool.execute() failed:', manualError)
        }

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

            await handleStreamFinish({
              responseMessages: result.response.messages,
              originalMessages: messages,
              model: modelId,
              chatId,
              dataStream,
              skipRelatedQuestions: shouldSkipRelatedQuestions,
              addToolResult: config.addToolResult // ✅ now TypeScript is happy
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

// 🔍 Utility to detect ask_question tool use
function containsAskQuestionTool(message: CoreMessage) {
  if (message.role !== 'assistant' || !Array.isArray(message.content)) return false
  return message.content.some(
    item => item.type === 'tool-call' && item.toolName === 'ask_question'
  )
}
