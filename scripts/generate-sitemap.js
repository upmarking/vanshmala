import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://vanshmala.in';
const SUPABASE_REST_URL = 'https://qngfdcbccnguftxzecwq.supabase.co/rest/v1/blogs?is_published=eq.true&select=slug,published_at';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuZ2ZkY2JjY25ndWZ0eHplY3dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4OTEzMjEsImV4cCI6MjA4NjQ2NzMyMX0.gnMlusI3u02cuszKFFL7Yb_rm1exC7LT8Tev4loSX7E';

// Static pages
const staticPages = [
  { path: '', changefreq: 'weekly', priority: '1.0' },
  { path: '/login', changefreq: 'monthly', priority: '0.8' },
  { path: '/register', changefreq: 'monthly', priority: '0.8' },
  { path: '/privacy-policy', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms-of-use', changefreq: 'yearly', priority: '0.3' },
  { path: '/contact-us', changefreq: 'monthly', priority: '0.7' },
  { path: '/app', changefreq: 'monthly', priority: '0.7' },
  { path: '/child-safety-standards', changefreq: 'monthly', priority: '0.5' },
  { path: '/data-deletion-request', changefreq: 'yearly', priority: '0.3' },
  { path: '/blog', changefreq: 'weekly', priority: '0.9' },
  { path: '/dharma', changefreq: 'weekly', priority: '0.9' },
  { path: '/kundali', changefreq: 'weekly', priority: '0.9' },
  { path: '/vanshmitra', changefreq: 'weekly', priority: '0.9' },
  { path: '/offer-page', changefreq: 'monthly', priority: '0.8' }
];

async function generateSitemap() {
  console.log('Generating sitemap.xml...');
  const today = new Date().toISOString().split('T')[0];
  let urls = [];

  // 1. Add static pages
  for (const page of staticPages) {
    urls.push(`  <url>
    <loc>${BASE_URL}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`);
  }

  // 2. Add local Dharma blogs
  try {
    const dharmaBlogsDir = path.join(__dirname, '../src/data/dharma/blogs');
    if (fs.existsSync(dharmaBlogsDir)) {
      const files = fs.readdirSync(dharmaBlogsDir);
      for (const file of files) {
        if (file.endsWith('.ts')) {
          const filePath = path.join(dharmaBlogsDir, file);
          const content = fs.readFileSync(filePath, 'utf8');

          const slugMatch = content.match(/slug:\s*["']([^"']+)["']/);
          const dateMatch = content.match(/publishedAt:\s*["']([^"']+)["']/);

          if (slugMatch) {
            const slug = slugMatch[1];
            const date = dateMatch ? dateMatch[1].split('T')[0] : today;
            urls.push(`  <url>
    <loc>${BASE_URL}/dharma/${slug}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
          }
        }
      }
      console.log(`Loaded ${files.length} local Dharma blogs.`);
    }
  } catch (error) {
    console.error('Error reading local Dharma blogs:', error.message);
  }

  // 3. Add dynamic blogs from Supabase
  try {
    console.log('Fetching dynamic blogs from Supabase...');
    const response = await fetch(SUPABASE_REST_URL, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (response.ok) {
      const blogs = await response.json();
      console.log(`Fetched ${blogs.length} dynamic blogs.`);
      for (const blog of blogs) {
        if (blog.slug) {
          const date = blog.published_at ? blog.published_at.split('T')[0] : today;
          urls.push(`  <url>
    <loc>${BASE_URL}/blog/${blog.slug}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
        }
      }
    } else {
      console.error(`Failed to fetch blogs from Supabase: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error fetching blogs from Supabase:', error.message);
  }

  // Construct XML
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;

  const outputPath = path.join(__dirname, '../public/sitemap.xml');
  fs.writeFileSync(outputPath, sitemapXml);
  console.log(`Successfully generated sitemap.xml at ${outputPath}`);
}

generateSitemap().catch(err => {
  console.error('Sitemap generation failed:', err);
  process.exit(1);
});
