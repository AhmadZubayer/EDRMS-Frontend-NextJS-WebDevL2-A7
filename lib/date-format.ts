// Use the same Bangladesh locale and time zone during SSR and hydration.
export function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', { timeZone: 'Asia/Dhaka' });
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' });
}
