/** Tiny color helper for status lights */
export function lightToTailwind(light: 'green' | 'amber' | 'red'): string {
  switch (light) {
    case 'green':
      return 'text-[--k-success]';
    case 'amber':
      return 'text-amber-400';
    case 'red':
    default:
      return 'text-red-400';
  }
}
