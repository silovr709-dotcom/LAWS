import { hasEmail, site } from '../data/site';

/** Collection is explicitly opt-in. Static hosting always presents a direct, honest contact action. */
const requested = import.meta.env.PUBLIC_FORM_ENDPOINT ?? 'vk';
const serverEnabled = import.meta.env.CONTACT_FORM_ENABLED === 'true' && Boolean(import.meta.env.LEADS_DIR?.startsWith('/'));
export const contactMode: 'server' | 'mailto' | 'vk' =
  requested === '/api/contact' && serverEnabled ? 'server' : requested === 'mailto' && hasEmail ? 'mailto' : 'vk';
export const directContactHref = contactMode === 'mailto' ? `mailto:${site.email}` : site.vkChat;
