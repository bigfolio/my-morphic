import { Message } from 'ai'
import { Model } from '../types/models'

export interface BaseStreamConfig {
  messages: Message[]
  model: Model
  chatId: string
  searchMode: boolean
  addToolResult?: (result: any) => void // ✅ Include this here
}

export interface HandleStreamFinishParams {
  responseMessages: any[]
  originalMessages: Message[]
  model: string
  chatId: string
  dataStream: any
  skipRelatedQuestions: boolean
  addToolResult?: (result: any) => void // ✅ Include this too
}
