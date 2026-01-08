import { createEffect, onCleanup, onMount, untrack } from "solid-js"

type InboxKey = "ai" | "needs_you"

type HotkeysInbox = {
  selectedId: () => string | null
  setSelectedId: (next: string | null | ((prev: string | null) => string | null)) => void
  openId: () => string | null
  setOpenId: (next: string | null) => void
  scope: () => InboxKey
  setScope: (next: InboxKey) => void
  aiIds: () => string[]
  needsYouIds: () => string[]
}

export function useInboxHotkeys(args: {
  inbox: HotkeysInbox
  rowEls: Map<string, HTMLButtonElement>
  getDetailEl: () => HTMLElement | undefined
  onNavigateToId?: (id: string) => void
  onClose?: () => void
}) {
  const idsForScope = () => (args.inbox.scope() === "ai" ? args.inbox.aiIds() : args.inbox.needsYouIds())
  let lastNavWasKeyboard = false

  function detailHasFocus() {
    const detailEl = args.getDetailEl()
    if (!detailEl) return false
    const active = document.activeElement as HTMLElement | null
    if (!active) return false
    return active === detailEl || detailEl.contains(active)
  }

  function ensureInView(el: HTMLElement) {
    const r = el.getBoundingClientRect()
    const vh = window.innerHeight || document.documentElement.clientHeight
    const vw = window.innerWidth || document.documentElement.clientWidth
    if (r.top < 0 || r.bottom > vh || r.left < 0 || r.right > vw) {
      el.scrollIntoView({ block: "nearest" })
    }
  }

  function switchScope(next: InboxKey) {
    if (args.inbox.scope() === next) return

    const currentIds = untrack(() => idsForScope())
    const currentIndex = untrack(() => {
      const id = args.inbox.selectedId()
      if (!id) return 0
      const idx = currentIds.indexOf(id)
      return idx === -1 ? 0 : idx
    })

    const nextIds = next === "ai" ? args.inbox.aiIds() : args.inbox.needsYouIds()

    args.inbox.setScope(next)

    if (nextIds.length === 0) {
      args.inbox.setSelectedId(null)
      return
    }

    args.inbox.setSelectedId(nextIds[currentIndex] ?? nextIds[0])
  }

  function moveSelection(delta: number) {
    const ids = untrack(() => idsForScope())
    if (ids.length === 0) return

    args.inbox.setSelectedId((prev) => {
      const idx = prev ? ids.indexOf(prev) : -1

      let nextIdx = idx + delta
      if (idx === -1) nextIdx = delta > 0 ? 0 : ids.length - 1
      nextIdx = Math.max(0, Math.min(ids.length - 1, nextIdx))
      return ids[nextIdx] ?? prev ?? null
    })
  }

  function openDetail() {
    const id = untrack(() => args.inbox.selectedId())
    if (!id) return
    args.inbox.setOpenId(id)
    args.onNavigateToId?.(id)
    queueMicrotask(() => args.getDetailEl()?.focus())
  }

  function closeDetail() {
    args.inbox.setOpenId(null)
    args.onClose?.()
    queueMicrotask(() => {
      const id = untrack(() => args.inbox.selectedId())
      if (!id) return
      args.rowEls.get(id)?.focus()
    })
  }

  onMount(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const t = e.target as HTMLElement | null
      if (t) {
        const tag = t.tagName
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t.isContentEditable) return
      }

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault()
        lastNavWasKeyboard = true
        moveSelection(1)
        if (detailHasFocus()) {
          const id = untrack(() => args.inbox.selectedId())
          if (id) {
            args.inbox.setOpenId(id)
            args.onNavigateToId?.(id)
          }
        }
        return
      }

      if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault()
        lastNavWasKeyboard = true
        moveSelection(-1)
        if (detailHasFocus()) {
          const id = untrack(() => args.inbox.selectedId())
          if (id) {
            args.inbox.setOpenId(id)
            args.onNavigateToId?.(id)
          }
        }
        return
      }

      if (e.key === "h" || e.key === "ArrowLeft") {
        e.preventDefault()
        lastNavWasKeyboard = true
        switchScope("ai")
        if (detailHasFocus()) {
          const id = untrack(() => args.inbox.selectedId())
          if (id) {
            args.inbox.setOpenId(id)
            args.onNavigateToId?.(id)
          }
        }
        return
      }

      if (e.key === "l" || e.key === "ArrowRight") {
        e.preventDefault()
        lastNavWasKeyboard = true
        switchScope("needs_you")
        if (detailHasFocus()) {
          const id = untrack(() => args.inbox.selectedId())
          if (id) {
            args.inbox.setOpenId(id)
            args.onNavigateToId?.(id)
          }
        }
        return
      }

      if (e.key === "Enter") {
        const id = untrack(() => args.inbox.selectedId())
        if (!id) {
          e.preventDefault()
          lastNavWasKeyboard = true
          moveSelection(1)
          return
        }

        e.preventDefault()
        openDetail()
        return
      }

      if (e.key === "Escape") {
        if (!args.inbox.openId()) return
        e.preventDefault()
        closeDetail()
        return
      }
    }

    window.addEventListener("keydown", onKeyDown)
    onCleanup(() => window.removeEventListener("keydown", onKeyDown))
  })

  createEffect(() => {
    const id = args.inbox.selectedId()
    if (!id) return

    queueMicrotask(() => {
      const detailEl = args.getDetailEl()
      const active = document.activeElement as HTMLElement | null
      const rowEl = args.rowEls.get(id)
      if (!rowEl) return

      if (active) {
        if (detailEl && (active === detailEl || detailEl.contains(active))) {
          if (lastNavWasKeyboard) ensureInView(rowEl)
          lastNavWasKeyboard = false
          return
        }
        const tag = active.tagName
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || active.isContentEditable) return
      }

      if (lastNavWasKeyboard) ensureInView(rowEl)
      lastNavWasKeyboard = false
      rowEl.focus()
    })
  })

  return { closeDetail, openDetail }
}


