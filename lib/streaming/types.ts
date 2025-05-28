import { Message } from 'ai'
import { Model } from '../types/models'
import { DataStreamWriter } from 'ai'

export interface BaseStreamConfig {
  messages: Message[]
  model: Model
  chatId: string
  searchMode: boolean
  addToolResult?: (result: any) => void
  dataStream?: DataStreamWriter // ✅ ADD THIS LINE
}

export interface HandleStreamFinishParams {
  responseMessages: Message[]
  originalMessages: Message[]
  model: string
  chatId: string
  dataStream: any
  skipRelatedQuestions: boolean
  addToolResult?: (result: any) => void
}
