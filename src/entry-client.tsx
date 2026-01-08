// @refresh reload
import { mount, StartClient } from "@solidjs/start/client";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";

const queryClient = new QueryClient();

export default function entryClient() {
  if (typeof window !== "undefined") {
    const w = window as Window & { __entryClientMounted?: boolean };
    if (w.__entryClientMounted) return;
    w.__entryClientMounted = true;
  }

  mount(
    () => (
      <QueryClientProvider client={queryClient}>
        <StartClient />
      </QueryClientProvider>
    ),
    document.getElementById("app")!
  );
}

entryClient();
