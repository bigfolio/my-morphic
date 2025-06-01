// lib/utils/stream.ts

import { Message } from 'ai'

const validPrefixes = new Set([
  'a', 'b', 'i', 'g', '0', '2', '3', '8', '9', 'c', 'd', 'e', 'f', 'h', 'j', 'k',
]);

export function castToStreamChunk(chunk: string): StreamChunk {
  const prefix = chunk.split(':')[0];
  if (!validPrefixes.has(prefix)) {
    throw new Error(`Invalid stream prefix: ${prefix}`);
  }
  return chunk as StreamChunk;
}

export function serializeMessageToChunk(message: Message): `d:${string}` {
  return `d:${JSON.stringify(message)}` as const
}
