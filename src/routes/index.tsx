import { createEffect, createMemo, createSelector, For, onCleanup, untrack } from "solid-js"
import { useNavigate, useSearchParams } from "@solidjs/router"
import { useInbox } from "~/inbox/context"
import { InboxItem } from "~/types"
import { TransitionGroup } from "solid-transition-group"
import { ColumnHeader } from "~/components/inbox/ColumnHeader"
import { KeyHint, KeyPairHint } from "~/components/inbox/KeyHint"
import { InboxCard } from "~/components/inbox/InboxCard"
import { InboxDetailPanel } from "~/components/inbox/InboxDetailPanel"
import { useInboxHotkeys } from "~/inbox/useInboxHotkeys"

export default function Home() {
  const inbox = useInbox()
  const navigate = useNavigate()
  const [params] = useSearchParams<{ id?: string }>()
  const rowEls = new Map<string, HTMLButtonElement>()
  let detailEl: HTMLElement | undefined

  const isSelected = createSelector(inbox.selectedId)
  const isOpen = createSelector(inbox.openId)

  const isAi = (status: InboxItem["status"]) => status === "agent_working" || status === "agent_resolved"

  const selectedCol = () => {
    const id = inbox.selectedId()
    if (!id) return null
    const item = inbox.items[id]
    if (!item) return null
    return isAi(item.status) ? ("ai" as const) : ("needs_you" as const)
  }

  const allIds = createMemo(() => [...inbox.aiIds(), ...inbox.needsYouIds()])

  const aiRank = createMemo(() => {
    const ids = inbox.aiIds()
    const map = new Map<string, number>()
    for (let i = 0; i < ids.length; i++) map.set(ids[i], i + 1)
    return map
  })

  const needsRank = createMemo(() => {
    const ids = inbox.needsYouIds()
    const map = new Map<string, number>()
    for (let i = 0; i < ids.length; i++) map.set(ids[i], i + 1)
    return map
  })

  const navigateToId = (id: string) => {
    navigate(`/?id=${encodeURIComponent(id)}`, { scroll: false })
  }

  const closeDetail = () => {
    inbox.setOpenId(null)
    navigate("/", { replace: true, scroll: false })
    queueMicrotask(() => {
      const id = untrack(() => inbox.selectedId())
      if (!id) return
      rowEls.get(id)?.focus()
    })
  }

  createEffect(() => {
    const id = params.id
    if (!id) {
      inbox.setOpenId(null)
      return
    }

    const item = inbox.items[id]
    if (!item) return

    inbox.setSelectedId(id)
    inbox.setOpenId(id)
    inbox.setScope(isAi(item.status) ? "ai" : "needs_you")
  })

  createEffect(() => {
    if (params.id) return
    if (inbox.selectedId()) return

    const ids = inbox.aiIds()
    if (ids.length === 0) return

    inbox.setScope("ai")
    inbox.setSelectedId(ids[0])
  })

  useInboxHotkeys({
    inbox,
    rowEls,
    getDetailEl: () => detailEl,
    onNavigateToId: (id) => {
      navigateToId(id)
    },
    onClose: () => {
      navigate("/", { replace: true, scroll: false })
    },
  })

  return (
    <main class="mx-auto max-w-[1440px] px-5 py-5">
      <h1 class="mb-4 pl-[95px] text-3xl font-light uppercase tracking-wide text-amber-100/90">Agent Inbox</h1>
      <div class="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(360px,1fr)]">
        <section class="grid grid-cols-[64px_1fr_1fr] items-start gap-x-4 gap-y-2 [--col-pad:0.75rem]">
          <div class="col-start-2 row-start-1 px-3">
            <KeyPairHint left="←" right="h" align="right" />
          </div>
          <div class="col-start-3 row-start-1 px-3">
            <KeyPairHint left="→" right="l" align="left" />
          </div>

          <ColumnHeader
            colStart={2}
            title="AI Handling"
            active={inbox.scope() === "ai"}
            selected={selectedCol() === "ai"}
          />

          <ColumnHeader
            colStart={3}
            title="Needs You"
            active={inbox.scope() === "needs_you"}
            selected={selectedCol() === "needs_you"}
          />

          <div
            class="pointer-events-none z-10 col-start-1 px-4"
            style={{ "grid-row": "4" }}
          >
            <div class="inline-flex items-center gap-1">
              <KeyHint>↑</KeyHint>
              <span class="text-white/40">/</span>
              <KeyHint>k</KeyHint>
            </div>
          </div>

          <div
            class="pointer-events-none z-10 col-start-1 px-4"
            style={{ "grid-row": "5" }}
          >
            <div class="inline-flex items-center gap-1">
              <KeyHint>↓</KeyHint>
              <span class="text-white/40">/</span>
              <KeyHint>j</KeyHint>
            </div>
          </div>

          <TransitionGroup name="card" moveClass="card-move">
            <For each={allIds()}>
              {(id) => {
                const item = () => inbox.items[id]
                const selected = () => isSelected(id)
                const col = () => (isAi(item().status) ? 2 : 3)
                const rank = () => (col() === 2 ? aiRank().get(id) ?? 9999 : needsRank().get(id) ?? 9999)
                const row = () => rank() + 3

                onCleanup(() => rowEls.delete(id))

                return (
                  <div
                    class="relative z-[1] px-3"
                    style={{ "grid-column": String(col()), "grid-row": String(row()) }}
                  >
                    <InboxCard
                      id={id}
                      item={item}
                      selected={selected}
                      open={() => isOpen(id)}
                      setRowEl={(el) => rowEls.set(id, el)}
                      onClick={() => {
                        inbox.setScope(isAi(item().status) ? "ai" : "needs_you")
                        inbox.setSelectedId(id)
                        inbox.setOpenId(id)
                        navigateToId(id)
                      }}
                    />
                  </div>
                )
              }}
            </For>
          </TransitionGroup>
        </section>
        
        <InboxDetailPanel
          item={inbox.openItem}
          detailRef={(el) => {
            detailEl = el
          }}
          onClose={closeDetail}
          coachAgent={inbox.coachAgent}
          coachAgentPending={inbox.coachAgentPending}
          approveRequest={inbox.approveRequest}
          approvePending={inbox.approvePending}
        />
      </div>
    </main>
  )
}


