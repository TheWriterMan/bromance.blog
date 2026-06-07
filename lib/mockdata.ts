import { Category, Tag, Post, PostTag, MediaItem, Schema } from './db';

// Beautiful robust mock categories
export const MOCK_CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    name: 'Web Engineering',
    slug: 'web-engineering',
    description: 'Expert frameworks, performance tuning, and server components.'
  },
  {
    id: 'cat-2',
    name: 'UI/UX Design',
    slug: 'ui-ux-design',
    description: 'Typography scales, minimalist interfaces, and visual systems.'
  },
  {
    id: 'cat-3',
    name: 'Developer Focus',
    slug: 'developer-focus',
    description: 'Flow states, workstation ergonomics, and productivity rituals.'
  },
  {
    id: 'cat-4',
    name: 'Systems Design',
    slug: 'systems-design',
    description: 'Distributing databases, file proxies, and edge workers.'
  }
];

// Beautiful tags
export const MOCK_TAGS: Tag[] = [
  { id: 'tag-1', name: 'Next.js 15', slug: 'nextjs-15' },
  { id: 'tag-2', name: 'TypeScript', slug: 'typescript' },
  { id: 'tag-3', name: 'Tailwind CSS', slug: 'tailwind-css' },
  { id: 'tag-4', name: 'Serverless', slug: 'serverless' },
  { id: 'tag-5', name: 'Cloudinary', slug: 'cloudinary' },
  { id: 'tag-6', name: 'Typography', slug: 'typography' },
  { id: 'tag-7', name: 'Drizzle ORM', slug: 'drizzle-orm' }
];

