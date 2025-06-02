// lib/utils/stream.ts

import { Message } from 'ai'
import { StreamChunk } from '../streaming/types'

const validPrefixes = new Set([
  '0', '2', '3', 'a', 'b', 'i', 'g',
  '8', '9', 'c', 'd', 'e', 'f', 'h', 'j', 'k',
])


export function castToStreamChunk(chunk: string): StreamChunk {
  const prefix = chunk.split(':')[0];
  if (!validPrefixes.has(prefix)) {
    throw new Error(`Invalid stream prefix: ${prefix}`);
  }
  return chunk as StreamChunk;
}

export function serializeMessageToChunk(message: Message): StreamChunk {
  return castToStreamChunk(`0:${JSON.stringify(message)}`)
}
