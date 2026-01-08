# Supernomic Test

Minimal “split inbox” demo built with SolidStart + Solid Router, using TanStack Solid Query for initial data load and SSE for streaming agent updates.

## Setup

### Prerequisites

- Node.js **22+**
- [Bun](https://bun.sh)

### Install

```bash
bun install
```

## Run locally

### Dev server

```bash
bun run dev
```

Then open `http://localhost:3000`.

### Production build

```bash
bun run build
```

### Preview production build

```bash
bun run start
```

## Key decisions & trade-offs

- **Solid store for interactive state - TanStack Query for initial data**
  
  `useQuery` is used for the initial inbox load. A Solid store owns app state (selection/open/scope) and streaming updates.

- **Server Sent Events (SSE) for streaming agent output**

   Mocked agent output streams over an SSE endpoint since the UI primarily needs server -> client text streaming.

  Downside is that we have a limit on number of open concurrent connections, but I've mitigated a bit by prioritizing current selected item. Also, since this is mocked in this version, partial stream doesn't persist and it can reset if connection is dropped.

- **UI cognitive load considerations**

  The UI minimized cognitive load, e.g by not showing task priority (medium/high/urgent) when agent is resolved. The idea is to not overload the user with attention-grabbing hints, but use them where it really matters (tasks that aren't finished yet). You can still see the priority in the details view for documentation purposes.

## Further potential improvements

- **Persisted data model**

  Move mocked inbox items to a real backend store and make the SSE stream reflect actual agent job progress. Add cursor-based resume (e.g. "Last-Event-ID" / explicit offsets) so reconnects continue exactly where they left off (e.g when refreshing).

- **Improve streaming**

  Instead of per-item stream, use a single multiplexed transport to prevent connection limitations.

- **Failure handling & recovery**

  Add error states for connection failures, retry/backoff with "reconnecting…" UI, and a “Resume” / “Retry” options.

- **Cancellation of agent work**

  Allow cancelling working agents.

- **Search bar / Filtering**

  Implement bottom search bar with filter capabilities.

