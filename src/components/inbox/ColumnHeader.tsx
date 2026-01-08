export function ColumnHeader(props: {
  colStart: 1 | 2 | 3
  title: string
  active: boolean
  selected: boolean
}) {
  return (
    <div
      class={`sticky top-5 z-20 col-start-${props.colStart} row-start-2 px-3`}
    >
      <div
        class="rounded-2xl border border-white/30 border-b-5 bg-[#1a1a1a] px-3 py-3"
        classList={{
          "border-amber-200/55 bg-[#242424]": props.active,
          "border-amber-200/80": props.selected,
        }}
      >
        <h2 class="text-base font-semibold">{props.title}</h2>
      </div>
    </div>
  )
}


