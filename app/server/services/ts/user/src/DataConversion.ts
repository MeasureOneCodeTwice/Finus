//C0j
export function convertToDateTime(date: string) {
  return date.slice(0, 19).replace("T", " ");
}
