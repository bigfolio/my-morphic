import { Message } from 'ai'
import { StreamChunk } from '../streaming/types'

// Type guard to ensure the chunk is a valid StreamChunk
export function isStreamChunk(chunk: string): chunk is StreamChunk {
  const prefix = chunk.split(':')[0];
  const validPrefixes = new Set([
    '0', '2', '3', 'a', 'b', 'i', 'g', '8', '9', 'c', 'd', 'e', 'f', 'h', 'j', 'k'
  ]);
  
  // Check if prefix is valid and the chunk has the correct format
  return validPrefixes.has(prefix) && /^[a-k0-9]:.+$/.test(chunk);
}

// Updated castToStreamChunk function using the isStreamChunk type guard
export function castToStreamChunk(chunk: string): StreamChunk {
  if (!isStreamChunk(chunk)) {
    throw new Error(`Invalid chunk format: ${chunk}`);
  }

  // Log the chunk to ensure it's being split correctly
  console.log(`Received chunk: ${chunk}`);

  return chunk; // Now TypeScript knows this is a valid StreamChunk
}

// Function to serialize messages to StreamChunk
export function serializeMessageToChunk(message: Message): StreamChunk {
  return castToStreamChunk(`0:${JSON.stringify(message)}`);
}
