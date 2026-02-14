
import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Search, FileText, Download, Trash2, Lock, Globe, Users } from 'lucide-react';
import { UploadDocumentDialog } from './UploadDocumentDialog';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface DocumentInfo {
    id: string;
    title: string;
    description: string | null;
    category: string;
    file_path: string;
    file_type: string;
    file_size: number;
    access_level: 'admin_only' | 'tree_members' | 'public';
    created_at: string;
    uploader_id: string;
}

const DocumentVault = () => {
    const { t } = useLanguage();
    const { treeId } = useParams<{ treeId: string }>();
    const [documents, setDocuments] = useState<DocumentInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setCurrentUser(data.user));
        fetchDocuments();
    }, [treeId]);

    const fetchDocuments = async () => {
        if (!treeId) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('tree_id', treeId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching documents:', error);
            toast.error(t('Failed to load documents', 'दस्तावेज़ लोड करने में विफल'));
        } else {
            setDocuments(data as DocumentInfo[]);
        }
        setLoading(false);
    };

    const handleDelete = async (docId: string, filePath: string) => {
        if (!confirm(t('Are you sure you want to delete this document?', 'क्या आप वाकई इस दस्तावेज़ को हटाना चाहते हैं?'))) return;

        try {
            // Delete from storage
            const { error: storageError } = await supabase.storage
                .from('documents')
                .remove([filePath]);

            if (storageError) throw storageError;

            // Delete from database
            const { error: dbError } = await supabase
                .from('documents')
                .delete()
                .eq('id', docId);

            if (dbError) throw dbError;

            toast.success(t('Document deleted', 'दस्तावेज़ हटा दिया गया'));
            fetchDocuments();
        } catch (error: any) {
            toast.error(t('Failed to delete', 'हटाने में विफल') + ': ' + error.message);
        }
    };

    const getFileIcon = (type: string) => {
        // You can expand this to return different icons based on mime type
        return <FileText className="w-8 h-8 text-primary/60" />;
    };

    const getAccessIcon = (level: string) => {
        switch (level) {
            case 'admin_only': return <Lock className="w-4 h-4 text-red-500" />;
            case 'public': return <Globe className="w-4 h-4 text-green-500" />;
            default: return <Users className="w-4 h-4 text-blue-500" />;
        }
    };

    const handleDownload = async (filePath: string, title: string) => {
        try {
            const { data, error } = await supabase.storage
                .from('documents')
                .download(filePath);

            if (error) throw error;

            const url = URL.createObjectURL(data);
            const a = document.createElement('a');
            a.href = url;
            a.download = title; // Or get original filename if stored
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error: any) {
            toast.error(t('Download failed', 'डाउनलोड विफल') + ': ' + error.message);
        }
    };


    const filteredDocs = documents.filter(doc =>
        (doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.category.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (categoryFilter === 'All' || doc.category === categoryFilter)
    );

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <div className="flex-1 container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">{t('Document Vault', 'दस्तावेज़ वॉल्ट')}</h1>
                        <p className="text-muted-foreground">{t('Securely store and share family documents', 'पारिवारिक दस्तावेज़ों को सुरक्षित रूप से संग्रहीत और साझा करें')}</p>
                    </div>
                    <Button onClick={() => setUploadOpen(true)} className="gap-2">
                        <Plus className="w-4 h-4" />
                        {t('Upload Document', 'दस्तावेज़ अपलोड करें')}
                    </Button>
                </div>

                <div className="flex gap-4 mb-6">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                            placeholder={t("Search documents...", "दस्तावेज़ खोजें...")}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <div className="w-[180px]">
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('Category', 'श्रेणी')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">{t('All Categories', 'सभी श्रेणियाँ')}</SelectItem>
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
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : filteredDocs.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground mb-4">{t('No documents found', 'कोई दस्तावेज़ नहीं मिला')}</p>
                        <Button variant="outline" onClick={() => setUploadOpen(true)}>{t('Upload your first document', 'अपना पहला दस्तावेज़ अपलोड करें')}</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDocs.map((doc) => (
                            <Card key={doc.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                    <div className="p-2 bg-muted rounded-lg">
                                        {getFileIcon(doc.file_type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-base truncate" title={doc.title}>{doc.title}</CardTitle>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Badge variant="secondary" className="text-[10px]">{doc.category}</Badge>
                                            <span className="flex items-center gap-1" title={doc.access_level}>
                                                {getAccessIcon(doc.access_level)}
                                            </span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground pb-2 h-20 overflow-hidden text-ellipsis">
                                    {doc.description || t('No description', 'कोई विवरण नहीं')}
                                </CardContent>
                                <CardFooter className="pt-2 flex justify-between border-t bg-muted/20">
                                    <div className="text-xs text-muted-foreground">
                                        {new Date(doc.created_at).toLocaleDateString()}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(doc.file_path, doc.title)}>
                                            <Download className="w-4 h-4" />
                                        </Button>
                                        {(currentUser?.id === doc.uploader_id) && (
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(doc.id, doc.file_path)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
            <Footer />

            {treeId && (
                <UploadDocumentDialog
                    isOpen={uploadOpen}
                    onClose={() => setUploadOpen(false)}
                    treeId={treeId}
                    onUploadSuccess={fetchDocuments}
                />
            )}
        </div>
    );
};

export default DocumentVault;
