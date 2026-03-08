import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, ScanLine } from 'lucide-react';
import { toast } from 'sonner';

interface ScanQRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanResult: (vanshmalaId: string, name: string) => void;
}

const ScanQRDialog = ({ open, onOpenChange, onScanResult }: ScanQRDialogProps) => {
  const { t } = useLanguage();
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-scanner-container';

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        // Only stop if scanning (state 2 = SCANNING)
        if (state === 2) {
          await scannerRef.current.stop();
        }
      } catch {
        // ignore
      }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    setCameraError(null);
    try {
      const scanner = new Html5Qrcode(scannerContainerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          // Parse vanshmala://pay?id=VM-0001&name=Prashant
          try {
            let vmId = '';
            let name = '';

            if (decodedText.startsWith('vanshmala://pay')) {
              const url = new URL(decodedText.replace('vanshmala://', 'https://'));
              vmId = url.searchParams.get('id') || '';
              name = url.searchParams.get('name') || '';
            }

            if (vmId) {
              stopScanner();
              onScanResult(vmId, name);
              onOpenChange(false);
              toast.success(t(`Found: ${name} (${vmId})`, `मिला: ${name} (${vmId})`));
            } else {
              toast.error(t('Invalid QR code', 'अमान्य QR कोड'));
            }
          } catch {
            toast.error(t('Could not read QR code', 'QR कोड पढ़ नहीं सका'));
          }
        },
        () => {
          // ignore scan failures (no QR in frame)
        }
      );
      setScanning(true);
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
        setCameraError(t('Camera permission denied. Please allow camera access.', 'कैमरा अनुमति अस्वीकृत। कृपया कैमरा एक्सेस दें।'));
      } else if (msg.includes('NotFoundError')) {
        setCameraError(t('No camera found on this device.', 'इस डिवाइस पर कोई कैमरा नहीं मिला।'));
      } else {
        setCameraError(t('Could not start camera.', 'कैमरा शुरू नहीं हो सका।'));
      }
    }
  }, [onScanResult, onOpenChange, stopScanner, t]);

  useEffect(() => {
    if (open) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => startScanner(), 300);
      return () => clearTimeout(timer);
    } else {
      stopScanner();
    }
  }, [open, startScanner, stopScanner]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { stopScanner(); };
  }, [stopScanner]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) stopScanner(); onOpenChange(v); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <ScanLine className="w-5 h-5" />
            {t('Scan QR Code', 'QR कोड स्कैन करें')}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t("Scan someone's Vanshmala QR to pay them", 'किसी का वंशमाला QR स्कैन करके भुगतान करें')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 pt-2">
          {/* Scanner viewport */}
          <div className="relative w-full aspect-square max-w-[300px] mx-auto rounded-2xl overflow-hidden bg-muted border border-border">
            <div id={scannerContainerId} className="w-full h-full" />

            {/* Scanning overlay corners */}
            {scanning && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-6 left-6 w-10 h-10 border-t-3 border-l-3 border-primary rounded-tl-lg" />
                <div className="absolute top-6 right-6 w-10 h-10 border-t-3 border-r-3 border-primary rounded-tr-lg" />
                <div className="absolute bottom-6 left-6 w-10 h-10 border-b-3 border-l-3 border-primary rounded-bl-lg" />
                <div className="absolute bottom-6 right-6 w-10 h-10 border-b-3 border-r-3 border-primary rounded-br-lg" />
              </div>
            )}
          </div>

          {cameraError && (
            <div className="flex flex-col items-center gap-2 text-center">
              <CameraOff className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-destructive">{cameraError}</p>
              <Button variant="outline" size="sm" onClick={startScanner} className="gap-2">
                <Camera className="w-4 h-4" />
                {t('Retry', 'पुनः प्रयास')}
              </Button>
            </div>
          )}

          {scanning && (
            <p className="text-xs text-muted-foreground text-center animate-pulse">
              {t('Point camera at a Vanshmala QR code...', 'कैमरा वंशमाला QR कोड पर रखें...')}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScanQRDialog;
