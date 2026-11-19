import { site } from '../data/site';

/** Search indexing is an explicit launch decision, never the default for a preview. */
export const siteNoindex = import.meta.env.PUBLIC_NOINDEX !== 'false'
  || new URL(site.url).hostname.endsWith('.github.io');
