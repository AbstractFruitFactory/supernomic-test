import { Show } from "solid-js"
import type { InboxItem } from "~/types"

function statusLabel(status: InboxItem["status"]) {
  return status
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ")
}

function statusPillClasses(status: InboxItem["status"]) {
  switch (status) {
    case "agent_working":
      return "border-sky-300/20 bg-sky-300/10 text-sky-100"
    case "agent_resolved":
      return "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
    case "needs_clarification":
      return "border-amber-300/20 bg-amber-300/10 text-amber-100"
    case "needs_approval":
      return "border-yellow-300/20 bg-yellow-300/10 text-yellow-100"
    case "agent_stuck":
      return "border-rose-300/20 bg-rose-300/10 text-rose-100"
    default:
      return "border-white/10 bg-white/5 text-white/80"
  }
}

export function StatusPill(props: { status: InboxItem["status"]; showSpinner?: boolean }) {
  return (
    <span class={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs ${statusPillClasses(props.status)}`}>
      <Show when={props.showSpinner && props.status === "agent_working"}>
        <span class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-amber-200/70" aria-hidden="true" />
      </Show>
      {statusLabel(props.status)}
    </span>
  )
}


