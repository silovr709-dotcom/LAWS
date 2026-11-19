/** Local, non-persistent integration point. No requests, identifiers or form values are collected. */
export type SiteGoal =
  | 'contact_vk'
  | 'contact_phone'
  | 'contact_email'
  | 'contact_success'
  | 'service_open'
  | 'situation_open'
  | 'doc_open'
  | 'doc_download'
  | 'doc_copy'
  | 'memo_view'
  | 'memo_download'
  | 'calc_use'
  | 'detention_timer'
  | 'draft_check'
  | 'draft_sample'
  | 'search_use'
  | 'registry_check';

const allowed: SiteGoal[] = [
  'contact_vk',
  'contact_phone',
  'contact_email',
  'contact_success',
  'service_open',
  'situation_open',
  'doc_open',
  'doc_download',
  'doc_copy',
  'memo_view',
  'memo_download',
  'calc_use',
  'detention_timer',
  'draft_check',
  'draft_sample',
  'search_use',
  'registry_check',
];

export function trackGoal(name: SiteGoal): void {
  window.dispatchEvent(new CustomEvent('law:goal', { detail: { name, path: window.location.pathname } }));
}

export function initGoals(): void {
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const goal = target.closest<HTMLElement>('[data-goal]')?.dataset.goal as SiteGoal | undefined;
    if (goal && allowed.includes(goal)) trackGoal(goal);
  });
}
