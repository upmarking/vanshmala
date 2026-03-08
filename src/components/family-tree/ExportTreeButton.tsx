import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { toPng } from 'html-to-image';

interface ExportTreeButtonProps {
  treeName?: string;
}

export const ExportTreeButton = ({ treeName }: ExportTreeButtonProps) => {
  const { t } = useLanguage();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    // Find the tree container element
    const treeContainer = document.querySelector('[data-tree-export]') as HTMLElement;
    if (!treeContainer) {
      toast.error(t('Tree not found for export', 'निर्यात के लिए वंशवृक्ष नहीं मिला'));
      return;
    }

    setExporting(true);
    try {
      const dataUrl = await toPng(treeContainer, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        style: {
          padding: '32px',
        },
      });

      const link = document.createElement('a');
      link.download = `${treeName || 'family-tree'}.png`;
      link.href = dataUrl;
      link.click();

      toast.success(t('Tree exported as image!', 'वंशवृक्ष छवि के रूप में निर्यात किया गया!'));
    } catch (err) {
      console.error('Export failed:', err);
      toast.error(t('Export failed. Please try again.', 'निर्यात विफल रहा। कृपया पुनः प्रयास करें।'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-9 px-3 gap-2 rounded-xl border-border/60 bg-background/50 backdrop-blur-sm"
      onClick={handleExport}
      disabled={exporting}
    >
      <Download className="w-4 h-4 text-orange-600" />
      <span className="hidden sm:inline">
        {exporting ? t('Exporting...', 'निर्यात हो रहा है...') : t('Export', 'निर्यात')}
      </span>
    </Button>
  );
};
