import type { MetadataRoute } from 'next'
import { UFS } from '@/lib/domain/ufs'
import { SITE } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE.url, changeFrequency: 'hourly', priority: 1 },
    { url: `${SITE.url}/hemocentros`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE.url}/posso-doar`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE.url}/sobre`, changeFrequency: 'monthly', priority: 0.4 },
    ...UFS.map((uf) => ({
      url: `${SITE.url}/estado/${uf.toLowerCase()}`,
      changeFrequency: 'hourly' as const,
      priority: 0.7,
    })),
  ]
}
