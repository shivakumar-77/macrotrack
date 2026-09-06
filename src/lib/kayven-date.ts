export function kayvenToday(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const values: Record<string, string> = {}

  for (const part of parts) {
    values[part.type] = part.value
  }

  return `${values.year}-${values.month}-${values.day}`
}
