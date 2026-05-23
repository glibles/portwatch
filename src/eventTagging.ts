/**
 * eventTagging.ts
 * Assigns and manages tags on port events for downstream filtering and routing.
 */

export interface TagRule {
  tag: string;
  match: (event: { port: number; protocol: string; process?: string }) => boolean;
}

export interface TagStore {
  rules: TagRule[];
}

export function createTagStore(): TagStore {
  return { rules: [] };
}

export function addTagRule(store: TagStore, rule: TagRule): void {
  store.rules.push(rule);
}

export function removeTagRule(store: TagStore, tag: string): void {
  store.rules = store.rules.filter((r) => r.tag !== tag);
}

export function tagEvent<T extends { port: number; protocol: string; process?: string }>(
  store: TagStore,
  event: T
): T & { tags: string[] } {
  const tags = store.rules
    .filter((r) => r.match(event))
    .map((r) => r.tag);
  return { ...event, tags };
}

export function tagEvents<T extends { port: number; protocol: string; process?: string }>(
  store: TagStore,
  events: T[]
): Array<T & { tags: string[] }> {
  return events.map((e) => tagEvent(store, e));
}

export function hasTag(
  event: { tags?: string[] },
  tag: string
): boolean {
  return Array.isArray(event.tags) && event.tags.includes(tag);
}

export function filterByTag<T extends { tags?: string[] }>(
  events: T[],
  tag: string
): T[] {
  return events.filter((e) => hasTag(e, tag));
}
