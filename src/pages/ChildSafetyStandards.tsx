import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import SEO from '@/components/SEO';

const ChildSafetyStandards = () => {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title="Child Safety Standards | Our CSAE Policy - Vanshmala"
                description="Learn about Vanshmala's zero-tolerance policy against child sexual abuse and exploitation (CSAE) and our commitment to child safety."
            />
            <Navbar />
            <main className="flex-1 container mx-auto px-4 pt-32 pb-24 max-w-4xl prose prose-neutral dark:prose-invert prose-headings:font-display prose-p:font-body md:pt-40">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                    {t('Child Safety Standards', 'बाल सुरक्षा मानक')}
                </h1>
                <p className="text-muted-foreground text-sm uppercase tracking-wider mb-12">
                    {t(`Last Updated: ${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}`, `अंतिम अद्यतन: ${new Date().toLocaleDateString('hi-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`)}
                </p>

                <p className="lead text-xl text-muted-foreground font-medium">
                    Upmarking Solutions Private Limited ("Company", "we", "us", or "our") is strictly committed to ensuring the safety and well-being of all children globally. We hold a zero-tolerance policy against child sexual abuse and exploitation (CSAE).
                </p>

                <hr className="my-10" />

                <h2 className="text-2xl font-semibold mt-12 mb-6 text-foreground">1. Zero-Tolerance Policy against CSAE</h2>
                <p>
                    Vanshmala explicitly prohibits the dissemination, upload, creation, storage, or distribution of Child Sexual Abuse Material (CSAM) or any content that exploits, endangers, or abuses children.
                    Any user found hosting, promoting, or distributing CSAM or engaging in CSAE on our platform will face immediate, permanent account termination. We reserve the right to report any suspected CSAM or CSAE incidents directly to appropriate law enforcement authorities, including the National Center for Missing & Exploited Children (NCMEC) or relevant local agencies, without prior notice.
                </p>

                <h2 className="text-2xl font-semibold mt-12 mb-6 text-foreground">2. Prohibited Content and Behaviors</h2>
                <p>
                    Our service is intended for documenting family trees and historical lineage. We strictly forbid any of the following:
                </p>
                <ul>
                    <li>Uploading images, videos, or documents depicting sexual abuse or exploitation of children.</li>
                    <li>Using the platform to grooming, solicit, or inappropriately contact minors.</li>
                    <li>Creating family members or modifying records that glorify or promote the abuse of children.</li>
                    <li>Sharing links or coordinating access to CSAM through our chat, feed, or vault systems.</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-12 mb-6 text-foreground">3. Preventative Measures and Moderation</h2>
                <p>
                    While we prioritize user privacy, we actively monitor publicly shared content and reports regarding potential violations of these standards. We employ moderation mechanisms and automated systems where applicable to detect and restrict access to malicious content.
                </p>

                <h2 className="text-2xl font-semibold mt-12 mb-6 text-foreground">4. Reporting Violations</h2>
                <p>
                    We rely on our community to help maintain a safe environment. If you encounter any content or behavior on the Vanshmala application or website that you believe violates our Child Safety Standards or constitutes CSAE, we urge you to report it immediately.
                </p>
                <ul>
                    <li>Do not attempt to investigate the matter yourself.</li>
                    <li>Do not share or forward the suspected material to anyone, including our support team.</li>
                    <li>Instead, note the user Profile ID, URL, timestamp, or any identifiable information to help us locate the source.</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-12 mb-6 text-foreground">5. Contact Information for Safety Concerns</h2>
                <p>
                    To report a child safety concern or a violation of these standards, please contact our dedicated safety and trust team.
                </p>

                <div className="bg-destructive/10 border-l-4 border-destructive p-6 rounded-r-lg mt-4 border-y border-r border-border/50">
                    <p className="m-0 font-medium text-destructive">Upmarking Solutions Safety & Trust Team</p>
                    <p className="m-0 text-sm mt-2">Email for Priority Safety Reports: <strong>safety@vanshmala.in</strong></p>
                    <p className="m-0 text-sm mt-1">General Support: <strong>support@vanshmala.in</strong></p>
                    <p className="m-0 text-sm mt-3 text-muted-foreground italic">Note: If you believe a child is in immediate danger, please contact your local law enforcement agency or emergency services (e.g., 100, 112, or 911) immediately.</p>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default ChildSafetyStandards;
