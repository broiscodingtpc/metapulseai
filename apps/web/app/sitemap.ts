import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.metapulse.tech';
  const currentDate = new Date();

  return [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/feed`,
      lastModified: currentDate,
      changeFrequency: 'always',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/metas`,
      lastModified: currentDate,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tokens`,
      lastModified: currentDate,
      changeFrequency: 'hourly',
      priority: 0.8,
    },

  ];
}