// High-fidelity posts with structured HTML contents
export const MOCK_POSTS: Post[] = [
  {
    id: 'post-1',
    title: 'The Art of Minimalist Typography in Modern Web Layouts',
    slug: 'art-of-minimalist-typography',
    content: `<p>Typography is the cornerstone of great design. When we strip away decorative borders, vibrant gradients, and heavy background cards, language is all that remains. Establishing a rigorous typographic scale is the absolute highest-impact shift you can make to any layout.</p>
    <h2>Establishing a Flawless Typography Scale</h2>
    <p>A pristine visual system relies on clear mathematical proportions. For modern displays, a 1.250 major-third ratio ensures clean readability and natural hierarchy:</p>
    <ul>
      <li><strong>Hero Display Font:</strong> Space Grotesk at 3.052rem (Bold & tracking-tight)</li>
      <li><strong>H2 Section Heading:</strong> Inter at 2.441rem (Medium, tracking-tight with ample top margin)</li>
      <li><strong>H3 Subsection Title:</strong> Inter at 1.953rem (Medium, neutral-800 text)</li>
      <li><strong>Body Text:</strong> Inter at 1rem with high, eye-safe line height (1.625 to 1.75)</li>
    </ul>
    <blockquote>"Whitespace is not empty space; it is the ultimate placeholder of visual hierarchy, breathing room, and elegance."</blockquote>
    <p>By pairing beautiful displays with negative margins, the content frames itself. In subsequent guides, we'll implement fully fluid CSS clamp equations.</p>`,
    summary: 'A minimalist masterclass in typography pairing, negative margins, and proportion-based typographic scaling on high-density displays.',
    status: 'published',
    published_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    category_id: 'cat-2',
    featured_image: 'samples/typography_banner',
    meta_title: 'Minimalist Typography Layouts & Scales - Outstatic CMS',
    meta_description: 'An expert engineering guide to typography hierarchy, font layout pairs, tracking, leading, and proportional screen structures.',
    canonical_url: 'https://outstatic-demo.com/blog/art-of-minimalist-typography',
    views: 1240
  },
  {
    id: 'post-2',
    title: 'Architecting High-Speed API Response Channels in Next.js',
    slug: 'architecting-high-speed-api-channels',
    content: `<h2>The Golden Rule of App Performance</h2>
    <p>Modern full-stack engines unify server actions and route handlers. When constructing scalable applications, caching strategy and lazy loading dictate response speed. By routing through static edge-workers, content delivery happens closer to the actual reader.</p>
    <h3>Why Edge-Rendered Static JSON is Superior:</h3>
    <p>Client applications shouldn't query high-latency databases synchronously on every initial landing page hit. Instead, the CMS processes content writes and signals the edge handlers to rebuild static content indexes dynamically. This is the Core Outstatic architectural principle:</p>
    <pre><code>// Dynamic static regeneration pattern
export async function GET() {
  const db = readDB();
  return Response.json(db.posts);
}</code></pre>
    <p>By pre-generating JSON, you lower database overhead and guarantee instant content loading.</p>`,
    summary: 'An look at designing edge-optimized static datasets, stale-while-revalidate headers, and secure API pathways.',
    status: 'published',
    published_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    category_id: 'cat-1',
    featured_image: 'samples/code_editor',
    meta_title: 'Architecting High-Speed API Routes in Next.js 15+ - Outstatic CMS',
    meta_description: 'Detailing serverless route optimization, lazy initialization of drivers, stateful connection bounds, and edge caching methodologies.',
    canonical_url: 'https://outstatic-demo.com/blog/architecting-high-speed-api-channels',
    views: 890
  },
  {
    id: 'post-3',
    title: 'Designing Flow-State Focused Developer Environments',
    slug: 'designing-flow-state-focused-developer-environments',
    content: `<p>A high-performance workspace acts as a direct multiplier of technical output. Concentrated cognitive flow is fragile; eliminating minor interface latency and physical environment distractions can double your creative runtime.</p>
    <h2>Constructing the High-Focus Workspace</h2>
    <ul>
      <li><strong>Zero UI Clutter:</strong> Remove secondary utility panels, simulated shells, and flashy telemetry readouts that claim system power and distract attention.</li>
      <li><strong>Single Context Viewports:</strong> Avoid multi-column visual splits unless they hold active documentation relevant to the exact line of code being written.</li>
      <li><strong>Color Balancing:</strong> Switch displays to custom warm profiles matching local solar cycles. Avoid high-contrast cold dark themes in bright rooms.</li>
    </ul>
    <p>We'll outline physical setup designs and light intensity settings specifically optimized for long deep-work windows.</p>`,
    summary: 'Ergonomic screen spacing, eliminating interface friction points, and circadian light matching triggers designed to help engineers enter deep focus.',
    status: 'draft',
    published_at: null,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    category_id: 'cat-3',
    featured_image: 'samples/workspace',
    meta_title: 'Designing Flow-State Developer Workspaces - Outstatic CMS',
    meta_description: 'An analysis of distraction-free computing settings, ergonomics, workspace balance, and cognitive concentration techniques.',
    canonical_url: 'https://outstatic-demo.com/blog/designing-flow-state-focused-developer-environments',
    views: 0
  },
  {
    id: 'post-4',
    title: 'The Blueprint of Outstatic CMS Architecture',
    slug: 'blueprint-of-outstatic-cms-architecture',
    content: `<p>Traditional CMS designs require hefty servers, query parsing engines, complex SQL migrations, and heavy cache invalidation queues. Outstatic takes a revolutionary turn by maintaining static JSON files as the absolute database truth.</p>
    <h2>Why Git-Based & Flat File Databases Reign</h2>
    <p>When database writes write directly to flat files like <code>db.json</code>, several engineering advantages immediately unlock:</p>
    <ul>
      <li><strong>No Database Server Downtime:</strong> The filesystem never has connection pool exhaustions or server cold starts.</li>
      <li><strong>Versioned History:</strong> Content revisions can be backed up as plain Git commits, unlocking absolute rollbacks.</li>
      <li><strong>Lightweight Server Overhead:</strong> Node.js reads the flat JSON synchronously during builds, and feeds instant static files to the client.</li>
    </ul>
    <p>In this guide, we walkthrough building custom flat database structures with automated caching mechanisms.</p>`,
    summary: 'An architectural review on why flat-file JSON and Git-based database engines are faster, cheaper, and safer for static developer sites.',
    status: 'published',
    published_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    category_id: 'cat-4',
    featured_image: 'samples/code_editor',
    meta_title: 'Outstatic CMS Architecture Blueprint',
    meta_description: 'Architecting flat-file database structures, JSON file operations, node filesystem durability, and Git-backed synchronizations.',
    canonical_url: 'https://outstatic-demo.com/blog/blueprint-of-outstatic-cms-architecture',
    views: 650
  },
  {
    id: 'post-5',
    title: 'Cloudinary Image Transformation Pipelines',
    slug: 'cloudinary-image-transformation-pipelines',
    content: `<p>Raw imagery from smartphones and professional cameras easily exceed 10 megabytes. Sending unprocessed files directly over the wire to mobile devices destroys web metrics and causes severe user experience lags. An automated image transformation pipeline is a non-negotiable requirement of high-end web builds.</p>
    <h2>Dynamic Real-Time Scale & Compress</h2>
    <p>Using cloud-hosted visual pipes, we can transform asset formats on the fly based on user agent streams:</p>
    <pre><code>// Dynamic web compression URL structure
const transformUrl = (id) => \`https://res.cloudinary.com/demo/image/upload/q_auto,f_auto,w_800/\${id}\`;</code></pre>
    <p>This dynamic loading strategy handles format shifts (WebP, AVIF) automatically, rendering optimized formats on modern devices to maximize Pagespeed scores.</p>`,
    summary: 'A developer walkthrough on integrating adaptive image pipelines, web compression formats, dynamic width scaling, and responsive srcsets.',
    status: 'scheduled',
    published_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    category_id: 'cat-1',
    featured_image: 'samples/typography_banner',
    meta_title: 'Cloudinary Image Optimization Pipelines for Headless Blogs',
    meta_description: 'Automate image downscaling, AVIF/WebP generation, compress metadata parameters, and responsive image tag source sets.',
    canonical_url: 'https://outstatic-demo.com/blog/cloudinary-image-transformation-pipelines',
    views: 0
  }
];

