export interface DharmaBlog {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  publishedAt: string;
  author: string;
  imageUrl?: string;
}

// Eagerly glob import all blogs from the dharma/blogs directory
const modules = import.meta.glob('./dharma/blogs/*.ts', { eager: true });

export const dharmaBlogs: DharmaBlog[] = Object.values(modules)
  .map((mod: any) => mod.default || mod.blog)
  .sort((a, b) => Number(a.id) - Number(b.id));
