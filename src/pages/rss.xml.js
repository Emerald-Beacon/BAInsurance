import rss from '@astrojs/rss';
import posts from '../data/posts.json';

export function GET(context) {
  const sorted = [...posts].sort((a, b) => b.date.localeCompare(a.date));
  return rss({
    title: 'B&A Insurance Producers Blog',
    description:
      'Insurance tips, guides, and resources from the licensed agents at B&A Insurance Producers in Bountiful, Utah.',
    site: context.site,
    items: sorted.map((post) => ({
      title: post.title,
      description: post.excerpt,
      pubDate: new Date(`${post.date}T00:00:00Z`),
      link: `/${post.slug}/`,
    })),
    customData: '<language>en-us</language>',
  });
}
