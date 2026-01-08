import type { APIEvent } from "@solidjs/start/server"
import type { InboxItem } from "~/types"

type Script = { text: string; end: InboxItem["status"]; endAfterMs: number }

const FOLLOWUP_SCRIPTS: Record<"coach" | "approve", Script> = {
  coach: {
    text:
      "Continuing from the previous update.\n\n" +
      "Incorporating your coaching notes.\n" +
      "Re-checking assumptions and re-running the workflow.\n\n" +
      "Posting an updated status shortly.\n",
    end: "agent_resolved",
    endAfterMs: 16_000,
  },
  approve: {
    text:
      "Approval received.\n\n" +
      "Executing the approved changes.\n" +
      "Monitoring for success conditions and regressions.\n\n" +
      "Finalizing and closing out the request.\n",
    end: "agent_resolved",
    endAfterMs: 18_000,
  },
}

const STREAM_SCRIPTS: Record<string, Script> = {
  req_1003: {
    text:
      "Starting provisioning workflow.\n\n" +
      "Okta: user created, MFA policy applied, group membership queued.\n" +
      "GitHub: org invite sent, team membership pending acceptance.\n" +
      "Notion: workspace access granted, starter docs shared.\n\n" +
      "Double-checking least-privilege defaults and requested repositories.\n" +
      "Blocked: I need the manager to confirm which repos the new hire should access (read vs write).\n",
    end: "agent_stuck",
    endAfterMs: 60_000,
  },
  req_1006: {
    text:
      "Reviewing context and recent changes.\n\n" +
      "Checked service health, recent deploys, and error logs.\n" +
      "Isolated a configuration drift causing intermittent failures.\n" +
      "Prepared a safe rollback plan and a follow-up to prevent recurrence.\n\n" +
      "Applying the fix now and monitoring for recovery.\n",
    end: "agent_resolved",
    endAfterMs: 22_000,
  },
  req_1012: {
    text:
      "Collecting signals from Okta, VPN, and device posture.\n\n" +
      "Found a burst of failed logins from an unusual ASN.\n" +
      "Checking whether MFA prompts were approved.\n" +
      "Blocking the source IP range and forcing password reset.\n\n" +
      "Need confirmation: should we also revoke active sessions for the affected users?\n",
    end: "agent_stuck",
    endAfterMs: 45_000,
  },
  req_1013: {
    text:
      "Enumerating build agents and patch windows.\n\n" +
      "Applying CVE patch to runner images.\n" +
      "Rebuilding base images and rolling out gradually.\n" +
      "Running a full CI validation pass.\n\n" +
      "All green. Patch rollout complete.\n",
    end: "agent_resolved",
    endAfterMs: 30_000,
  },
  req_1014: {
    text:
      "Sampling recent CI runs to identify top flaky tests.\n\n" +
      "Correlated flakes with a recent dependency update.\n" +
      "Pinning the dependency version and re-running the suite.\n+      " +
      "Preparing a follow-up PR to add retries for the two worst offenders.\n\n" +
      "Suite stabilized after pin; opening PR now.\n",
    end: "agent_resolved",
    endAfterMs: 38_000,
  },
  req_1010: {
    text:
      "Pulling pricing and RI coverage report.\n\n" +
      "Comparing 1yr vs 3yr commit and break-even window.\n" +
      "Drafting summary for approval.\n",
    end: "needs_approval",
    endAfterMs: 12_000,
  },
  req_1011: {
    text:
      "Reviewing refund policy and contract addendum.\n\n" +
      "Identified two conflicting clauses.\n" +
      "Drafting clarifying question for Support Ops.\n",
    end: "needs_clarification",
    endAfterMs: 20_000,
  },
  req_1001: {
    text:
      "Collecting device requirements and budget constraints.\n\n" +
      "Prepared purchase options (standard vs higher spec).\n" +
      "Ready for approval to place the order.\n",
    end: "needs_approval",
    endAfterMs: 28_000,
  },
  req_1002: {
    text:
      "Reconciling invoice lines against PO.\n\n" +
      "Found mismatch on tax + shipping line items.\n" +
      "Need clarification on which total should be authoritative.\n",
    end: "needs_clarification",
    endAfterMs: 36_000,
  },
  req_1004: {
    text:
      "Reviewing renewal terms and recent usage.\n\n" +
      "Negotiation path drafted.\n" +
      "Blocked on contract term preference (annual vs multi-year).\n",
    end: "agent_stuck",
    endAfterMs: 55_000,
  },
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export async function GET(event: APIEvent) {
  const url = new URL(event.request.url)
  const id = url.searchParams.get("id")
  if (!id) return new Response("Missing id", { status: 400 })

  const phase = url.searchParams.get("phase") ?? "initial"
  const kind = url.searchParams.get("kind")
  const script =
    phase === "followup"
      ? FOLLOWUP_SCRIPTS[kind === "approve" ? "approve" : "coach"]
      : STREAM_SCRIPTS[id]
  if (!script) return new Response("Unknown id", { status: 404 })

  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false

      const send = (type: string, data: unknown) => {
        if (closed) return
        const payload = typeof data === "string" ? data : JSON.stringify(data)
        controller.enqueue(encoder.encode(`event: ${type}\ndata: ${payload}\n\n`))
      }

      const abort = () => {
        if (closed) return
        closed = true
        try {
          controller.close()
        } catch {
        }
      }

      event.request.signal.addEventListener("abort", abort, { once: true })

      ;(async () => {
          send("open", { id })

          const startedAt = Date.now()
          await wait(650)

          const tokens = script.text.split(/(\s+)/)
          let idx = 0
          for (const tok of tokens) {
            if (event.request.signal.aborted) return
            send("token", { id, token: tok, idx })
            idx++
            await wait(tok.trim() ? 90 : 25)
          }

          if (event.request.signal.aborted) return
          const elapsed = Date.now() - startedAt
          const remaining = Math.max(0, script.endAfterMs - elapsed)
          if (remaining) await wait(remaining)
          send("done", { id, status: script.end })
          abort()
        })().catch(() => abort())
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}


