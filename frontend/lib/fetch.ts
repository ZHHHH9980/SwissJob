/**
 * Fetch with timeout and clear error source.
 * Usage: await fetchT('/api/companies', 'Load companies')
 */
export async function fetchT(
  url: string,
  label: string,
  init?: RequestInit & { timeout?: number },
): Promise<Response> {
  const { timeout = 15000, ...fetchInit } = init || {}
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  try {
    const res = await fetch(url, { ...fetchInit, signal: controller.signal })
    clearTimeout(timer)
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`[${label}] ${res.status}: ${body || res.statusText}`)
    }
    return res
  } catch (err) {
    clearTimeout(timer)
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(`[${label}] Request timed out after ${timeout / 1000}s`)
    }
    if (err instanceof Error && err.message.startsWith(`[${label}]`)) throw err
    throw new Error(`[${label}] ${err instanceof Error ? err.message : String(err)}`)
  }
}
