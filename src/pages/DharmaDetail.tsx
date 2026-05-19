import { useParams, Link, Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { dharmaBlogs } from "@/data/dharmaBlogs";
import { format } from "date-fns";
import { Calendar, User, ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";

const DharmaDetail = () => {
    const { slug } = useParams<{ slug: string }>();
    const blog = dharmaBlogs.find((b) => b.slug === slug);

    if (!blog) {
        return <Navigate to="/dharma" replace />;
    }

    const seoImageUrl = blog.imageUrl?.startsWith("/")
        ? `https://vanshmala.in${blog.imageUrl}`
        : blog.imageUrl;

    const blogSchema = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": blog.title,
        "image": seoImageUrl ? [seoImageUrl] : [],
        "datePublished": blog.publishedAt,
        "dateModified": blog.publishedAt,
        "author": [{
            "@type": "Person",
            "name": blog.author
        }],
        "description": blog.excerpt,
        "articleBody": blog.content
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/50 to-orange-100 flex flex-col relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-amber-400/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-[40%] left-[-10%] w-[30%] h-[40%] bg-saffron/10 rounded-full blur-[100px] pointer-events-none" />

            <SEO
                title={`${blog.title} | Vanshmala`}
                description={blog.excerpt}
                schemaData={blogSchema}
                canonical={`https://vanshmala.in/dharma/${blog.slug}`}
                ogImage={seoImageUrl}
            />
            <Navbar />

            <main className="flex-1 container mx-auto pt-24 pb-16 px-4 z-10">
                <article className="max-w-4xl mx-auto">
                    <div className="mb-8">
                        <Link to="/dharma" className="inline-flex items-center text-amber-600 hover:text-amber-800 font-semibold transition-colors mb-6">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            सभी लेख देखें
                        </Link>
                    </div>

                    <div className="bg-white/60 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[2.5rem] overflow-hidden">
                        {blog.imageUrl && (
                            <div className="relative w-full aspect-[21/9] md:aspect-[2.5/1]">
                                <img
                                    src={blog.imageUrl}
                                    alt={blog.title}
                                    className="object-cover w-full h-full"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 text-white">
                                    <div className="flex flex-wrap items-center gap-4 text-sm md:text-base font-medium text-white/90 mb-4">
                                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full">
                                            <Calendar size={16} />
                                            {format(new Date(blog.publishedAt), 'dd MMM yyyy')}
                                        </div>
                                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full">
                                            <User size={16} />
                                            {blog.author}
                                        </div>
                                    </div>
                                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold font-display leading-tight drop-shadow-md">
                                        {blog.title}
                                    </h1>
                                </div>
                            </div>
                        )}

                        <div className="p-8 md:p-12 lg:p-16">
                            {!blog.imageUrl && (
                                <div className="mb-12">
                                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display leading-tight text-slate-900 mb-6">
                                        {blog.title}
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-4 text-sm md:text-base font-medium text-slate-600">
                                        <div className="flex items-center gap-2 bg-amber-100/50 px-3 py-1.5 rounded-full">
                                            <Calendar size={16} className="text-amber-600" />
                                            {format(new Date(blog.publishedAt), 'dd MMM yyyy')}
                                        </div>
                                        <div className="flex items-center gap-2 bg-amber-100/50 px-3 py-1.5 rounded-full">
                                            <User size={16} className="text-amber-600" />
                                            {blog.author}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="max-w-none">
                                <ReactMarkdown
                                    components={{
                                        h1: ({ node, ...props }) => <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display text-slate-800 mt-14 mb-6 leading-tight" {...props} />,
                                        h2: ({ node, ...props }) => <h2 className="text-2xl md:text-3xl font-bold font-display text-slate-800 mt-12 mb-6 border-b border-amber-200/60 pb-3" {...props} />,
                                        h3: ({ node, ...props }) => <h3 className="text-xl md:text-2xl font-bold font-display text-amber-900 mt-10 mb-4" {...props} />,
                                        p: ({ node, ...props }) => <p className="text-lg md:text-xl text-slate-700 leading-relaxed font-body mb-8" {...props} />,
                                        ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-8 space-y-3 text-lg md:text-xl text-slate-700" {...props} />,
                                        ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-8 space-y-3 text-lg md:text-xl text-slate-700" {...props} />,
                                        li: ({ node, ...props }) => <li className="font-body text-slate-700 leading-relaxed mb-1" {...props} />,
                                        blockquote: ({ node, ...props }) => (
                                            <blockquote className="border-l-4 border-amber-500 pl-4 italic text-slate-600 my-8 bg-amber-50/50 py-3 pr-4 rounded-r-lg" {...props} />
                                        ),
                                        strong: ({ node, ...props }) => <strong className="font-bold text-amber-900" {...props} />,
                                        hr: ({ node, ...props }) => <hr className="my-12 border-t-2 border-amber-200/30" {...props} />,
                                        a: ({ node, ...props }) => <a className="text-amber-600 hover:text-amber-800 font-semibold underline underline-offset-4 decoration-amber-500/30 hover:decoration-amber-500 transition-colors" {...props} />
                                    }}
                                >
                                    {blog.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                </article>
            </main>

            <Footer />
        </div>
    );
};

export default DharmaDetail;
