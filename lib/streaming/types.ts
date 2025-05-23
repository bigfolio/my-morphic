import { Message } from 'ai'
import { Model } from '../types/models'

export interface BaseStreamConfig {
  messages: Message[]
  model: Model
  chatId: string
  searchMode: boolean
  addToolResult?: (result: any) => void // ✅ make sure this is here too
}

export interface HandleStreamFinishParams {
  responseMessages: Message[]
  originalMessages: Message[]
  model: string
  chatId: string
  dataStream: any
  skipRelatedQuestions: boolean
  addToolResult?: (result: any) => void // ✅ this is essential
}
