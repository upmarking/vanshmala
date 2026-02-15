import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMemberByUserId, useUpdateMember } from '@/hooks/useFamilyTree';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, Save, Globe, Lock, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const ProfileSettings = () => {
    const { user } = useAuth();
    const { t } = useLanguage();

    // Fetch member connected to this user
    const { data: member, isLoading, refetch } = useMemberByUserId(user?.id);
    const { mutate: updateMember, isPending } = useUpdateMember();

    // Form States
    const [formData, setFormData] = useState<any>({});
    const [privacySettings, setPrivacySettings] = useState<any>({});

    useEffect(() => {
        if (member) {
            setFormData({
                username: member.username || '',
                full_name: member.full_name || '',
                full_name_hi: member.full_name_hi || '',
                bio: member.bio || '',
                place_of_birth: member.place_of_birth || '',
                blood_group: member.blood_group || '',
                marriage_date: member.marriage_date || '',
                // Ensure arrays
                education: Array.isArray(member.education) ? member.education : [],
                career: Array.isArray(member.career) ? member.career : [],
            });
            setPrivacySettings((member.privacy_settings as any) || {});
        }
    }, [member]);

    const handleBasicChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handlePrivacyChange = (field: string, value: string) => {
        setPrivacySettings((prev: any) => ({ ...prev, [field]: value }));
    };

    // Helper for Privacy Selector
    const PrivacySelector = ({ field }: { field: string }) => (
        <Select
            value={privacySettings[field] || 'public'}
            onValueChange={(val) => handlePrivacyChange(field, val)}
        >
            <SelectTrigger className="w-[110px] h-8 text-xs">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="public"><div className="flex items-center gap-2"><Globe className="w-3 h-3" /> Public</div></SelectItem>
                <SelectItem value="family"><div className="flex items-center gap-2"><Users className="w-3 h-3" /> Family</div></SelectItem>
                <SelectItem value="private"><div className="flex items-center gap-2"><Lock className="w-3 h-3" /> Private</div></SelectItem>
            </SelectContent>
        </Select>
    );

    // Dynamic Lists helpers
    const addEducation = () => {
        setFormData((prev: any) => ({
            ...prev,
            education: [...prev.education, { school: '', degree: '', start_year: '', end_year: '' }]
        }));
    };

    const updateEducation = (index: number, field: string, value: string) => {
        const newEdu = [...formData.education];
        newEdu[index] = { ...newEdu[index], [field]: value };
        setFormData((prev: any) => ({ ...prev, education: newEdu }));
    };

    const removeEducation = (index: number) => {
        setFormData((prev: any) => ({
            ...prev,
            education: prev.education.filter((_: any, i: number) => i !== index)
        }));
    };

    const addCareer = () => {
        setFormData((prev: any) => ({
            ...prev,
            career: [...prev.career, { company: '', role: '', start_date: '', end_date: '' }]
        }));
    };

    const updateCareer = (index: number, field: string, value: string) => {
        const newCareer = [...formData.career];
        newCareer[index] = { ...newCareer[index], [field]: value };
        setFormData((prev: any) => ({ ...prev, career: newCareer }));
    };

    const removeCareer = (index: number) => {
        setFormData((prev: any) => ({
            ...prev,
            career: prev.career.filter((_: any, i: number) => i !== index)
        }));
    };

    const handleSave = () => {
        if (!member) return;

        // Basic validation
        if (!formData.full_name.trim()) {
            toast.error(t("Name is required", "नाम आवश्यक है"));
            return;
        }

        // Prepare updates
        const updates = {
            ...formData,
            privacy_settings: privacySettings,
            // Handle date fields
            marriage_date: formData.marriage_date || null,
            // Don't send undefined
            username: formData.username || null,
        };

        updateMember({
            memberId: member.id,
            updates
        }, {
            onSuccess: () => {
                toast.success(t("Profile updated successfully", "प्रोफ़ाइल सफलतापूर्वक अपडेट की गई"));
                refetch();
            },
            onError: (err) => {
                toast.error(t("Failed to update: " + err.message, "अपडेट करने में विफल: " + err.message));
            }
        });
    };

    if (isLoading) {
        return (
            <div className="container max-w-4xl mx-auto py-8 px-4">
                <Skeleton className="w-full h-12 mb-8" />
                <Skeleton className="w-full h-96" />
            </div>
        );
    }

    if (!member) {
        return (
            <div className="container max-w-4xl mx-auto py-8 px-4 text-center">
                <h2 className="text-xl font-display font-bold mb-4">{t('No Linked Profile', 'कोई लिंक किया गया प्रोफ़ाइल नहीं')}</h2>
                <p className="text-muted-foreground mb-4">
                    {t(
                        "Your user account is not linked to any family member profile yet. Please ask your family admin to invite you or link your profile.",
                        "आपका उपयोगकर्ता खाता अभी तक किसी भी परिवार के सदस्य प्रोफ़ाइल से लिंक नहीं है। कृपया अपने परिवार के व्यवस्थापक से आपको आमंत्रित करने या अपनी प्रोफ़ाइल लिंक करने के लिए कहें।"
                    )}
                </p>
            </div>
        );
    }

    return (
        <div className="container max-w-4xl mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-display font-bold">{t('Edit Profile', 'प्रोफ़ाइल संपादित करें')}</h1>
                <Button onClick={handleSave} disabled={isPending} className="gap-2 bg-gradient-saffron text-white shadow-saffron">
                    <Save className="w-4 h-4" />
                    {isPending ? t('Saving...', 'सहेज रहा है...') : t('Save Changes', 'परिवर्तन सहेजें')}
                </Button>
            </div>

            <Tabs defaultValue="basic" className="w-full space-y-6">
                <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1">
                    <TabsTrigger value="basic">{t('Basic Info', 'मूल जानकारी')}</TabsTrigger>
                    <TabsTrigger value="education">{t('Education', 'शिक्षा')}</TabsTrigger>
                    <TabsTrigger value="career">{t('Work', 'कार्य')}</TabsTrigger>
                    <TabsTrigger value="privacy">{t('Privacy', 'गोपनीयता')}</TabsTrigger>
                </TabsList>

                {/* BASIC INFO */}
                <TabsContent value="basic">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('Personal Information', 'व्यक्तिगत जानकारी')}</CardTitle>
                            <CardDescription>{t('Update your basic information seen by others.', 'दूसरों द्वारा देखी जाने वाली अपनी मूल जानकारी अपडेट करें।')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label>{t('Username', 'उपयोगकर्ता नाम')}</Label>
                                        <span className="text-xs text-muted-foreground">vanshmala.com/{formData.username || 'username'}</span>
                                    </div>
                                    <Input
                                        value={formData.username}
                                        onChange={(e) => handleBasicChange('username', e.target.value)}
                                        placeholder="username"
                                    />
                                    <p className="text-[10px] text-muted-foreground">Unique identifier for your public profile.</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label>{t('Full Name', 'पूरा नाम')}</Label>
                                        <PrivacySelector field="name" />
                                    </div>
                                    <Input
                                        value={formData.full_name}
                                        onChange={(e) => handleBasicChange('full_name', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('Full Name (Hindi)', 'पूरा नाम (हिंदी)')}</Label>
                                    <Input
                                        value={formData.full_name_hi}
                                        onChange={(e) => handleBasicChange('full_name_hi', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label>{t('Bio', 'जीवनी')}</Label>
                                        <PrivacySelector field="bio" />
                                    </div>
                                    <Textarea
                                        value={formData.bio}
                                        onChange={(e) => handleBasicChange('bio', e.target.value)}
                                        className="h-24"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label>{t('Place of Birth', 'जन्म स्थान')}</Label>
                                        <PrivacySelector field="place_of_birth" />
                                    </div>
                                    <Input
                                        value={formData.place_of_birth}
                                        onChange={(e) => handleBasicChange('place_of_birth', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label>{t('Blood Group', 'रक्त समूह')}</Label>
                                        <PrivacySelector field="blood_group" />
                                    </div>
                                    <Input
                                        value={formData.blood_group}
                                        onChange={(e) => handleBasicChange('blood_group', e.target.value)}
                                        placeholder="O+"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label>{t('Marriage Date', 'विवाह की तारीख')}</Label>
                                        <PrivacySelector field="marriage_date" />
                                    </div>
                                    <Input
                                        type="date"
                                        value={formData.marriage_date}
                                        onChange={(e) => handleBasicChange('marriage_date', e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* EDUCATION */}
                <TabsContent value="education">
                    <Card>
                        <CardHeader className="flex flex-row justify-between items-center">
                            <div>
                                <CardTitle>{t('Education', 'शिक्षा')}</CardTitle>
                                <CardDescription>{t('Add your educational background.', 'अपनी शैक्षणिक पृष्ठभूमि जोड़ें।')}</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Label className="text-sm">{t('Privacy', 'गोपनीयता')}:</Label>
                                <PrivacySelector field="education" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {formData.education?.map((edu: any, index: number) => (
                                <div key={index} className="flex gap-4 items-start p-4 border rounded-xl bg-muted/20 relative group">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-2 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => removeEducation(index)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full pr-8">
                                        <div className="space-y-1">
                                            <Label>{t('Institution/School', 'संस्थान/स्कूल')}</Label>
                                            <Input
                                                value={edu.school}
                                                onChange={(e) => updateEducation(index, 'school', e.target.value)}
                                                placeholder="School Name"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>{t('Degree/Class', 'डिग्री/कक्षा')}</Label>
                                            <Input
                                                value={edu.degree}
                                                onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                                                placeholder="B.Tech / 10th"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>{t('Start Year', 'आरंभ वर्ष')}</Label>
                                            <Input
                                                value={edu.start_year}
                                                onChange={(e) => updateEducation(index, 'start_year', e.target.value)}
                                                placeholder="2015"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>{t('End Year', 'अंत वर्ष')}</Label>
                                            <Input
                                                value={edu.end_year}
                                                onChange={(e) => updateEducation(index, 'end_year', e.target.value)}
                                                placeholder="2019"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <Button variant="outline" className="w-full border-dashed" onClick={addEducation}>
                                <Plus className="w-4 h-4 mr-2" /> {t('Add Education', 'शिक्षा जोड़ें')}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* CAREER */}
                <TabsContent value="career">
                    <Card>
                        <CardHeader className="flex flex-row justify-between items-center">
                            <div>
                                <CardTitle>{t('Work Experience', 'कार्य अनुभव')}</CardTitle>
                                <CardDescription>{t('Add your professional journey.', 'अपनी पेशेवर यात्रा जोड़ें।')}</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Label className="text-sm">{t('Privacy', 'गोपनीयता')}:</Label>
                                <PrivacySelector field="career" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {formData.career?.map((job: any, index: number) => (
                                <div key={index} className="flex gap-4 items-start p-4 border rounded-xl bg-muted/20 relative group">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-2 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => removeCareer(index)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full pr-8">
                                        <div className="space-y-1">
                                            <Label>{t('Company/Organization', 'कंपनी/संगठन')}</Label>
                                            <Input
                                                value={job.company}
                                                onChange={(e) => updateCareer(index, 'company', e.target.value)}
                                                placeholder="Company Name"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>{t('Role/Title', 'भूमिका/पद')}</Label>
                                            <Input
                                                value={job.role}
                                                onChange={(e) => updateCareer(index, 'role', e.target.value)}
                                                placeholder="Product Manager"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>{t('Start Date', 'आरंभ तिथि')}</Label>
                                            <Input
                                                value={job.start_date}
                                                onChange={(e) => updateCareer(index, 'start_date', e.target.value)}
                                                placeholder="Jan 2020"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>{t('End Date', 'अंतिम तिथि')}</Label>
                                            <Input
                                                value={job.end_date}
                                                onChange={(e) => updateCareer(index, 'end_date', e.target.value)}
                                                placeholder="Present"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <Button variant="outline" className="w-full border-dashed" onClick={addCareer}>
                                <Plus className="w-4 h-4 mr-2" /> {t('Add Experience', 'अनुभव जोड़ें')}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* PRIVACY SUMMARY / ADVANCED */}
                <TabsContent value="privacy">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('Privacy Settings', 'गोपनीयता सेटिंग्स')}</CardTitle>
                            <CardDescription>{t('Manage who can see your profile information.', 'प्रबंधित करें कि आपकी प्रोफ़ाइल जानकारी कौन देख सकता है।')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
                                <Globe className="w-4 h-4 inline mr-2" /> <strong>Public</strong>: Visible to anyone with the link.<br />
                                <Users className="w-4 h-4 inline mr-2" /> <strong>Family</strong>: Visible to connected family members.<br />
                                <Lock className="w-4 h-4 inline mr-2" /> <strong>Private</strong>: Visible only to you.
                            </div>
                            <div className="space-y-4">
                                {['name', 'bio', 'place_of_birth', 'blood_group', 'marriage_date', 'education', 'career'].map(field => (
                                    <div key={field} className="flex justify-between items-center p-2 border-b last:border-0">
                                        <Label className="capitalize">{field.replace(/_/g, ' ')}</Label>
                                        <PrivacySelector field={field} />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ProfileSettings;
