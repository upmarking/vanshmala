
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Upload } from 'lucide-react';

interface UploadDocumentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    treeId: string;
    onUploadSuccess?: () => void;
}

export const UploadDocumentDialog = ({ isOpen, onClose, treeId, onUploadSuccess }: UploadDocumentDialogProps) => {
    const { t } = useLanguage();
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<string>('General');
    const [accessLevel, setAccessLevel] = useState<string>('tree_members');
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            // Auto-fill title with filename if empty
            if (!title) {
                setTitle(e.target.files[0].name.split('.')[0]);
            }
        }
    };

    const handleUpload = async () => {
        if (!file || !title || !treeId) {
            toast.error(t("Please fill in all required fields", "कृपया सभी आवश्यक फ़ील्ड भरें"));
            return;
        }

        setIsUploading(true);
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error("User not found");

            // 1. Upload file to Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${treeId}/${crypto.randomUUID()}.${fileExt}`;
            const { error: uploadError, data: uploadData } = await supabase.storage
                .from('documents')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // 2. Insert metadata into Database
            const { error: dbError } = await supabase
                .from('documents')
                .insert({
                    tree_id: treeId,
                    uploader_id: user.id,
                    title,
                    description,
                    category,
                    file_path: fileName,
                    file_type: file.type,
                    file_size: file.size,
                    access_level: accessLevel,
                });

            if (dbError) throw dbError;

            toast.success(t("Document uploaded successfully", "दस्तावेज़ सफलतापूर्वक अपलोड किया गया"));
            onUploadSuccess?.();
            handleClose();
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error(t("Failed to upload document", "दस्तावेज़ अपलोड करने में विफल") + ": " + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setTitle('');
        setDescription('');
        setCategory('General');
        setAccessLevel('tree_members');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{t('Upload Document', 'दस्तावेज़ अपलोड करें')}</DialogTitle>
                    <DialogDescription>
                        {t('Upload important family documents to the secure vault.', 'महत्वपूर्ण पारिवारिक दस्तावेज़ सुरक्षित वॉल्ट में अपलोड करें।')}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="file">{t('File', 'फ़ाइल')}</Label>
                        <Input id="file" type="file" onChange={handleFileChange} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="title">{t('Title', 'शीर्षक')}</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={t("e.g., Birth Certificate", "उदाहरण: जन्म प्रमाण पत्र")}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="category">{t('Category', 'श्रेणी')}</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="General">{t('General', 'सामान्य')}</SelectItem>
                                <SelectItem value="Birth Certificate">{t('Birth Certificate', 'जन्म प्रमाण पत्र')}</SelectItem>
                                <SelectItem value="Wedding Invitation">{t('Wedding Invitation', 'शादी का निमंत्रण')}</SelectItem>
                                <SelectItem value="Property Paper">{t('Property Paper', 'संपत्ति के कागजात')}</SelectItem>
                                <SelectItem value="Genealogy Record">{t('Genealogy Record', 'वंशावली रिकॉर्ड')}</SelectItem>
                                <SelectItem value="Historical">{t('Historical', 'ऐतिहासिक')}</SelectItem>
                                <SelectItem value="Other">{t('Other', 'अन्य')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">{t('Description', 'विवरण')}</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t("Optional details...", "वैकल्पिक विवरण...")}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="access">{t('Access Level', 'पहुँच स्तर')}</Label>
                        <Select value={accessLevel} onValueChange={setAccessLevel}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="tree_members">{t('All Tree Members', 'सभी वंशवृक्ष सदस्य')}</SelectItem>
                                <SelectItem value="admin_only">{t('Admins Only', 'केवल व्यवस्थापक')}</SelectItem>
                                <SelectItem value="public">{t('Public (Anyone with link)', 'सार्वजनिक (लिंक वाला कोई भी)')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>{t('Cancel', 'रद्द करें')}</Button>
                    <Button onClick={handleUpload} disabled={isUploading || !file || !title}>
                        {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        {t('Upload', 'अपलोड करें')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
