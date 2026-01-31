// Macaron palette - vibrant yet soft, with better contrast against light backgrounds
export const MACARON_COLORS = [
  '#5BA4E6', // sky blue (more saturated)
  '#4ECBA0', // mint green
  '#F59E5F', // warm peach
  '#F06F8E', // coral pink
  '#9B85E8', // soft violet
  '#E6B84D', // golden yellow
  '#3CBFDC', // turquoise
  '#7AC46F', // fresh green
  '#F07C5C', // salmon coral
  '#7A8FE8', // periwinkle blue
  '#D67BE8', // orchid purple
  '#4FC9C4', // teal
]

export function randomModuleColor() {
  return MACARON_COLORS[Math.floor(Math.random() * MACARON_COLORS.length)] ?? '#A7D8FF'
}

