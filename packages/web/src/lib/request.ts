export async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, options)
  } catch {
    throw new Error('Could not reach the server')
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? 'Request failed')
  }
  return res.json()
}

// lib/streamSync.ts
type SyncEvent =
  | { event: 'progress'; data: { processed: number; total: number } }
  | { event: 'done'; data: { playlistItemsSynced: number } }
  | { event: 'error'; data: { message: string } }

export async function streamSync(
  path: string,
  onEvent: (event: SyncEvent) => void
): Promise<void> {
  const res = await fetch(path, { method: 'POST' })

  if (!res.ok) {
    // pre-stream failures (401, 404) are normal JSON errors
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? 'Request failed')
  }

  if (!res.body) throw new Error('No response stream')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    // SSE events are separated by a blank line (\n\n)
    const chunks = buffer.split('\n\n')
    buffer = chunks.pop() ?? '' // keep the incomplete trailing chunk

    for (const chunk of chunks) {
      if (!chunk.trim()) continue
      const event = parseSSEChunk(chunk)
      if (event) onEvent(event)
    }
  }
}

function parseSSEChunk(chunk: string): SyncEvent | null {
  let eventName = 'message'
  let data = ''

  for (const line of chunk.split('\n')) {
    if (line.startsWith('event:')) eventName = line.slice(6).trim()
    else if (line.startsWith('data:')) data += line.slice(5).trim()
  }

  if (!data) return null
  return { event: eventName, data: JSON.parse(data) } as SyncEvent
}
