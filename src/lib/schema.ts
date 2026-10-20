import { canonicalUrl } from './paths';
import { site } from '../data/site';

/** BreadcrumbList по списку «название — путь». */
export const breadcrumbs = (items: { name: string; path: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: canonicalUrl(site.url, item.path),
  })),
});

export const personRef = () => ({
  '@type': 'Person',
  '@id': canonicalUrl(site.url, '/ob-advokate/#person'),
  name: site.fullName,
  url: canonicalUrl(site.url, '/ob-advokate/'),
});
