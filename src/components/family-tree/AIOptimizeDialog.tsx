import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Loader2, AlertTriangle, Info, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AIOptimizeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  treeId: string;
}

interface Suggestion {
  type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  affected_members: string[];
  recommended_action: string;
}

interface Analysis {
  suggestions: Suggestion[];
  health_score: number;
  summary: string;
}

export const AIOptimizeDialog = ({ isOpen, onClose, treeId }: AIOptimizeDialogProps) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  const runOptimization = async () => {
    setLoading(true);
    setAnalysis(null);

    const { data, error } = await supabase.functions.invoke('ai-tree-optimize', {
      body: { action: 'optimize', tree_id: treeId },
    });

    if (error || !data?.success) {
      toast.error(data?.error || t('AI optimization failed', 'AI अनुकूलन विफल'));
      setLoading(false);
      return;
    }

    setAnalysis(data.analysis);
    setLoading(false);
  };

  const severityIcon = (s: string) => {
    if (s === 'critical') return <AlertCircle className="w-4 h-4 text-destructive" />;
    if (s === 'warning') return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <Info className="w-4 h-4 text-blue-500" />;
  };

  const severityBadge = (s: string) => {
    if (s === 'critical') return <Badge variant="destructive" className="text-[10px]">Critical</Badge>;
    if (s === 'warning') return <Badge className="bg-yellow-100 text-yellow-800 text-[10px]">Warning</Badge>;
    return <Badge variant="secondary" className="text-[10px]">Info</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {t('AI Tree Optimization', 'AI वंशवृक्ष अनुकूलन')}
          </DialogTitle>
          <DialogDescription>
            {t('AI will analyze your family tree structure and suggest improvements.', 'AI आपके वंशवृक्ष की संरचना का विश्लेषण करेगा और सुधार सुझाएगा।')}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {!analysis && !loading && (
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 text-primary/30 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {t('Click below to let AI analyze your tree structure.', 'AI को अपने वंशवृक्ष का विश्लेषण करने के लिए नीचे क्लिक करें।')}
              </p>
              <Button onClick={runOptimization} className="bg-primary text-primary-foreground gap-2">
                <Sparkles className="w-4 h-4" />
                {t('Optimize Tree', 'वंशवृक्ष अनुकूलित करें')}
              </Button>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
              <p className="text-lg font-semibold text-foreground">
                {t('AI is optimizing your Tree...', 'AI आपके वंशवृक्ष को अनुकूलित कर रहा है...')}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {t('Analyzing members, relationships, and hierarchy', 'सदस्यों, रिश्तों और पदानुक्रम का विश्लेषण')}
              </p>
            </div>
          )}

          {analysis && (
            <div className="space-y-4">
              {/* Health Score */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('Tree Health Score', 'वंशवृक्ष स्वास्थ्य स्कोर')}</p>
                  <p className="text-sm text-muted-foreground mt-1">{analysis.summary}</p>
                </div>
                <div className={`text-3xl font-bold ${
                  analysis.health_score >= 80 ? 'text-green-600' :
                  analysis.health_score >= 50 ? 'text-yellow-600' : 'text-destructive'
                }`}>
                  {analysis.health_score}
                  <span className="text-sm text-muted-foreground">/100</span>
                </div>
              </div>

              {/* Suggestions */}
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {analysis.suggestions && analysis.suggestions.length > 0 ? (
                    analysis.suggestions.map((s, i) => (
                      <div key={i} className="p-3 rounded-lg border border-border bg-card">
                        <div className="flex items-start gap-2">
                          {severityIcon(s.severity)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm text-foreground">{s.title}</span>
                              {severityBadge(s.severity)}
                            </div>
                            <p className="text-xs text-muted-foreground">{s.description}</p>
                            <p className="text-xs text-primary mt-1 font-medium">
                              ✨ {s.recommended_action}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-2" />
                      <p className="text-foreground font-medium">{t('Your tree looks great!', 'आपका वंशवृक्ष बहुत अच्छा दिखता है!')}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <Button variant="outline" onClick={runOptimization} className="w-full gap-2">
                <Sparkles className="w-4 h-4" />
                {t('Re-analyze', 'पुनः विश्लेषण')}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
