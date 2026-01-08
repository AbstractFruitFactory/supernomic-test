type TokenEvent = { token: string; idx: number }

export function createTokenStream<TDone extends object>(opts: {
  urlForId: (id: string) => string
  onToken: (id: string, token: string) => void
  onDone: (id: string, data: TDone) => void
  onError?: (id: string) => void
  maxOpen?: number
}) {
  const sources = new Map<string, EventSource>()
  const lastUrl = new Map<string, string>()
  const nextIdx = new Map<string, number>()

  const forget = (id: string) => {
    lastUrl.delete(id)
    nextIdx.delete(id)
  }

  const close = (id: string) => {
    const es = sources.get(id)
    if (!es) return
    es.close()
    sources.delete(id)
  }

  const ensure = (id: string) => {
    if (sources.has(id)) return

    const url = opts.urlForId(id)
    const prevUrl = lastUrl.get(id)
    if (prevUrl !== url) {
      lastUrl.set(id, url)
      nextIdx.set(id, 0)
    }

    const es = new EventSource(url)
    sources.set(id, es)

    es.addEventListener("token", (evt) => {
      const data = JSON.parse((evt as MessageEvent).data) as TokenEvent
      const expected = nextIdx.get(id) ?? 0
      if (data.idx < expected) return
      nextIdx.set(id, data.idx + 1)
      opts.onToken(id, data.token)
    })

    es.addEventListener("done", (evt) => {
      const data = JSON.parse((evt as MessageEvent).data) as TDone
      opts.onDone(id, data)
      close(id)
      forget(id)
    })

    es.addEventListener("error", () => {
      opts.onError?.(id)
      close(id)
      // Keep cursor state so a reconnect doesn't duplicate tokens.
    })
  }

  const reconcile = (nextIds: Iterable<string>, priorityIds: Iterable<string> = []) => {
    const nextArr = Array.isArray(nextIds) ? nextIds : Array.from(nextIds)
    const next = new Set(nextArr)

    const ordered: string[] = []
    const seen = new Set<string>()

    for (const id of priorityIds) {
      if (!next.has(id)) continue
      if (seen.has(id)) continue
      seen.add(id)
      ordered.push(id)
    }

    for (const id of nextArr) {
      if (seen.has(id)) continue
      seen.add(id)
      ordered.push(id)
    }

    const maxOpen = opts.maxOpen ?? Number.POSITIVE_INFINITY
    const allowed = new Set(ordered.slice(0, maxOpen))

    for (const id of sources.keys()) {
      if (!allowed.has(id)) close(id)
    }

    for (const id of allowed) ensure(id)
  }

  const closeAll = () => {
    for (const id of sources.keys()) close(id)
  }

  return { ensure, close, reconcile, closeAll }
}


