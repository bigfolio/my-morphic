import { createManualToolStreamResponse } from '@/lib/streaming/create-manual-tool-stream'
import { createToolCallingStreamResponse } from '@/lib/streaming/create-tool-calling-stream'
import { Model } from '@/lib/types/models'
import { isProviderEnabled } from '@/lib/utils/registry'
import { cookies } from 'next/headers'

export const maxDuration = 30

// Updated to use GPT-4-turbo
const DEFAULT_MODEL: Model = {
  id: 'gpt-4-turbo',
  name: 'GPT-4-turbo',
  provider: 'OpenAI',
  providerId: 'openai',
  enabled: true,
  toolCallType: 'native'
}

// System prompt that avoids asking for clarification
const SYSTEM_PROMPT = {
  role: 'system',
  content:
    `You are an intelligent assistant. Provide direct, relevant, and informative responses without asking for clarification. 
    If a single word is provided, give a complete explanation of that term based on known data. 
    Do not ask the user for more details or clarification. Your answers should always be clear, direct, and useful.`
}

export async function POST(req: Request) {
  try {
    const { messages: incomingMessages, id: chatId } = await req.json()
    const referer = req.headers.get('referer')
    const isSharePage = referer?.includes('/share/')

    if (isSharePage) {
      return new Response('Chat API is not available on share pages', {
        status: 403,
        statusText: 'Forbidden'
      })
    }

    const cookieStore = await cookies()
    const modelJson = cookieStore.get('selectedModel')?.value
    const searchMode = cookieStore.get('search-mode')?.value === 'true'

    let selectedModel = DEFAULT_MODEL

    if (modelJson) {
      try {
        selectedModel = JSON.parse(modelJson) as Model
      } catch (e) {
        console.error('Failed to parse selected model:', e)
      }
    }

    if (
      !isProviderEnabled(selectedModel.providerId) ||
      selectedModel.enabled === false
    ) {
      return new Response(
        `Selected provider is not enabled ${selectedModel.providerId}`,
        {
          status: 404,
          statusText: 'Not Found'
        }
      )
    }

    const supportsToolCalling = selectedModel.toolCallType === 'native'

    // ✅ Prepend SYSTEM_PROMPT to enforce direct responses
    const messages = [SYSTEM_PROMPT, ...incomingMessages]

    // ✅ Log the actual payload being sent for debugging
    console.log('🔍 Sending messages to OpenAI:', JSON.stringify(messages, null, 2))

    return supportsToolCalling
      ? createToolCallingStreamResponse({
          messages,
          model: selectedModel,
          chatId,
          searchMode
        })
      : createManualToolStreamResponse({
          messages,
          model: selectedModel,
          chatId,
          searchMode
        })
  } catch (error) {
    console.error('API route error:', error)
    return new Response('Error processing your request', {
      status: 500,
      statusText: 'Internal Server Error'
    })
  }
}
