import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { FileUp, Info, CheckCircle2, Loader2, PlaySquare, LogIn } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";

export default function OfferPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [consentGiven, setConsentGiven] = useState(false);

    // Check if user already submitted the offer
    const { data: hasSubmitted, isLoading: isChecking } = useQuery({
        queryKey: ['offer-submission', user?.id],
        queryFn: async () => {
            if (!user) return false;
            const { data, error } = await supabase
                .from('app_review_offers')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') throw error;
            return !!data;
        },
        enabled: !!user,
    });

    const uploadScreenshot = async (file: File) => {
        if (!user) throw new Error("User not authenticated");
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError, data } = await supabase.storage
            .from('app_reviews')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('app_reviews')
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const submitOffer = useMutation({
        mutationFn: async () => {
            if (!file) throw new Error("Please upload a screenshot first.");
            if (!consentGiven) throw new Error("You must consent to provide the review.");
            if (!user) throw new Error("User not authenticated");

            setIsUploading(true);
            try {
                const screenshotUrl = await uploadScreenshot(file);

                const { error } = await supabase
                    .from('app_review_offers')
                    .insert({
                        user_id: user.id,
                        screenshot_url: screenshotUrl,
                        consent_given: consentGiven
                    });

                if (error) throw error;

            } finally {
                setIsUploading(false);
            }
        },
        onSuccess: () => {
            toast.success("Offer successfully claimed! ₹500 has been credited to your wallet.", {
                icon: <CheckCircle2 className="h-5 w-5 text-green-500" />
            });
            queryClient.invalidateQueries({ queryKey: ['offer-submission', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
            setTimeout(() => navigate('/wallet'), 2000);
        },
        onError: (error: Error) => {
            toast.error(`Failed to submit: ${error.message}`);
            // Clean up UI state if needed
        }
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (!selectedFile.type.startsWith('image/')) {
                toast.error("Please upload a valid image file.");
                return;
            }
            if (selectedFile.size > 5 * 1024 * 1024) {
                toast.error("File size cannot exceed 5MB.");
                return;
            }
            setFile(selectedFile);
        }
    };

    if (!user) {
        return (
            <div className="container max-w-2xl mx-auto py-8 px-4">
                <Card className="border-primary/20 shadow-lg text-center py-12">
                    <CardHeader>
                        <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                            <LogIn className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-primary">Login Required</CardTitle>
                        <CardDescription className="text-lg">
                            Please login to access this special offer and claim your ₹500.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-center pt-8">
                        <Button
                            size="lg"
                            className="gap-2 px-8"
                            onClick={() => navigate('/login', { state: { from: '/offer-page' } })}
                        >
                            <LogIn className="h-5 w-5" />
                            Login to Continue
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    if (isChecking) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container max-w-2xl mx-auto py-8 px-4">
            <SEO
                title="Special Offer | Claim your ₹500 Reward - Vanshmala"
                description="Participate in our special offer! Rate our app and claim ₹500 in your Vanshmala wallet."
            />
            <Card className="border-primary/20 shadow-lg">
                <CardHeader className="bg-primary/5 pb-8">
                    <CardTitle className="text-3xl font-bold text-primary flex items-center gap-2">
                        ✨ Special Offer
                    </CardTitle>
                    <CardDescription className="text-lg">
                        Limited Time Offer - Valid till 30th March 2026
                    </CardDescription>
                </CardHeader>

                <CardContent className="pt-6 space-y-6">
                    {hasSubmitted ? (
                        <Alert className="bg-green-50 border-green-200">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertTitle className="text-green-800">Offer Claimed!</AlertTitle>
                            <AlertDescription className="text-green-700">
                                You have already participated in this offer. ₹500 has been credited to your wallet.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <>
                            <Alert className="bg-blue-50 border-blue-200">
                                <Info className="h-4 w-4 text-blue-600" />
                                <AlertTitle className="text-blue-800 font-semibold">How to get free ₹500?</AlertTitle>
                                <AlertDescription className="text-blue-800 mt-2 space-y-2">
                                    <p>1. Give a 5-star rating to our Vanshmala app on the Google Play Store.</p>
                                    <p>2. Write Your Review and end with <strong>"Jai Shree Ram"</strong> in the review.</p>
                                    <p>3. Take a screenshot of your review and upload it below.</p>
                                </AlertDescription>
                            </Alert>

                            <div className="flex justify-center py-2">
                                <Button
                                    asChild
                                    variant="outline"
                                    className="w-full sm:w-auto h-12 gap-2 text-primary border-primary hover:bg-primary hover:text-white transition-colors"
                                >
                                    <a href="https://play.google.com/store/apps/details?id=vanshmala.in" target="_blank" rel="noopener noreferrer">
                                        <PlaySquare />
                                        Open Play Store to Review
                                    </a>
                                </Button>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <div className="space-y-2">
                                    <Label htmlFor="screenshot" className="text-base font-semibold">
                                        Upload Screenshot
                                    </Label>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Please upload the screenshot of your review to claim ₹500.
                                    </p>

                                    <div className="flex items-center gap-4">
                                        <Label
                                            htmlFor="screenshot"
                                            className="cursor-pointer flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 transition-colors"
                                        >
                                            <FileUp className="h-5 w-5" />
                                            {file ? "Change Screenshot" : "Choose File"}
                                        </Label>
                                        <input
                                            id="screenshot"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                        <span className="text-sm border py-2 px-3 rounded text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px] bg-muted/30">
                                            {file ? file.name : "No file chosen"}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3 pt-4 border-t">
                                    <Checkbox
                                        id="consent"
                                        checked={consentGiven}
                                        onCheckedChange={(checked) => setConsentGiven(checked as boolean)}
                                        className="mt-1"
                                    />
                                    <Label
                                        htmlFor="consent"
                                        className="text-sm font-medium leading-none cursor-pointer"
                                    >
                                        I consent that I have provided the review as requested. I acknowledge that this offer is available only one time per user.
                                    </Label>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>

                {!hasSubmitted && (
                    <CardFooter className="bg-muted/10 pt-6">
                        <Button
                            className="w-full h-12 text-lg"
                            onClick={() => submitOffer.mutate()}
                            disabled={submitOffer.isPending || isUploading || !file || !consentGiven}
                        >
                            {submitOffer.isPending || isUploading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Uploading & Claiming...
                                </>
                            ) : (
                                "Claim ₹500 Now"
                            )}
                        </Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
