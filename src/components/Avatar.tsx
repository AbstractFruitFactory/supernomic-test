import { Show } from "solid-js"

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function Avatar(props: { name: string; src?: string; size?: number }) {
  const size = () => props.size ?? 28

  return (
    <span
      class="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5"
      style={{ width: `${size()}px`, height: `${size()}px` }}
      aria-hidden="true"
    >
      <Show
        when={props.src}
        fallback={<span class="select-none text-[0.72rem] font-bold tracking-[0.02em] text-white/80">{initialsFromName(props.name)}</span>}
      >
        {(src) => <img class="block h-full w-full object-cover" src={src()} alt={props.name} loading="lazy" />}
      </Show>
    </span>
  )
}


