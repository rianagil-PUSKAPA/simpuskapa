export function getDateNow(): number {
  const now = new Date(Date.now())
  now.setHours(0, 0, 0, 0)

  return Math.floor(now.getTime() / 1000)
}

export function getEndOfJanuaryNextYear(before: bigint | number): number {
  const beforeDate = new Date(Number(before))
  beforeDate.setFullYear(new Date().getFullYear() + 1)
  beforeDate.setHours(23, 59, 59, 0)
  beforeDate.setMonth(0, 31)

  return Math.floor(beforeDate.getTime() / 1000)
}

export function formatDateToCsv(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')

  return `${year}${month}${day}${hour}${minute}`
}
