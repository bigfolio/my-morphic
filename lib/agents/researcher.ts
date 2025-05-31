import { CoreMessage, smoothStream, streamText } from 'ai'
import { askQuestionTool } from '../tools/question'
import { retrieveTool } from '../tools/retrieve'
import { searchTool } from '../tools/search'
import { videoSearchTool } from '../tools/video-search'
import { getModel } from '../utils/registry'

const SYSTEM_PROMPT = `
Instructions:

You are a helpful AI assistant with access to real-time web search, content retrieval, video search, and other tools.

Your job is to respond directly to user input — even if it's a single word or vague. DO NOT ask for clarification or prompt the user for more details. Instead, provide the most likely, useful, and relevant information for the query.

Always:
1. Use the search tool if real-time information is needed.
2. Use the retrieve tool only when the user provides a specific URL.
3. Use the videoSearch tool when looking for video-related results.
4. DO NOT use the ask_question tool. Always answer based on your best understanding.
5. Include markdown formatting with headings to structure responses.
6. Cite sources using this format: [number](url), and include multiple sources if available.

Your tone should be informative, concise, and helpful. Never ask follow-up questions.
Current date and time: {{currentDate}}
`

type ResearcherReturn = Parameters<typeof streamText>[0]

export function researcher({
  messages,
  model,
  searchMode
}: {
  messages: CoreMessage[]
  model: string
  searchMode: 'advanced'
}): ResearcherReturn {
  try {
    const currentDate = new Date().toLocaleString()

  console.log('🧠 researcher() config:', {
  model: getModel(model),
  system: `${SYSTEM_PROMPT}\nCurrent date and time: ${currentDate}`,
  messages,
  tools: ['search', 'retrieve', 'videoSearch', 'ask_question'],
  searchMode
})

    return {
      model: getModel(model),
      system: SYSTEM_PROMPT.replace('{{currentDate}}', currentDate),
      messages,
      tools: {
        search: searchTool,
        retrieve: retrieveTool,
        videoSearch: videoSearchTool,
        ask_question: askQuestionTool
      },
     // experimental_activeTools: searchMode
     //   ? ['search', 'retrieve', 'videoSearch', 'ask_question']
     //    : [],
      experimental_activeTools: ['search'], // 🔥 Force search tool only
      maxSteps: searchMode ? 5 : 1,
      experimental_transform: smoothStream()
    }
  } catch (error) {
    console.error('Error in chatResearcher:', error)
    throw error
  }
}
