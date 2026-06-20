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
