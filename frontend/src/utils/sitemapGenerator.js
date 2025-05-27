// src/utils/sitemapGenerator.js
import fs from 'fs/promises';
import path from 'path';

const BASE_URL = 'http://localhost:5173';
const PAGES = [
  { url: '/', changefreq: 'daily', priority: '1.0' },
  { url: '/signin', changefreq: 'monthly', priority: '0.8' },
  { url: '/signup', changefreq: 'monthly', priority: '0.8' },
  { url: '/forgotpassword', changefreq: 'monthly', priority: '0.5' },
  { url: '/posts', changefreq: 'daily', priority: '0.9' },
];

const generateSitemap = async () => {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
                            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  ${PAGES.map(page => `
    <url>
      <loc>${BASE_URL}${page.url}</loc>
      <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
      <changefreq>${page.changefreq}</changefreq>
      <priority>${page.priority}</priority>
    </url>`).join('')}
</urlset>`;

  try {
    const dir = path.join(process.cwd(), 'public');
    await fs.writeFile(path.join(dir, 'sitemap.xml'), sitemap);
    console.log('Sitemap generated successfully!');
  } catch (error) {
    console.error('Error generating sitemap:', error);
  }
};

export default generateSitemap;
