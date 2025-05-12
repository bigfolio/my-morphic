import { createManualToolStreamResponse } from '@/lib/streaming/create-manual-tool-stream'
import { createToolCallingStreamResponse } from '@/lib/streaming/create-tool-calling-stream'
import { Model } from '@/lib/types/models'
import { isProviderEnabled } from '@/lib/utils/registry'
import { cookies } from 'next/headers'

export const maxDuration = 30

// ✅ Change model to GPT-4-turbo
const DEFAULT_MODEL: Model = {
  id: 'gpt-4-turbo',  // switched to GPT-4-turbo
  name: 'GPT-4-turbo',
  provider: 'OpenAI',
  providerId: 'openai',
  enabled: true,
  toolCallType: 'native'
}

// ✅ This is your new system prompt
const SYSTEM_PROMPT = {
  role: 'system',
  content:
    `You are a highly intelligent AI assistant. 
    Respond with clear, direct, informative answers — even when the user only types one word. 
    Do not ask for clarification. Do not ask questions. Just explain the concept clearly. 
    Keep the tone confident and helpful.`
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

    // ✅ Inject system prompt
    const messages = [SYSTEM_PROMPT, ...incomingMessages]

    // ✅ Log the actual payload being sent
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
