export function hasCompletedTour(key: string) {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.localStorage.getItem(key) === 'complete';
  } catch {
    return false;
  }
}

export function markTourComplete(key: string) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(key, 'complete');
  } catch {
    // The tour still works when storage is unavailable; it simply may reappear.
  }
}
