export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return 'Not scheduled';
  }

  return new Date(value).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function toDateInputValue(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function fromDateInputValue(value: string) {
  return new Date(value).toISOString();
}

export function isFutureDate(value: string) {
  return new Date(value).getTime() > Date.now();
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat([], { style: 'currency', currency: 'USD' }).format(value);
}