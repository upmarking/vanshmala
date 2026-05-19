import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { dharmaBlogs } from "@/data/dharmaBlogs";
import { format } from "date-fns";
import { Calendar } from "lucide-react";

const DharmaListing = () => {
    const blogBreadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://vanshmala.in/"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Dharma",
                "item": "https://vanshmala.in/dharma"
            }
        ]
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/50 to-orange-100 flex flex-col relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-saffron/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <SEO
                title="Dharma - Sanatan Wisdom & Knowledge | Vanshmala"
                description="Explore the profound wisdom of Sanatan Dharma, Hinduism, Vedas, and spiritual knowledge curated in easy-to-read Hindi articles."
                schemaData={blogBreadcrumbSchema}
                canonical="https://vanshmala.in/dharma"
            />
            <Navbar />

            <main className="flex-1 container mx-auto pt-32 pb-16 px-4 z-10">
                <header className="mb-16 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold font-display mb-6 text-slate-800 drop-shadow-sm">
                        धर्म और ज्ञान
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto font-body font-medium">
                        सनातन धर्म की गहराइयों, ग्रंथों और जीवन शैली को समझें। 
                        <br className="hidden md:block"/>एक आत्मिक यात्रा हमारे प्राचीन ज्ञान के साथ।
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {dharmaBlogs.map((blog) => (
                        <Link 
                            to={`/dharma/${blog.slug}`} 
                            key={blog.id} 
                            className="group flex flex-col h-full bg-white/40 hover:bg-white/60 backdrop-blur-lg border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-3xl overflow-hidden transition-all duration-300 transform hover:-translate-y-1"
                        >
                            {blog.imageUrl && (
                                <div className="relative aspect-video overflow-hidden p-2">
                                    <div className="w-full h-full rounded-2xl overflow-hidden">
                                        <img
                                            src={blog.imageUrl}
                                            alt={blog.title}
                                            className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="p-6 md:p-8 flex-1 flex flex-col">
                                <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 mb-4 uppercase tracking-wider">
                                    <Calendar size={14} />
                                    {format(new Date(blog.publishedAt), 'dd MMM yyyy')}
                                </div>
                                <h2 className="text-xl md:text-2xl font-bold mb-3 text-slate-800 leading-tight group-hover:text-amber-700 transition-colors">
                                    {blog.title}
                                </h2>
                                <p className="text-slate-600 line-clamp-3 text-base md:text-lg mb-6 flex-1 font-medium">
                                    {blog.excerpt}
                                </p>
                                <div className="mt-auto pt-4 border-t border-slate-200/50">
                                    <span className="text-amber-600 font-semibold group-hover:text-amber-700 flex items-center gap-1 transition-colors">
                                        विस्तार से पढ़ें <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default DharmaListing;
