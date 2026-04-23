const CHECKLIST_STORAGE_KEY = "checklistItems";

export const getStoredChecklistItems = () => {
  try {
    const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const storeChecklistItems = (items: any[] | null) => {
  if (Array.isArray(items)) {
    localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(items));
  } else {
    localStorage.removeItem(CHECKLIST_STORAGE_KEY);
  }
};

/**
 * Finds the first uncompleted checklist item matching `routeKey`, invokes
 * the provided `completer` with its id, then updates localStorage.
 * Non-blocking — errors are swallowed.
 *
 * @param routeKey  - The routeKey to match against stored checklist items.
 * @param completer - Package-level function that calls the completion API.
 */
export const completeChecklistByRouteKey =
  (routeKey: string, completer: (id: number) => Promise<any>) =>
  async () => {
    const items = getStoredChecklistItems();
    if (!items) {
      return;
    }
    const match = items.find((i) => i.routeKey === routeKey && !i.isCompleted);
    if (!match) {
      return;
    }
    try {
      const res = await completer(match.id);
      const data = res?.data ?? res;
      const isCompleted =
        typeof data?.isCompleted === "boolean" ? data.isCompleted : true;
      const idFromApi =
        typeof data?.id === "number" ? data.id : match.id;
      storeChecklistItems(
        items.map((item) =>
          item.id === idFromApi ? { ...item, isCompleted } : item
        )
      );
    } catch {
      // non-blocking
    }
  };
