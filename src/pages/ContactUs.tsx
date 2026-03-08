import { Mail, LifeBuoy, Megaphone, Handshake, MapPin } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import SEO from '@/components/SEO';

const ContactCard = ({
    icon: Icon,
    title,
    titleHi,
    description,
    descriptionHi,
    email,
    delay
}: {
    icon: any,
    title: string,
    titleHi: string,
    description: string,
    descriptionHi: string,
    email: string,
    delay: string
}) => {
    const { t } = useLanguage();

    return (
        <div
            className={`group relative overflow-hidden rounded-2xl bg-card border border-border/50 p-8 shadow-sm transition-all hover:shadow-md animate-fade-in ${delay}`}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-saffron/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

            <div className="relative z-10 flex flex-col items-center text-center">
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-saffron/10 text-saffron ring-1 ring-saffron/20 transition-transform group-hover:scale-110">
                    <Icon className="h-8 w-8" />
                </div>

                <h3 className="mb-3 font-display text-2xl font-semibold text-foreground">
                    {t(title, titleHi)}
                </h3>

                <p className="mb-8 text-muted-foreground font-body">
                    {t(description, descriptionHi)}
                </p>

                <a
                    href={`mailto:${email}`}
                    className="mt-auto inline-flex items-center gap-2 rounded-full bg-secondary px-6 py-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                    <Mail className="h-4 w-4" />
                    {email}
                </a>
            </div>
        </div>
    );
};

const ContactUs = () => {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title="Contact Us | Vanshmala Support & Partnerships"
                description="Get in touch with Vanshmala for support, partnership proposals, or media inquiries. We are here to help you preserve your family legacy."
            />
            <Navbar />

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative overflow-hidden bg-muted/30 pt-24 pb-16 md:pt-32 md:pb-24">
                    <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                    <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-saffron/20 blur-3xl opacity-50" />
                    <div className="absolute top-1/2 -left-24 h-72 w-72 rounded-full bg-saffron/10 blur-3xl opacity-50" />

                    <div className="container relative mx-auto px-4 max-w-5xl text-center">
                        <h1 className="mb-6 font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-foreground animate-fade-in">
                            {t('Get in Touch', 'हमसे संपर्क करें')}
                        </h1>
                        <p className="mx-auto max-w-2xl text-lg text-muted-foreground font-body animate-fade-in delay-100">
                            {t(
                                'Whether you have a question, partnership proposal, or media inquiry, we are here to connect. Choose the most relevant contact method below.',
                                'चाहे आपका कोई प्रश्न हो, साझेदारी प्रस्ताव हो या मीडिया पूछताछ, हम यहाँ हैं। नीचे दिए गए सबसे उपयुक्त संपर्क माध्यम को चुनें।'
                            )}
                        </p>
                    </div>
                </section>

                {/* Contact Cards Section */}
                <section className="py-16 md:py-24 container mx-auto px-4 max-w-6xl">
                    <div className="grid gap-8 md:grid-cols-3">
                        <ContactCard
                            icon={LifeBuoy}
                            title="Support & Help"
                            titleHi="सहायता और समर्थन"
                            description="Having trouble with your family tree or need assistance with your account? Our support team is here to help you preserve your legacy."
                            descriptionHi="अपनी वंशावली के साथ समस्या हो रही है या अपने खाते के लिए सहायता चाहिए? हमारी सहायता टीम आपकी विरासत को संजोने में मदद करने के लिए यहाँ है।"
                            email="support@vanshmala.in"
                            delay="delay-100"
                        />

                        <ContactCard
                            icon={Handshake}
                            title="Partnerships"
                            titleHi="साझेदारी"
                            description="Interested in collaborating with Vanshmala? We are always looking for meaningful partnerships to grow together."
                            descriptionHi="वंशमाला के साथ सहयोग करने में रुचि रखते हैं? हम हमेशा एक साथ बढ़ने के लिए सार्थक साझेदारी की तलाश में रहते हैं।"
                            email="partnership@vanshmala.in"
                            delay="delay-200"
                        />

                        <ContactCard
                            icon={Megaphone}
                            title="Media & Press"
                            titleHi="मीडिया और प्रेस"
                            description="For press inquiries, news features, or media relations, please reach out to our communications team."
                            descriptionHi="प्रेस पूछताछ, समाचार सुविधाओं या मीडिया संबंधों के लिए, कृपया हमारी संचार टीम से संपर्क करें।"
                            email="media@vanshmala.in"
                            delay="delay-300"
                        />
                    </div>

                    {/* Corporate Office Info */}
                    <div className="mt-20 overflow-hidden rounded-3xl bg-muted/50 border border-border/50 animate-fade-in delay-500">
                        <div className="grid md:grid-cols-2">
                            <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center">
                                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-saffron/10 text-saffron">
                                    <MapPin className="h-6 w-6" />
                                </div>
                                <h3 className="mb-4 font-display text-2xl font-bold">
                                    {t('Corporate Headquarters', 'कॉर्पोरेट मुख्यालय')}
                                </h3>
                                <h4 className="font-display text-lg font-semibold mb-2">
                                    Upmarking Solutions Private Limited
                                </h4>
                                <p className="text-muted-foreground leading-relaxed">
                                    {t(
                                        'Building tools to preserve Indian family heritage and connect generations across time.',
                                        'भारतीय पारिवारिक विरासत को संरक्षित करने और पीढ़ियों को जोड़ने के लिए समाधान बनाना।'
                                    )}
                                </p>
                            </div>
                            <div className="bg-card min-h-[300px] relative border-l border-border/50 flex items-center justify-center p-8">
                                <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                                <div className="text-center relative z-10 w-full max-w-sm">
                                    <div className="w-full aspect-video rounded-2xl bg-muted/80 flex items-center justify-center overflow-hidden border border-border/50 shadow-inner">
                                        <span className="text-6xl opacity-20 text-saffron">ॐ</span>
                                    </div>
                                    <p className="mt-6 font-display font-medium text-muted-foreground uppercase tracking-widest text-sm">
                                        {t('Connecting Roots', 'जड़ों को जोड़ना')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default ContactUs;
