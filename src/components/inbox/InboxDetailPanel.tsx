import { createEffect, createSignal, onCleanup, Show } from "solid-js"
import type { InboxItem } from "~/types"
import { Avatar } from "~/components/Avatar"
import { KeyHint } from "./KeyHint"
import { StatusPill } from "./StatusPill"

export function InboxDetailPanel(props: {
  item: () => InboxItem | undefined
  detailRef: (el: HTMLElement) => void
  onClose: () => void
  coachAgent: (id: string) => void
  coachAgentPending: boolean
  approveRequest: (id: string) => void
  approvePending: boolean
}) {
  const [doneStage, setDoneStage] = createSignal<"idle" | "swap" | "fade">("idle")
  const [donePhase, setDonePhase] = createSignal<"initial" | "followup">("initial")
  let lastId: string | null = null
  let lastStatus: InboxItem["status"] | null = null
  let lastPhase: "initial" | "followup" = "initial"
  let t1: number | undefined
  let t2: number | undefined

  const clearTimers = () => {
    if (t1) window.clearTimeout(t1)
    if (t2) window.clearTimeout(t2)
    t1 = undefined
    t2 = undefined
  }

  createEffect(() => {
    const it = props.item()
    if (!it) {
      clearTimers()
      lastId = null
      lastStatus = null
      lastPhase = "initial"
      setDoneStage("idle")
      setDonePhase("initial")
      return
    }

    const phaseNow = (it.stream_phase ?? "initial") as "initial" | "followup"

    if (lastId !== it.id) {
      clearTimers()
      lastId = it.id
      lastStatus = it.status
      lastPhase = phaseNow
      setDoneStage("idle")
      setDonePhase("initial")
      return
    }

    if (lastStatus === "agent_working" && it.status !== "agent_working") {
      clearTimers()
      setDonePhase(lastPhase)
      setDoneStage("swap")
      t1 = window.setTimeout(() => setDoneStage("fade"), 620)
      t2 = window.setTimeout(() => setDoneStage("idle"), 1100)
    }

    if (it.status === "agent_working") setDoneStage("idle")
    lastStatus = it.status
    lastPhase = phaseNow
  })

  onCleanup(() => clearTimers())

  return (
    <div class="self-start min-h-[calc(100vh-2.5rem)]">
      <div class="mb-2 flex h-7 items-center gap-1">
        <Show when={!props.item()}>
          <KeyHint>Enter</KeyHint>
        </Show>
      </div>
      <aside
        class="sticky top-5 max-h-[calc(100vh-2.5rem)] overflow-auto rounded-2xl border border-white/10 bg-white/5 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/80"
        tabIndex={-1}
        ref={props.detailRef}
      >
        <Show
          when={props.item()}
          fallback={
            <div>
              <div class="font-semibold">No item selected</div>
              <div class="mt-1 text-sm text-white/70">Press Enter or click an item to open details.</div>
            </div>
          }
        >
          {(item) => (
            <div>
              <div class="relative pr-8">
                <h2 class="text-lg font-semibold leading-snug">{item().subject}</h2>
                <button
                  type="button"
                  class="absolute right-0 top-0 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-white/10 bg-white/5 text-sm text-white/80 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/40"
                  onClick={props.onClose}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <div class="mt-2 flex flex-wrap items-center gap-1.5">
                <StatusPill status={item().status} />
                <span
                  class="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs capitalize text-white/80"
                  classList={{
                    "border-rose-300/35 bg-rose-300/20 text-rose-50": item().priority === "urgent",
                    "border-amber-200/20 bg-amber-200/10": item().priority !== "urgent",
                  }}
                >
                  <Show when={item().priority === "urgent"}>
                    <span
                      class="inline-flex h-4 w-4 items-center justify-center rounded-full bg-rose-200/90 text-[10px] font-extrabold leading-none text-rose-950"
                      aria-hidden="true"
                    >
                      !
                    </span>
                  </Show>
                  {item().priority}
                </span>
              </div>

              <div class="mt-3 flex items-center gap-2 text-sm text-white/80">
                <Avatar name={item().requester.name} src={item().requester.avatar} size={34} />
                <span>
                  {item().requester.name} · {item().requester.team}
                </span>
              </div>
              <div class="mt-1 text-xs text-white/60">{item().created_at}</div>
              <p class="mt-3 text-sm leading-relaxed text-white/80">{item().summary}</p>

                  <Show when={item().agent_response}>
                <div class="mt-4 border-t border-white/10 pt-4">
                      <div class="mb-2 inline-flex items-center gap-2 font-semibold">
                        <span>Agent activity</span>
                        <span class="relative inline-flex h-3.5 w-3.5">
                          <Show
                            when={
                              (item().status === "agent_working" && (item().stream_phase ?? "initial") === "initial") ||
                              (donePhase() === "initial" && (doneStage() === "swap" || doneStage() === "fade"))
                            }
                          >
                            <Show
                              when={(item().status === "agent_working" && (item().stream_phase ?? "initial") === "initial") || doneStage() === "swap"}
                              fallback={
                                <span
                                  class="absolute inset-0 flex items-center justify-center text-emerald-300"
                                  classList={{ "ts-check-in": doneStage() === "swap", "ts-check-fade": doneStage() === "fade" }}
                                  aria-hidden="true"
                                >
                                  <svg viewBox="0 0 20 20" fill="none" class="h-3.5 w-3.5">
                                    <path d="M16.5 5.5L8.25 13.75L3.5 9" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
                                  </svg>
                                </span>
                              }
                            >
                              <span classList={{ "ts-spinner-out": item().status !== "agent_working" && doneStage() === "swap" }}>
                                <span class="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-amber-200/70" aria-hidden="true" />
                              </span>
                            </Show>
                          </Show>
                        </span>
                      </div>
                      <pre class="whitespace-pre-wrap text-sm leading-relaxed text-white/85">{item().agent_response}</pre>
                </div>
              </Show>

                  <Show when={item().followup_kind}>
                    <div class="mt-4 border-t border-white/10 pt-4">
                      <div class="mb-2 inline-flex items-center gap-2 font-semibold">
                        <span>{item().followup_kind === "approve" ? "Follow-up after approval" : "Follow-up after coaching"}</span>
                        <span class="relative inline-flex h-3.5 w-3.5">
                          <Show
                            when={
                              (item().status === "agent_working" && item().stream_phase === "followup") ||
                              (donePhase() === "followup" && (doneStage() === "swap" || doneStage() === "fade"))
                            }
                          >
                          <Show when={(item().status === "agent_working" && item().stream_phase === "followup") || (donePhase() === "followup" && doneStage() === "swap")}>
                            <span classList={{ "ts-spinner-out": item().status !== "agent_working" && doneStage() === "swap" }}>
                              <span class="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-amber-200/70" aria-hidden="true" />
                            </span>
                          </Show>
                          <Show when={donePhase() === "followup" && item().status !== "agent_working" && (doneStage() === "swap" || doneStage() === "fade")}>
                            <span
                              class="absolute inset-0 flex items-center justify-center text-emerald-300"
                              classList={{ "ts-check-in": doneStage() === "swap", "ts-check-fade": doneStage() === "fade" }}
                              aria-hidden="true"
                            >
                              <svg viewBox="0 0 20 20" fill="none" class="h-3.5 w-3.5">
                                <path d="M16.5 5.5L8.25 13.75L3.5 9" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
                              </svg>
                            </span>
                          </Show>
                          </Show>
                        </span>
                      </div>
                      <Show when={item().followup_kind === "coach" && item().followup_note}>
                        <div class="mb-3 rounded-xl border border-sky-300/20 bg-sky-300/10 px-3 py-2 text-sm text-white/85">
                          <pre class="whitespace-pre-wrap leading-relaxed">{item().followup_note}</pre>
                        </div>
                      </Show>
                      <Show when={item().agent_followup}>
                        {(resp) => <pre class="whitespace-pre-wrap text-sm leading-relaxed text-white/85">{resp()}</pre>}
                      </Show>
                    </div>
                  </Show>

                  <Show when={item().status === "needs_clarification" || item().status === "agent_stuck" || item().status === "needs_approval"}>
                    <div class="mt-4">
                      <Show
                        when={item().status === "needs_approval"}
                        fallback={
                          <button
                            type="button"
                            class="w-full cursor-pointer rounded-xl border border-amber-200/25 bg-amber-200/10 px-4 py-2.5 text-sm font-semibold text-white/90 transition-colors duration-150 ease-out hover:bg-amber-200/15 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/40"
                            disabled={props.coachAgentPending}
                            onClick={() => props.coachAgent(item().id)}
                          >
                            Coach agent
                          </button>
                        }
                      >
                        <button
                          type="button"
                          class="w-full cursor-pointer rounded-xl border border-emerald-300/25 bg-emerald-300/15 px-4 py-2.5 text-sm font-semibold text-white/95 transition-colors duration-150 ease-out hover:bg-emerald-300/20 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/40"
                          disabled={props.approvePending}
                          onClick={() => props.approveRequest(item().id)}
                        >
                          Approve
                        </button>
                      </Show>
                    </div>
                  </Show>
            </div>
          )}
        </Show>
      </aside>
    </div>
  )
}


