import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://chesshubacademy.online';

  // Core static marketing pages and SEO landing pages
  const routes = [
    '',
    '/online-chess-classes-for-kids',
    '/chess-coaching-for-beginners',
    '/one-to-one-chess-coaching',
    '/online-chess-academy',
    '/chess-tournament-training',
    '/chess-openings-for-beginners',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  return [...routes];
}
