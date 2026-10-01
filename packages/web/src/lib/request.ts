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
type SyncEvent<TDone> =
  | { event: 'progress'; data: { processed: number; total: number } }
  | { event: 'done'; data: TDone }
  | { event: 'error'; data: { message: string } }

export async function streamSync<TDone = unknown>(
  path: string,
  onEvent: (event: SyncEvent<TDone>) => void,
  body?: unknown
): Promise<void> {
  const res = await fetch(path, {
    method: 'POST',
    ...(body !== undefined && {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
  })

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
      const event = parseSSEChunk<TDone>(chunk)
      if (event) onEvent(event)
    }
  }
}

function parseSSEChunk<TData>(chunk: string): SyncEvent<TData> | null {
  let eventName = 'message'
  let data = ''

  for (const line of chunk.split('\n')) {
    if (line.startsWith('event:')) eventName = line.slice(6).trim()
    else if (line.startsWith('data:')) data += line.slice(5).trim()
  }

  if (!data) return null
  return { event: eventName, data: JSON.parse(data) } as SyncEvent<TData>
}
