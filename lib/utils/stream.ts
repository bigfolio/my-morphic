// lib/utils/stream.ts

import { Message } from 'ai'
import { StreamChunk } from '../streaming/types'

export function castToStreamChunk(chunk: string): StreamChunk {
  const prefix = chunk.split(':')[0];
  const validPrefixes = new Set([
    '0', '2', '3', 'a', 'b', 'i', 'g', '8', '9', 'c', 'd', 'e', 'f', 'h', 'j', 'k'
  ]);
  
  if (!validPrefixes.has(prefix)) {
    throw new Error(`Invalid stream prefix: ${prefix}`);
  }  
  
  // Log the chunk to ensure it's being split correctly
  console.log(`Received chunk: ${chunk}`);


  // Double-check the structure here
  if (!/^[a-z0-9]:.+$/.test(chunk)) {
    throw new Error(`Invalid chunk format: ${chunk}`);
  }

  return chunk as StreamChunk; // Ensure the type is valid
}



export function serializeMessageToChunk(message: Message): StreamChunk {
  return castToStreamChunk(`0:${JSON.stringify(message)}`)
}
