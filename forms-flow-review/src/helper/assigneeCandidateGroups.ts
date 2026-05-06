type TaskCandidatePayload = {
  _embedded?: { candidateGroups?: Array<{ groupId?: string }> };
  candidateGroups?: Array<string | { groupId?: string }>;
};

/**
 * Collects BPM candidate group ids from a single task object.
 * Supports HAL task rows (`_embedded.candidateGroups[].groupId`) and
 * Camunda-style detail (`candidateGroups` as strings or `{ groupId }`).
 */
export function getCandidateGroupIdsFromTask(task: unknown): string[] {
  if (!task || typeof task !== "object") return [];
  const t = task as TaskCandidatePayload;

  const hal = t._embedded?.candidateGroups;
  if (Array.isArray(hal) && hal.length > 0) {
    const fromHal = hal
      .map((g) => g?.groupId)
      .filter((id): id is string => Boolean(id));
    if (fromHal.length > 0) return fromHal;
  }

  const raw = t.candidateGroups;
  if (!Array.isArray(raw) || raw.length === 0) return [];
  return raw
    .map((g) => (typeof g === "string" ? g : g?.groupId))
    .filter((id): id is string => Boolean(id));
}

/**
 * Same as {@link getCandidateGroupIdsFromTask} on `primary`, then on `fallback` if primary had none.
 * Use when task detail omits groups but the list row still has `_embedded.candidateGroups`.
 */
export function resolveTaskCandidateGroupIds(
  primary: unknown,
  fallback: unknown
): string[] {
  const fromPrimary = getCandidateGroupIdsFromTask(primary);
  if (fromPrimary.length > 0) return fromPrimary;
  return getCandidateGroupIdsFromTask(fallback);
}

// --- Member-of-group user API (assignee dropdown) ---

export type MemberOfGroupUserRow = {
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

export type MemberOfGroupUsersApiBody = {
  data?: MemberOfGroupUserRow[];
  count?: number | null;
};

export type MemberOfGroupSelectOption = { label: string; value: string };

function formatLastCommaFirst(firstName: string, lastName: string): string {
  if (lastName && firstName) return `${lastName}, ${firstName}`;
  if (lastName) return lastName;
  return firstName;
}

/**
 * Maps member-of-group API payload to dropdown options (label: "LastName, FirstName", value: username).
 */
export function mapMemberOfGroupUsersToSelectOptions(
  apiResponse: MemberOfGroupUsersApiBody
): MemberOfGroupSelectOption[] {
  const rows = apiResponse?.data ?? [];
  const opts = rows
    .map((r) => {
      const username = r.username != null ? String(r.username).trim() : "";
      if (!username) return null;
      const firstName = r.firstName != null ? String(r.firstName).trim() : "";
      const lastName = r.lastName != null ? String(r.lastName).trim() : "";
      return { label: formatLastCommaFirst(firstName, lastName), value: username };
    })
    .filter((x): x is MemberOfGroupSelectOption => x != null)
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
  return opts;
}
