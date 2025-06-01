// lib/utils/stream.ts

export type ValidStreamPrefix =
  | 'a'
  | 'b'
  | 'i'
  | 'g'
  | '0'
  | '2'
  | '3'
  | '8'
  | '9'
  | 'c'
  | 'd'
  | 'e'
  | 'f'
  | 'h'
  | 'j'
  | 'k'

export type StreamChunk = `${ValidStreamPrefix}:${string}`

export function castToStreamChunk<T extends StreamChunk>(chunk: T): T {
  return chunk
}
