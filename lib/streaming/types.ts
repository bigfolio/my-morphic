import { Message } from 'ai'
import { DataStreamWriter } from 'ai'
import { Model } from '../types/models'

export type BaseStreamConfig = {
  messages: Message[]
  model: Model
  chatId: string
  searchMode?: string
}

export type HandleStreamFinishParams = {
  responseMessages: Message[]
  originalMessages: Message[] // ✅ This must be present
  model: Model
  chatId: string
  dataStream: DataStreamWriter
  skipRelatedQuestions?: boolean
  addToolResult?: (result: any) => void
}
