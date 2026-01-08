import { createContext, createEffect, createMemo, onCleanup, useContext } from "solid-js"
import type { ParentProps } from "solid-js"
import { useMutation, useQuery } from "@tanstack/solid-query"
import { getRequestEvent } from "solid-js/web"
import { createInboxStore } from "~/inbox/store"
import { createMockInboxItems } from "~/inbox/mock"
import type { InboxItem } from "~/types"
import { createTokenStream } from "~/inbox/token-stream"

type InboxContextValue = ReturnType<typeof createInboxStore> & {
  coachAgent: (id: string) => void
  coachAgentPending: boolean
  approveRequest: (id: string) => void
  approvePending: boolean
}

const InboxContext = createContext<InboxContextValue>()

const MOCK_NOW = Date.parse("2026-01-07T12:00:00.000Z")

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

async function fetchInboxItems(): Promise<InboxItem[]> {
  await wait(350)
  return createMockInboxItems(MOCK_NOW)
}

function setupStreaming(store: ReturnType<typeof createInboxStore>) {
  const workingIds = createMemo(() => store.aiIds().filter((id) => store.items[id]?.status === "agent_working"))
  const priorityIds = createMemo(() => {
    const id = store.openId()
    return id ? [id] : []
  })

  const stream = createTokenStream<{ status: InboxItem["status"] }>({
    urlForId: (id) => {
      const phase = store.items[id]?.stream_phase ?? "initial"
      const kind = store.items[id]?.followup_kind
      const qs =
        phase === "followup" && kind
          ? `id=${encodeURIComponent(id)}&phase=${encodeURIComponent(phase)}&kind=${encodeURIComponent(kind)}`
          : `id=${encodeURIComponent(id)}&phase=${encodeURIComponent(phase)}`
      return `/api/agent-stream?${qs}`
    },
    onToken: (id, token) => {
      const phase = store.items[id]?.stream_phase ?? "initial"
      if (phase === "followup") store.appendAgentFollowupToken(id, token)
      else store.appendAgentToken(id, token)
    },
    onDone: (id, data) => store.patch(id, { status: data.status, stream_phase: undefined }),
    maxOpen: 6,
  })

  createEffect(() => {
    stream.reconcile(workingIds(), priorityIds())
  })

  onCleanup(() => {
    stream.closeAll()
  })
}

export function InboxProvider(props: ParentProps) {
  const initialItems = createMockInboxItems(MOCK_NOW)
  const store = createInboxStore(initialItems)

  const inboxQuery = useQuery(() => ({
    queryKey: ["inboxItems"],
    queryFn: fetchInboxItems,
    initialData: initialItems,
    enabled: typeof window !== "undefined",
    retry: false,
  }))

  const seededIds = new Set<string>(initialItems.map((i) => i.id))

  createEffect(() => {
    const data = inboxQuery.data
    if (!data) return
    for (const item of data) {
      if (seededIds.has(item.id)) continue
      seededIds.add(item.id)
      store.upsert(item)
    }
  })

  if (typeof window === "undefined") {
    const event = getRequestEvent()
    const url = event ? new URL(event.request.url) : null
    const id = url?.searchParams.get("id")

    if (id && store.items[id]) {
      const status = store.items[id].status
      store.setScope(status === "agent_working" || status === "agent_resolved" ? "ai" : "needs_you")
      store.setSelectedId(id)
      store.setOpenId(id)
    } else {
      const ids = store.aiIds()
      if (ids.length) {
        store.setScope("ai")
        store.setSelectedId(ids[0])
      }
    }
  }

  const coachMutation = useMutation(() => ({
    mutationKey: ["coachAgent"],
    mutationFn: async (vars: { id: string }) => {
      await wait(250)
      return vars
    },
    onMutate: ({ id }) => {
      store.patch(id, {
        status: "agent_working",
        stream_phase: "followup",
        followup_kind: "coach",
        followup_note:
          "Please confirm the minimum access needed (read vs write), and only request repo access after the manager approves. " +
          "Also add a short summary in the update so the requester knows what changed.",
        agent_followup: "",
      })
    },
    retry: false,
  }))

  const approveMutation = useMutation(() => ({
    mutationKey: ["approveRequest"],
    mutationFn: async (vars: { id: string }) => {
      await wait(250)
      return vars
    },
    onMutate: ({ id }) => {
      store.patch(id, {
        status: "agent_working",
        stream_phase: "followup",
        followup_kind: "approve",
        agent_followup: "",
      })
    },
    retry: false,
  }))

  if (typeof window !== "undefined") setupStreaming(store)

  const value: InboxContextValue = {
    ...store,
    coachAgent: (id) => coachMutation.mutate({ id }),
    coachAgentPending: coachMutation.isPending,
    approveRequest: (id) => approveMutation.mutate({ id }),
    approvePending: approveMutation.isPending,
  }

  return <InboxContext.Provider value={value}>{props.children}</InboxContext.Provider>
}

export function useInbox() {
  const store = useContext(InboxContext)
  if (!store) throw new Error("useInbox must be used within InboxProvider")
  return store
}


