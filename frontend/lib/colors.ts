// Phase 1B: 12 color definitions + picker helper

function hexToGlow(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, 0.4)`;
}

const HEXES = [
  '#60A5FA', '#4ADE80', '#F472B6', '#A78BFA',
  '#FBBF24', '#22D3EE', '#FB7185', '#A3E635',
  '#FB923C', '#2DD4BF', '#818CF8', '#E879F9',
] as const;

const NAMES = [
  'Blue', 'Green', 'Pink', 'Purple',
  'Amber', 'Cyan', 'Rose', 'Lime',
  'Orange', 'Teal', 'Indigo', 'Fuchsia',
] as const;

export const FRIEND_COLORS = HEXES.map((hex, i) => ({
  name: NAMES[i],
  hex,
  glow: hexToGlow(hex),
}));

export function getAvailableColors(takenColors: string[]) {
  return FRIEND_COLORS.filter((c) => !takenColors.includes(c.hex));
}
