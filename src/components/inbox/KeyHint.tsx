import type { JSX } from "solid-js"

export function KeyHint(props: { children: JSX.Element; class?: string }) {
  return (
    <span class={`inline-flex items-center gap-1 rounded-md border border-white/10 bg-[#1a1a1a] px-2 py-1 font-mono text-xs text-white/80 ${props.class ?? ""}`}>
      {props.children}
    </span>
  )
}

export function KeyPairHint(props: { left: JSX.Element; right: JSX.Element; align?: "left" | "right" }) {
  const justify = () => (props.align === "right" ? "justify-end" : "justify-start")
  return (
    <div class={`flex h-7 items-center ${justify()}`}>
      <div class="inline-flex items-center gap-1">
        <KeyHint>{props.left}</KeyHint>
        <span class="text-white/40">/</span>
        <KeyHint>{props.right}</KeyHint>
      </div>
    </div>
  )
}


