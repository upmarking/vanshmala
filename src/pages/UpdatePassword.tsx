import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const UpdatePassword = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [session, setSession] = useState<boolean | null>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                navigate("/login");
            } else {
                setSession(true);
            }
        });
    }, [navigate]);

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.auth.updateUser({
            password: password,
        });

        if (error) {
            toast.error(error.message);
        } else {
            toast.success(t("Password updated successfully!", "पासवर्ड सफलतापूर्वक अपडेट किया गया!"));
            navigate("/dashboard");
        }
        setLoading(false);
    };

    if (session === null) return null;

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            <Navbar />
            <div className="absolute top-32 right-10 w-64 h-64 rounded-full bg-saffron/5 blur-3xl" />
            <div className="absolute bottom-20 left-10 w-80 h-80 rounded-full bg-gold/4 blur-3xl" />

            <div className="pt-24 pb-16 flex items-center justify-center min-h-screen">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md mx-4"
                >
                    <form
                        onSubmit={handlePasswordUpdate}
                        className="p-8 rounded-2xl bg-card border border-border shadow-elevated relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-saffron" />

                        <div className="text-center mb-8">
                            <span className="text-saffron/40 text-2xl block mb-3">ॐ</span>
                            <h1 className="font-display text-2xl font-bold text-foreground mb-1">
                                {t("Update Password", "पासवर्ड अपडेट करें")}
                            </h1>
                            <p className="font-body text-sm text-muted-foreground">
                                {t("Enter your new password below", "अपना नया पासवर्ड नीचे दर्ज करें")}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block font-body text-sm font-medium text-foreground mb-1.5">
                                    {t("New Password", "नया पासवर्ड")}
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 rounded-xl border border-input bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40 focus:border-saffron/40"
                                    required
                                    minLength={6}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-saffron text-primary-foreground font-medium font-body hover:opacity-90 transition-opacity shadow-saffron disabled:opacity-50"
                            >
                                {loading ? (
                                    <span className="animate-pulse">{t("Updating...", "अपडेट हो रहा है...")}</span>
                                ) : (
                                    <>
                                        <Lock className="w-4 h-4" />
                                        {t("Update Password", "पासवर्ड अपडेट करें")}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default UpdatePassword;
