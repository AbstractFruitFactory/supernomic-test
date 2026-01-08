import { Suspense } from "solid-js"
import { Router } from "@solidjs/router"
import { FileRoutes } from "@solidjs/start/router"
import { InboxProvider } from "~/inbox/context"
import "./app.css"

export default function App() {
  return (
    <Router root={(props) => <InboxProvider><Suspense>{props.children}</Suspense></InboxProvider>}>
      {FileRoutes()}
    </Router>
  )
}
