import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title="Privacy Policy | Vanshmala Data Security"
                description="Read our Privacy Policy to understand how Vanshmala collects, uses, and protects your personal and family data."
            />
            <Navbar />
            <main className="flex-1 container mx-auto px-4 pt-32 pb-24 max-w-4xl prose prose-neutral dark:prose-invert prose-headings:font-display prose-p:font-body md:pt-40">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Privacy Policy</h1>
                <p className="text-muted-foreground text-sm uppercase tracking-wider mb-12">
                    Last Updated: {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>

                <p className="lead text-xl text-muted-foreground font-medium">
                    Upmarking Solutions Private Limited ("Company", "we", "us", or "our") is committed to protecting your privacy. This Privacy Policy outlines our practices regarding the collection, use, disclosure, and safeguarding of your personal information when you use the Vanshmala application and website (collectively, the "Service").
                </p>

                <hr className="my-10" />

                <h2 className="text-2xl font-semibold mt-12 mb-6 text-foreground">1. Introduction</h2>
                <p>
                    Welcome to Vanshmala. By accessing or using our Service, you signify that you have read, understood, and agree to our collection, storage, use, and disclosure of your personal information as described in this Privacy Policy. This Policy applies to all visitors, users, and others who access the Service.
                </p>

                <h2 className="text-2xl font-semibold mt-12 mb-6 text-foreground">2. Information We Collect</h2>
                <p>
                    We collect various types of information to provide and improve our Service to you, preserving your family’s legacy with utmost care.
                </p>
                <h3 className="text-xl font-medium mt-6 mb-3 text-foreground">A. Information You Provide to Us Directly</h3>
                <ul>
                    <li><strong>Account Information:</strong> When you register for an account, we may collect your name, email address, phone number, password, and demographic information.</li>
                    <li><strong>Genealogical and Family Data:</strong> The core feature of Vanshmala involves creating a family tree. We collect names, birth dates, death dates, relationships, photos, documents, and historical information about your family members that you voluntarily provide.</li>
                    <li><strong>Communications:</strong> If you contact us directly (e.g., customer support), we may receive additional information such as your name, email address, phone number, the contents of the message, and any attachments you may send us.</li>
                </ul>

                <h3 className="text-xl font-medium mt-6 mb-3 text-foreground">B. Information We Collect Automatically</h3>
                <ul>
                    <li><strong>Log Data and Device Information:</strong> We automatically collect log data and device information when you access and use the Service. This may include your IP address, browser type, operating system, device identifiers, and crash data.</li>
                    <li><strong>Usage Data:</strong> We track user interactions within the app to understand how our features are used, ensuring we continually enhance the user experience.</li>
                    <li><strong>Cookies and Similar Technologies:</strong> We use tracking technologies such as cookies, web beacons, and pixels to collect information about your browsing activities to personalize your experience.</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-12 mb-6 text-foreground">3. How We Use Your Information</h2>
                <p>We use the information we collect for various business purposes, including to:</p>
                <ul>
                    <li><strong>Provide, Maintain, and Improve the Service:</strong> To operate our platform, host your family tree, and ensure the basic functionality of Vanshmala.</li>
                    <li><strong>Personalize User Experience:</strong> To tailor content, suggest potential family matches, and display features most relevant to you.</li>
                    <li><strong>Communicate with You:</strong> To send you technical notices, updates, security alerts, and administrative messages.</li>
                    <li><strong>Customer Support:</strong> To respond to your comments, questions, and provide customer service.</li>
                    <li><strong>Analytics and Research:</strong> To monitor and analyze trends, usage, and activities in connection with our Service.</li>
                    <li><strong>Legal Compliance:</strong> To enforce our Terms of Use and comply with our legal obligations.</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-12 mb-6 text-foreground">4. How We Share Your Information</h2>
                <p>
                    Upmarking Solutions Private Limited does not sell or rent your personal information to third parties. We may share your information only under the following circumstances:
                </p>
                <ul>
                    <li><strong>With Other Users:</strong> Information you choose to make public or share within your family network will be visible to those individuals according to your privacy settings.</li>
                    <li><strong>Service Providers:</strong> We may employ third-party companies and individuals to facilitate our Service, provide the Service on our behalf, perform Service-related services, or assist us in analyzing how our Service is used (e.g., cloud hosting, database management, analytics).</li>
                    <li><strong>Business Transfers:</strong> If we are involved in a merger, acquisition, or sale of all or a portion of our assets, your information may be transferred as part of that transaction.</li>
                    <li><strong>Legal Obligations:</strong> We may disclose your information where required to do so by law or subpoena or if we believe that such action is necessary to comply with the law and the reasonable requests of law enforcement.</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-12 mb-6 text-foreground">5. Data Security</h2>
                <p>
                    We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
                </p>

                <h2 className="text-2xl font-semibold mt-12 mb-6 text-foreground">6. Data Retention</h2>
                <p>
                    We retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your information to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our policies. Genealogical data uploaded by you will be kept for as long as your account is active, as it is the core premise of preserving your family's legacy.
                </p>

                <h2 className="text-2xl font-semibold mt-12 mb-6 text-foreground">7. Your Privacy Rights</h2>
                <p>
                    Depending on your location, you may have certain rights regarding your personal information, such as the right to access, correct, update, or delete your personal data. You can usually manage your personal information directly within your account settings. If you need assistance, you can contact us using the information provided below.
                </p>

                <h3 className="text-xl font-medium mt-6 mb-3 text-foreground">Data Deletion Request</h3>
                <p>
                    You have the right to request the complete deletion of your account and all associated personal data from our systems.
                    If you wish to exercise this right, you can initiate a data deletion request by visiting our dedicated data deletion page.
                    Please note that deleting your account is a permanent action and cannot be undone. All your genealogical data, photos, and connections will be permanently removed.
                </p>
                <div className="mt-4">
                    <Link
                        to="/data-deletion-request"
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 px-4 py-2"
                    >
                        Request Data Deletion
                    </Link>
                </div>

                <h2 className="text-2xl font-semibold mt-12 mb-6 text-foreground">8. Children's Privacy</h2>
                <p>
                    While Vanshmala is meant to document entire family trees, including children, the Service itself is not intended for use by children under the age of 13 unattended. We do not knowingly collect personally identifiable information directly from children under 13 without verifiable parental consent. If we become aware that we have collected Personal Data from a child under 13 without verification of parental consent, we take steps to remove that information from our servers.
                </p>
                <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mt-6">
                    <h3 className="text-lg font-semibold text-foreground m-0 mb-2">Child Safety Standards & CSAE Policy</h3>
                    <p className="m-0 text-sm text-muted-foreground mb-4">
                        We maintain strict zero-tolerance standards against Child Sexual Abuse and Exploitation (CSAE) to protect children globally.
                    </p>
                    <Link
                        to="/child-safety-standards"
                        className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                    >
                        View our complete Child Safety Standards →
                    </Link>
                </div>

                <h2 className="text-2xl font-semibold mt-12 mb-6 text-foreground">9. Changes to This Privacy Policy</h2>
                <p>
                    We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.
                </p>

                <h2 className="text-2xl font-semibold mt-12 mb-6 text-foreground">10. Contact Us</h2>
                <p>
                    If you have any questions about this Privacy Policy, please contact us:
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

export default PrivacyPolicy;
