import type { InboxItem } from "~/types"

function avatarUrl(seed: string) {
  const url = new URL("https://api.dicebear.com/7.x/personas/svg")
  url.searchParams.set("seed", seed)
  url.searchParams.set("backgroundColor", "b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf")
  url.searchParams.set("radius", "50")
  return url.toString()
}

export function createMockInboxItems(now = Date.now()): InboxItem[] {
  const iso = (msAgo: number) => new Date(now - msAgo).toISOString()

  return [
    {
      id: "req_1010",
      requester: { name: "Priya Singh", team: "Procurement", avatar: avatarUrl("Priya Singh") },
      subject: "Approve AWS reserved instances purchase",
      summary: "Agent prepared cost breakdown; needs approval to proceed.",
      status: "agent_working",
      priority: "urgent",
      created_at: iso(8 * 60 * 1000),
    },
    {
      id: "req_1011",
      requester: { name: "Jordan Lee", team: "Support Ops", avatar: avatarUrl("Jordan Lee") },
      subject: "Clarify refund policy exception",
      summary: "Agent needs clarification on edge-case refund rules for enterprise customer.",
      status: "agent_working",
      priority: "high",
      created_at: iso(18 * 60 * 1000),
    },
    {
      id: "req_1001",
      requester: {
        name: "Ava Johnson",
        team: "IT Ops",
        avatar: avatarUrl("Ava Johnson"),
      },
      subject: "New MacBook for contractor",
      summary: "Needs approval for a 14-inch MacBook Pro purchase.",
      status: "agent_working",
      priority: "high",
      created_at: iso(2 * 60 * 60 * 1000),
    },
    {
      id: "req_1002",
      requester: {
        name: "Noah Kim",
        team: "Finance",
        avatar: avatarUrl("Noah Kim"),
      },
      subject: "Vendor invoice discrepancy",
      summary: "Invoice total doesn't match PO. Agent needs clarification.",
      status: "agent_working",
      priority: "urgent",
      created_at: iso(35 * 60 * 1000),
    },
    {
      id: "req_1012",
      requester: { name: "Olivia Park", team: "Security", avatar: avatarUrl("Olivia Park") },
      subject: "Investigate suspicious login alerts",
      summary: "Agent is correlating alerts across Okta and VPN logs.",
      status: "agent_working",
      priority: "urgent",
      created_at: iso(4 * 60 * 1000),
    },
    {
      id: "req_1003",
      requester: {
        name: "Mia Chen",
        team: "People Ops",
        avatar: avatarUrl("Mia Chen"),
      },
      subject: "Provision access for new hire",
      summary: "Okta + GitHub + Notion access provisioning in progress.",
      status: "agent_working",
      priority: "medium",
      created_at: iso(12 * 60 * 1000),
    },
    {
      id: "req_1006",
      requester: {
        name: "Ethan Brooks",
        team: "Tech Ops",
        avatar: avatarUrl("Ethan Brooks"),
      },
      subject: "Investigate intermittent 5xx spikes",
      summary: "Agent is investigating recent incidents and preparing a fix.",
      status: "agent_working",
      priority: "high",
      created_at: iso(6 * 60 * 1000),
    },
    {
      id: "req_1013",
      requester: { name: "Sam Rivera", team: "IT Ops", avatar: avatarUrl("Sam Rivera") },
      subject: "Patch critical CVE on build agents",
      summary: "Agent is coordinating patching across CI runners and validating builds.",
      status: "agent_working",
      priority: "high",
      created_at: iso(26 * 60 * 1000),
    },
    {
      id: "req_1014",
      requester: { name: "Hana Nakamura", team: "Engineering", avatar: avatarUrl("Hana Nakamura") },
      subject: "CI pipeline flakiness triage",
      summary: "Agent is collecting flaky tests and preparing a fix plan.",
      status: "agent_working",
      priority: "medium",
      created_at: iso(42 * 60 * 1000),
    },
    {
      id: "req_1004",
      requester: {
        name: "Lucas Patel",
        team: "Engineering",
        avatar: avatarUrl("Lucas Patel"),
      },
      subject: "Renew Datadog subscription",
      summary: "Agent got stuck on contract terms and needs guidance.",
      status: "agent_working",
      priority: "high",
      created_at: iso(55 * 60 * 1000),
    },
    {
      id: "req_1005",
      requester: {
        name: "Sofia Garcia",
        team: "Security",
        avatar: avatarUrl("Sofia Garcia"),
      },
      subject: "Rotate API keys",
      summary: "Agent completed rotation and documented steps.",
      status: "agent_resolved",
      priority: "low",
      created_at: iso(6 * 60 * 60 * 1000),
      agent_response: "Rotated keys and updated secrets store. No errors detected.",
    },
    {
      id: "req_1015",
      requester: { name: "Ben Ward", team: "Finance", avatar: avatarUrl("Ben Ward") },
      subject: "Close out Q4 vendor accruals",
      summary: "Agent completed reconciliation; ready for review.",
      status: "agent_resolved",
      priority: "medium",
      created_at: iso(90 * 60 * 1000),
      agent_response: "Reconciled outstanding invoices against POs; flagged two items for follow-up next week.",
    },
  ]
}


