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
  originalMessages: Message[]
  model: Model
  chatId: string
  dataStream: DataStreamWriter
  skipRelatedQuestions?: boolean
  addToolResult?: (result: any) => void
}

export type StreamChunk =
  | `0:${string}`
  | `2:${string}`
  | `3:${string}`
  | `a:${string}`
  | `b:${string}`
  | `i:${string}`
  | `g:${string}`
  | `8:${string}`
  | `9:${string}`
  | `c:${string}`
  | `d:${string}`
  | `e:${string}`
  | `f:${string}`
  | `h:${string}`
  | `j:${string}`
  | `k:${string}`

// ✅ Add this missing type:
export type ExtendedMessage = Message & {
  role: 'system' | 'user' | 'assistant' | 'tool' | 'data'
}
