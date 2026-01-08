import { createEffect, createMemo, createSignal } from "solid-js"
import { createStore } from "solid-js/store"
import type { InboxItem, InboxKey } from "~/types"
import { inboxForStatus } from "~/types"

export function createInboxStore(initialItems: InboxItem[] = []) {
  const [items, setItems] = createStore<Record<InboxItem["id"], InboxItem>>(
    Object.fromEntries(initialItems.map((item) => [item.id, item]))
  )

  const [selectedId, setSelectedId] = createSignal<string | null>(null)
  const [openId, setOpenId] = createSignal<string | null>(null)
  const [scope, setScope] = createSignal<InboxKey>("needs_you")

  let lastSelectedInbox: InboxKey | null = null

  createEffect(() => {
    const id = selectedId()
    if (!id) {
      lastSelectedInbox = null
      return
    }
    const item = items[id]
    if (!item) return

    const currentInbox = inboxForStatus(item.status)
    if (lastSelectedInbox !== null && currentInbox !== lastSelectedInbox) setScope(currentInbox)
    lastSelectedInbox = currentInbox
  })

  const priorityRank = (p: InboxItem["priority"]) => {
    switch (p) {
      case "urgent":
        return 0
      case "high":
        return 1
      case "medium":
        return 2
      case "low":
        return 3
      default:
        return 4
    }
  }

  const sortByPriorityThenCreatedAt = (status: InboxKey) => {
    return Object.keys(items)
      .filter((id) => inboxForStatus(items[id].status) === status)
      .sort((a, b) => {
        const pa = priorityRank(items[a].priority)
        const pb = priorityRank(items[b].priority)
        if (pa !== pb) return pa - pb
        return Date.parse(items[b].created_at) - Date.parse(items[a].created_at)
      })
  }

  const aiIds = createMemo(() => {
    return Object.keys(items)
      .filter((id) => inboxForStatus(items[id].status) === "ai")
      .sort((a, b) => {
        const wa = items[a].status === "agent_working" ? 0 : 1
        const wb = items[b].status === "agent_working" ? 0 : 1
        if (wa !== wb) return wa - wb

        const pa = priorityRank(items[a].priority)
        const pb = priorityRank(items[b].priority)
        if (pa !== pb) return pa - pb

        return Date.parse(items[b].created_at) - Date.parse(items[a].created_at)
      })
  })

  const needsYouIds = createMemo(() => sortByPriorityThenCreatedAt("needs_you"))

  const selectedItem = createMemo<InboxItem | undefined>(() => {
    const id = selectedId()
    if (!id) return undefined
    return items[id]
  })

  const openItem = createMemo<InboxItem | undefined>(() => {
    const id = openId()
    if (!id) return undefined
    return items[id]
  })

  function upsert(next: InboxItem) {
    setItems(next.id, next)
  }

  function patch(id: string, next: Partial<InboxItem>) {
    setItems(id, (prev) => ({ ...prev, ...next }))
  }

  function setStatus(id: string, status: InboxItem["status"]) {
    setItems(id, "status", status)
  }

  function appendAgentToken(id: string, token: string) {
    setItems(id, "agent_response", (prev) => (prev || "") + token)
  }

  function appendAgentFollowupToken(id: string, token: string) {
    setItems(id, "agent_followup", (prev) => (prev || "") + token)
  }

  return {
    items,
    setItems,
    selectedId,
    setSelectedId,
    openId,
    setOpenId,
    scope,
    setScope,
    aiIds,
    needsYouIds,
    selectedItem,
    openItem,
    upsert,
    patch,
    setStatus,
    appendAgentToken,
    appendAgentFollowupToken,
  }
}


