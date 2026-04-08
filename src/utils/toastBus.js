const subscribers = new Set();

function emitToast(toast) {
  subscribers.forEach((subscriber) => {
    try {
      subscriber(toast);
    } catch {
      // Ignore subscriber errors to keep notifications resilient.
    }
  });
}

export function pushToast(message, tone = 'info', duration = 2600) {
  emitToast({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    message,
    tone,
    duration
  });
}

export function subscribeToToasts(listener) {
  subscribers.add(listener);
  return () => {
    subscribers.delete(listener);
  };
}
