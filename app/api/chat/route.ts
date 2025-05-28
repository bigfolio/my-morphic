export const runtime = 'edge' // ✅ Add this line at the very top

import { createDataStreamResponse } from 'ai' // ⬅️ Make sure this import is at the top
import { createManualToolStreamResponse } from '@/lib/streaming/create-manual-tool-stream'
import { createToolCallingStreamResponse } from '@/lib/streaming/create-tool-calling-stream'
import { Model } from '@/lib/types/models'
import { isProviderEnabled } from '@/lib/utils/registry'
import { cookies } from 'next/headers'

export const maxDuration = 30

const DEFAULT_MODEL: Model = {
  id: 'gpt-4-turbo',
  name: 'GPT-4-turbo',
  provider: 'OpenAI',
  providerId: 'openai',
  enabled: true,
  toolCallType: 'native'
}

// 🔧 Stronger system prompt
const SYSTEM_PROMPT = {
  role: 'system',
  content: `You are a direct and intelligent assistant. Do not ask the user for clarification or follow-up.
  If a single word or simple phrase is given, respond with an informative and complete explanation immediately.
  Never reply with questions — just provide useful, authoritative information based on the query.`
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
  //  const searchMode = cookieStore.get('search-mode')?.value === 'true'
    const searchMode = true

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

    // ✅ Force system prompt + user messages
    const messages = [SYSTEM_PROMPT, ...incomingMessages]

    console.log('🧠 Final messages payload:', JSON.stringify(messages, null, 2))

  return createDataStreamResponse({
  async execute(dataStream) {
    const handler = supportsToolCalling
      ? createToolCallingStreamResponse
      : createManualToolStreamResponse

    await handler({
      messages,
      model: selectedModel,
      chatId,
      searchMode,
      dataStream // ✅ custom streaming output
    })
  },
  onError: (err) => `Stream error: ${String(err)}`
})


  } catch (error) {
    console.error('❌ API error:', error)
    return new Response('Error processing your request', {
      status: 500,
      statusText: 'Internal Server Error'
    })
  }
}