export const MOCK_POST_TAGS: PostTag[] = [
  { post_id: 'post-1', tag_id: 'tag-6' },
  { post_id: 'post-1', tag_id: 'tag-3' },
  { post_id: 'post-2', tag_id: 'tag-1' },
  { post_id: 'post-2', tag_id: 'tag-2' },
  { post_id: 'post-2', tag_id: 'tag-4' },
  { post_id: 'post-3', tag_id: 'tag-2' },
  { post_id: 'post-4', tag_id: 'tag-1' },
  { post_id: 'post-4', tag_id: 'tag-7' },
  { post_id: 'post-5', tag_id: 'tag-5' }
];

export const MOCK_MEDIA: MediaItem[] = [
  {
    id: 'med-1',
    cloudinary_id: 'samples/typography_banner',
    filename: 'typography-concept.jpg',
    width: 1200,
    height: 675,
    format: 'jpg',
    bytes: 142054,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'med-2',
    cloudinary_id: 'samples/code_editor',
    filename: 'nextjs-setup.png',
    width: 1200,
    height: 675,
    format: 'png',
    bytes: 215440,
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'med-3',
    cloudinary_id: 'samples/workspace',
    filename: 'developer-workspace.jpeg',
    width: 1920,
    height: 1080,
    format: 'jpeg',
    bytes: 345112,
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Revisions mockup to populate history log
export const MOCK_REVISIONS = [
  {
    id: 'rev-1',
    post_id: 'post-1',
    title: 'The Art of Typography on the Web',
    content: '<p>Initial typography thoughts</p>',
    updated_by: 'slipperyslipped@gmail.com',
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'rev-2',
    post_id: 'post-1',
    title: 'The Art of Minimalist Typography in Modern Web Layouts',
    content: '<p>Refined math guidelines for scales</p>',
    updated_by: 'slipperyslipped@gmail.com',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'rev-3',
    post_id: 'post-2',
    title: 'Developing Fast APIs',
    content: '<p>Initial Fast APIs drafts</p>',
    updated_by: 'slipperyslipped@gmail.com',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Static Pages list Mockup
export const MOCK_PAGES = [
  {
    id: 'page-1',
    title: 'About Outstatic Reader',
    slug: 'about',
    status: 'published',
    content: '<h3>About</h3><p>Outstatic is an elegant open source static CMS running entirely inside standard Node and Next ecosystems. Outstatic removes database complex queries.</p>',
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'page-2',
    title: 'Privacy and Telemetry Rules',
    slug: 'privacy',
    status: 'published',
    content: '<h3>Privacy Policy</h3><p>Privacy is human. No telemetry or cookies are logged in the public site.</p>',
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Portfolio Projects list Mockup
export const MOCK_PROJECTS = [
  {
    id: 'proj-1',
    title: 'Unified React Canvas Workspace',
    slug: 'react-canvas-workspace',
    status: 'published',
    summary: 'A fast visual vector compiler built on browser native rendering rules.',
    technology: 'Next.js, Canvas Engine, Tailwind',
    github_url: 'https://github.com/slipperyslipped/react-canvas-workspace',
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'proj-2',
    title: 'Cloudinary Bulk Sync CLI',
    slug: 'cloudinary-sync-cli',
    status: 'published',
    summary: 'Parallelized asset processor compressing and mapping local media libraries asynchronously.',
    technology: 'Node CLI, Cloudinary API, sharp-lib',
    github_url: 'https://github.com/slipperyslipped/cloudinary-sync-cli',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Standard JSON schema seed function
export function getSeedSchema(): Schema {
  return {
    categories: MOCK_CATEGORIES,
    tags: MOCK_TAGS,
    posts: MOCK_POSTS,
    post_tags: MOCK_POST_TAGS,
    media: MOCK_MEDIA,
    revisions: MOCK_REVISIONS
  };
}
