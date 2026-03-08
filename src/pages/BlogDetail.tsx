
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Blog } from "@/types/blog";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";

const BlogDetail = () => {
    const { slug } = useParams<{ slug: string }>();
    const [blog, setBlog] = useState<Blog | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBlog = async () => {
            if (!slug) return;
            try {
                const { data, error } = await (supabase
                    .from('blogs' as any)
                    .select('*')
                    .eq('slug', slug)
                    .eq('is_published', true)
                    .single() as any);

                if (error) throw error;
                setBlog(data as Blog);
            } catch (err) {
                console.error("Error fetching blog:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBlog();
    }, [slug]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (!blog) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Navbar />
                <main className="flex-1 container mx-auto pt-32 text-center">
                    <h1 className="text-3xl font-bold mb-4">Story not found</h1>
                    <p className="text-muted-foreground mb-8">The blog post you're looking for doesn't exist or has been moved.</p>
                    <Button asChild>
                        <Link to="/blog">Back to Blog</Link>
                    </Button>
                </main>
                <Footer />
            </div>
        );
    }

    // Estimate reading time
    const wordsPerMinute = 200;
    const wordCount = blog.content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / wordsPerMinute);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title={blog.meta_title || blog.title}
                description={blog.meta_description || blog.excerpt || ""}
                ogTitle={blog.title}
                ogDescription={blog.excerpt || ""}
                ogImage={blog.featured_image_url || undefined}
                ogType="article"
            />
            <Navbar />

            <main className="flex-1 container max-w-4xl mx-auto pt-24 pb-12 px-4">
                <div className="mb-8">
                    <Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground hover:text-foreground">
                        <Link to="/blog">
                            <ArrowLeft size={16} />
                            Back to Blog
                        </Link>
                    </Button>
                </div>

                <article className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <header className="mb-8">
                        <h1 className="text-4xl md:text-5xl font-bold font-display mb-6 leading-tight">
                            {blog.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground border-y border-border py-4">
                            <div className="flex items-center gap-2">
                                <Calendar size={16} />
                                {format(new Date(blog.published_at || blog.created_at), 'MMMM dd, yyyy')}
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock size={16} />
                                {readingTime} min read
                            </div>
                        </div>
                    </header>

                    {blog.featured_image_url && (
                        <div className="mb-10 rounded-2xl overflow-hidden shadow-xl border border-border">
                            <img
                                src={blog.featured_image_url}
                                alt={blog.title}
                                className="w-full h-auto object-cover max-h-[500px]"
                            />
                        </div>
                    )}

                    <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-display prose-headings:font-bold prose-p:text-muted-foreground prose-p:leading-relaxed">
                        {blog.content.split('\n').map((paragraph, idx) => (
                            paragraph.trim() === '' ? <br key={idx} /> : (
                                paragraph.startsWith('#') ? (
                                    <h2 key={idx} className="text-2xl font-bold mt-8 mb-4">{paragraph.replace(/#/g, '').trim()}</h2>
                                ) : (
                                    <p key={idx} className="mb-4">{paragraph}</p>
                                )
                            )
                        ))}
                    </div>

                    <footer className="mt-16 pt-8 border-t border-border">
                        <div className="bg-muted/30 p-8 rounded-2xl border border-border flex flex-col md:flex-row items-center gap-6 justify-between">
                            <div>
                                <h3 className="text-xl font-bold mb-2">Build your family legacy</h3>
                                <p className="text-muted-foreground mb-4 md:mb-0">Connect with your roots and preserve your family history for future generations.</p>
                            </div>
                            <Button size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20" asChild>
                                <Link to="/register">Join Vanshmala</Link>
                            </Button>
                        </div>
                    </footer>
                </article>
            </main>

            <Footer />
        </div>
    );
};

export default BlogDetail;
