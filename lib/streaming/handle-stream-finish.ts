import { HandleStreamFinishParams } from './types'

export async function handleStreamFinish({
  responseMessages,
  originalMessages,
  model,
  chatId,
  dataStream,
  skipRelatedQuestions,
  addToolResult
}: HandleStreamFinishParams) {
  try {
    const toolMessage = responseMessages.find(
      msg => typeof msg === 'object' && 'tool' in msg
    )

    if (toolMessage && addToolResult) {
      console.log('✅ Adding tool result via addToolResult')
      addToolResult(toolMessage)
    }

    // (Optional) Handle additional tasks after stream
  } catch (err) {
    console.error('❌ Error in handleStreamFinish:', err)
  }
}
