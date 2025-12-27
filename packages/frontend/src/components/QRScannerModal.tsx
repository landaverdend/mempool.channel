import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
}

export default function QRScannerModal({ isOpen, onClose, onScan }: QRScannerModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) {
          // Html5QrcodeScannerState.SCANNING
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    if (!isOpen) {
      // Stop scanner when modal closes
      stopScanner();
      return;
    }

    const startScanner = async () => {
      setError(null);
      setIsScanning(true);

      try {
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // Only accept NWC URLs
            if (decodedText.startsWith('nostr+walletconnect://')) {
              onScan(decodedText);
              stopScanner();
              onClose();
            } else {
              setError('Please scan a valid NWC QR code');
            }
          },
          () => {
            // QR code not detected - silent ignore
          }
        );
      } catch (err) {
        console.error('Scanner error:', err);
        if (err instanceof Error) {
          if (err.message.includes('NotAllowedError') || err.message.includes('Permission')) {
            setError('Camera permission denied. Please allow camera access to scan QR codes.');
          } else if (err.message.includes('NotFoundError')) {
            setError('No camera found on this device.');
          } else {
            setError('Failed to start camera. Please try again.');
          }
        } else {
          setError('Failed to start camera. Please try again.');
        }
        setIsScanning(false);
      }
    };

    // Small delay to ensure DOM is ready
    const timeout = setTimeout(startScanner, 100);

    return () => {
      clearTimeout(timeout);
      stopScanner();
    };
  }, [isOpen, onScan, onClose]);

  const handleClose = async () => {
    await stopScanner();
    setError(null);
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-bg-card border border-border rounded-lg p-6 w-full max-w-md z-50 focus:outline-none">
          <Dialog.Title className="text-xl font-semibold text-fg mb-2">Scan NWC QR Code</Dialog.Title>
          <Dialog.Description className="text-sm text-fg-muted mb-4">
            Scan the NWC connection QR code from your Alby wallet.
          </Dialog.Description>

          {/* Scanner Container */}
          <div className="relative rounded-lg overflow-hidden bg-black">
            <div id="qr-reader" ref={containerRef} className="w-full aspect-square" />

            {/* Scanning indicator overlay */}
            {isScanning && !error && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-primary rounded-lg animate-pulse" />
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red/10 border border-red/30 rounded-lg">
              <p className="text-red text-sm">{error}</p>
            </div>
          )}

          {/* Helper Text */}
          <p className="text-xs text-fg-muted text-center mt-4">Point your camera at the QR code in your wallet's NWC settings</p>

          {/* Close Button */}
          <Dialog.Close asChild>
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-fg-muted hover:text-fg transition-colors"
              aria-label="Close">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
