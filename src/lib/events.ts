/** Local, non-persistent integration point. No requests, identifiers or form values are collected. */
export type SiteGoal = 'contact_vk' | 'contact_phone' | 'contact_email' | 'contact_success' | 'service_open';
export function trackGoal(name: SiteGoal): void {
  window.dispatchEvent(new CustomEvent('law:goal', { detail: { name, path: window.location.pathname } }));
}
export function initGoals(): void {
  const allowed: SiteGoal[] = ['contact_vk', 'contact_phone', 'contact_email', 'service_open'];
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const goal = target.closest<HTMLElement>('[data-goal]')?.dataset.goal as SiteGoal | undefined;
    if (goal && allowed.includes(goal)) trackGoal(goal);
  });
}
