export type InboxItem = {
  id: string
  requester: { name: string; team: string; avatar?: string }
  subject: string
  summary: string
  status: "agent_working" | "agent_resolved" | "needs_clarification" | "needs_approval" | "agent_stuck"
  priority: "low" | "medium" | "high" | "urgent"
  created_at: string
  agent_response?: string
  agent_followup?: string
  followup_kind?: "coach" | "approve"
  followup_note?: string
  stream_phase?: "initial" | "followup"
}

export type InboxKey = "ai" | "needs_you"

export function inboxForStatus(status: InboxItem["status"]): InboxKey {
  switch (status) {
    case "agent_working":
    case "agent_resolved":
      return "ai"
    case "needs_clarification":
    case "needs_approval":
    case "agent_stuck":
      return "needs_you"
    default:
      throw new Error(`Unknown status: ${status}`)
  }
}
