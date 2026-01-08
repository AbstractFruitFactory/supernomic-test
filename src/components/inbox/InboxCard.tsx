import type { InboxItem } from "~/types"
import { Avatar } from "~/components/Avatar"
import { StatusPill } from "./StatusPill"
import { Show } from "solid-js"

export function InboxCard(props: {
  id: string
  item: () => InboxItem
  selected: () => boolean
  open: () => boolean
  onClick: () => void
  setRowEl: (el: HTMLButtonElement) => void
}) {
  return (
    <button
      type="button"
      class="relative flex h-40 w-full cursor-pointer flex-col justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/40"
      classList={{
        "border-amber-200/70 bg-white/10 ring-2 ring-amber-200/25": props.selected(),
        "before:content-[''] before:absolute before:inset-y-3 before:left-0 before:w-1 before:rounded-r before:bg-amber-200/70":
          props.open(),
      }}
      ref={props.setRowEl}
      onClick={props.onClick}
    >
      <div class="flex items-start justify-between gap-3">
        <div class="flex min-w-0 items-center gap-2">
          <Avatar name={props.item().requester.name} src={props.item().requester.avatar} />
          <div class="min-w-0 text-sm text-white/80">
            <div class="line-clamp-2">
              {props.item().requester.name} · {props.item().requester.team}
            </div>
          </div>
        </div>
        <div class="flex flex-wrap items-center justify-end gap-1.5">
          <StatusPill status={props.item().status} showSpinner />
          <Show when={props.item().status !== "agent_resolved"}>
            <span
              class="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs capitalize text-white/80"
              classList={{
                "border-rose-300/35 bg-rose-300/20 text-rose-50": props.item().priority === "urgent",
                "border-amber-200/20 bg-amber-200/10": props.item().priority !== "urgent",
              }}
            >
              <Show when={props.item().priority === "urgent"}>
                <span
                  class="inline-flex h-4 w-4 items-center justify-center rounded-full bg-rose-200/90 text-[10px] font-extrabold leading-none text-rose-950"
                  aria-hidden="true"
                >
                  !
                </span>
              </Show>
              {props.item().priority}
            </span>
          </Show>
        </div>
      </div>
      <div class="mt-2 line-clamp-2 font-semibold leading-snug">{props.item().subject}</div>
    </button>
  )
}


