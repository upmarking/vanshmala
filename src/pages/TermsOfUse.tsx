import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const TermsOfUse = () => {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 pt-32 pb-24 max-w-4xl prose prose-neutral dark:prose-invert prose-headings:font-display prose-p:font-body md:pt-40">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Terms of Use</h1>
                <p className="text-muted-foreground text-sm uppercase tracking-wider mb-12">
                    Last Updated: {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>

                <p className="lead text-xl text-muted-foreground font-medium">
                    These Terms of Use ("Terms", "Terms of Use") govern your relationship with the Vanshmala website and Vanshmala mobile application (the "Service") operated by Upmarking Solutions Private Limited ("us", "we", or "our").
                </p>

                <hr className="my-10" />

                <h2 className="text-2xl font-semibold mt-12 mb-6 text-foreground">1. Acceptance of Terms</h2>
                <p>
                    Please read these Terms of Use carefully before using our Service. Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms. These Terms apply to all visitors, users, and others who access or use the Service.
                </p>
                <p>
                    By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.
                </p>

                <h2 className="text-2xl font-semibold mt-12 mb-6 text-foreground">2. Communications</h2>
                <p>
                    By creating an Account on our Service, you agree to subscribe to newsletters, marketing or promotional materials and other information we may send. However, you may opt-out of receiving any, or all, of these communications from us by following the unsubscribe link or instructions provided in any email we send.
                </p>

                <h2 className="text-2xl font-semibold mt-12 mb-6 text-foreground">3. User Accounts</h2>
                <p>
                    When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
                </p>
                <p>
                    You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password, whether your password is with our Service or a third-party service. You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
                </p>

                <h2 className="text-2xl font-semibold mt-12 mb-6 text-foreground">4. Intellectual Property</h2>
                <p>
                    The Service and its original content (excluding Content provided by users), features, and functionality are and will remain the exclusive property of Upmarking Solutions Private Limited and its licensors. The Service is protected by copyright, trademark, and other laws of both India and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Upmarking Solutions Private Limited.
                </p>

                <h2 className="text-2xl font-semibold mt-12 mb-6 text-foreground">5. Your Content and Genealogies</h2>
                <p>
                    Our Service allows you to post, link, store, share, and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post to the Service, including its legality, reliability, and appropriateness.
                </p>
                <p>
                    By posting Content to the Service, you grant us the right and license to use, modify, perform, display, reproduce, and distribute such Content on and through the Service. You retain any and all of your rights to any Content you submit, post or display on or through the Service, and you are responsible for protecting those rights.
                </p>
                <p>
                    You represent and warrant that: (i) the Content is yours (you own it) or you have the right to use it and grant us the rights and license as provided in these Terms, and (ii) the posting of your Content on or through the Service does not violate the privacy rights, publicity rights, copyrights, contract rights or any other rights of any person.
                </p>

                <h2 className="text-2xl font-semibold mt-12 mb-6 text-foreground">6. Prohibited Uses</h2>
                <p>
                    You may use Service only for lawful purposes and in accordance with Terms. You agree not to use Service:
                </p>
                <ul>
                    <li>In any way that violates any applicable national or international law or regulation.</li>
                    <li>For the purpose of exploiting, harming, or attempting to exploit or harm minors in any way by exposing them to inappropriate content or otherwise.</li>
                    <li>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail", "chain letter," "spam," or any other similar solicitation.</li>
                    <li>To impersonate or attempt to impersonate Company, a Company employee, another user, or any other person or entity.</li>
                    <li>In any way that infringes upon the rights of others, or in any way is illegal, threatening, fraudulent, or harmful, or in connection with any unlawful, illegal, fraudulent, or harmful purpose or activity.</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-12 mb-6 text-foreground">7. Links To Other Web Sites</h2>
                <p>
                    Our Service may contain links to third-party web sites or services that are not owned or controlled by Upmarking Solutions Private Limited.
                </p>
                <p>
                    Upmarking Solutions Private Limited has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third party web sites or services. You further acknowledge and agree that Upmarking Solutions Private Limited shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with use of or reliance on any such content, goods, or services available on or through any such web sites or services.
                </p>

                <h2 className="text-2xl font-semibold mt-12 mb-6 text-foreground">8. Termination</h2>
                <p>
                    We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you may simply discontinue using the Service.
                </p>

                <h2 className="text-2xl font-semibold mt-12 mb-6 text-foreground">9. Limitation Of Liability</h2>
                <p>
                    In no event shall Upmarking Solutions Private Limited, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use, or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence), or any other legal theory, whether or not we have been informed of the possibility of such damage, and even if a remedy set forth herein is found to have failed of its essential purpose.
                </p>

                <h2 className="text-2xl font-semibold mt-12 mb-6 text-foreground">10. Disclaimer</h2>
                <p>
                    Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement, or course of performance.
                </p>

                <h2 className="text-2xl font-semibold mt-12 mb-6 text-foreground">11. Governing Law</h2>
                <p>
                    These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
                </p>

                <h2 className="text-2xl font-semibold mt-12 mb-6 text-foreground">12. Changes To Terms</h2>
                <p>
                    We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
                </p>

                <h2 className="text-2xl font-semibold mt-12 mb-6 text-foreground">13. Contact Us</h2>
                <p>
                    If you have any questions about these Terms, you can contact us securely at:
                </p>
                <div className="bg-muted p-6 rounded-lg mt-4 border border-border/50">
                    <p className="m-0 font-medium">Upmarking Solutions Private Limited</p>
                    <p className="m-0 text-sm text-muted-foreground mt-1">Email: <strong>support@vanshmala.in</strong></p>
                    <p className="m-0 text-sm text-muted-foreground">Website: <strong>www.vanshmala.in</strong></p>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default TermsOfUse;
