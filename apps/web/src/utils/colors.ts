// Pastel / macaron palette (curated; limited choices for a consistent UI)
export const MACARON_COLORS = [
  '#A7D8FF', // baby blue
  '#B8E2CF', // mint
  '#FFD6A5', // peach
  '#FFB4C6', // pink
  '#C7B8FF', // lavender
  '#FFE08A', // soft yellow
  '#AEEBFF', // sky
  '#BFE6A8', // light green
  '#FFC2A1', // coral
  '#B9C7FF', // periwinkle
  '#F6B8FF', // lilac pink
  '#BFE9E6', // aqua mint
]

export function randomModuleColor() {
  return MACARON_COLORS[Math.floor(Math.random() * MACARON_COLORS.length)] ?? '#A7D8FF'
}

