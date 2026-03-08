
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Blog } from "@/types/blog";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, User } from "lucide-react";
import { format } from "date-fns";

const BlogListing = () => {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                const { data, error } = await (supabase
                    .from('blogs' as any)
                    .select('*')
                    .eq('is_published', true)
                    .order('published_at', { ascending: false }) as any);

                if (error) throw error;
                setBlogs((data as Blog[]) || []);
            } catch (err) {
                console.error("Error fetching blogs:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBlogs();
    }, []);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title="Vanshmala Blog - Discover Your Heritage"
                description="Explore stories, histories, and guides on family heritage, surnames, and genealogy. Connect with your roots through our expert-curated blogs."
            />
            <Navbar />

            <main className="flex-1 container mx-auto pt-24 pb-12 px-4">
                <header className="mb-12 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold font-display mb-4">Vanshmala Blog</h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Journey through the history of lineages and discover the stories behind our heritage.
                    </p>
                </header>

                {isLoading ? (
                    <div className="flex justify-center py-24">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                ) : blogs.length === 0 ? (
                    <div className="text-center py-24 bg-card rounded-2xl border border-dashed">
                        <h2 className="text-2xl font-semibold mb-2">No stories yet</h2>
                        <p className="text-muted-foreground">Our heritage researchers are currently documenting stories. Check back soon!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {blogs.map((blog) => (
                            <Card key={blog.id} className="flex flex-col h-full hover:shadow-lg transition-shadow duration-300 overflow-hidden group">
                                {blog.featured_image_url && (
                                    <div className="relative aspect-video overflow-hidden">
                                        <img
                                            src={blog.featured_image_url}
                                            alt={blog.title}
                                            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                                        />
                                    </div>
                                )}
                                <CardHeader>
                                    <CardTitle className="line-clamp-2 leading-tight hover:text-primary transition-colors">
                                        <Link to={`/blog/${blog.slug}`}>{blog.title}</Link>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <p className="text-muted-foreground line-clamp-3 text-sm">
                                        {blog.excerpt || blog.content.substring(0, 150).replace(/[#*`]/g, '') + '...'}
                                    </p>
                                </CardContent>
                                <CardFooter className="pt-0 flex items-center justify-between text-xs text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} />
                                        {blog.published_at ? format(new Date(blog.published_at), 'MMM dd, yyyy') : 'Recently'}
                                    </div>
                                    <Button variant="link" size="sm" asChild className="p-0 h-auto">
                                        <Link to={`/blog/${blog.slug}`}>Read More</Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default BlogListing;
