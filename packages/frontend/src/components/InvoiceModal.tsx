import * as Dialog from '@radix-ui/react-dialog';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CopyIcon, SatsIcon } from '@/components/Icons';
import { useWebSocket } from '@/contexts/websocket-context';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: string | null;
  loading: boolean;
  amount?: number;
}

export default function InvoiceModal({ isOpen, onClose, invoice, loading, amount }: InvoiceModalProps) {
  const { invoiceState, clearInvoice } = useWebSocket();

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!invoice) return;
    await navigator.clipboard.writeText(invoice);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Close modal and show toast when invoice is paid
  useEffect(() => {
    if (invoiceState.paid) {
      toast.success('Payment received! Your request has been added to the queue.', {
        duration: 4000,
      });
      clearInvoice();
      onClose();
    }
  }, [invoiceState.paid, clearInvoice, onClose]);

  // Close modal if invoice generation failed (invoice becomes null while not loading)
  useEffect(() => {
    if (isOpen && !loading && !invoice && !invoiceState.paid) {
      onClose();
    }
  }, [isOpen, loading, invoice, invoiceState.paid, onClose]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-bg-card border border-border rounded-lg p-6 w-full max-w-md z-50 focus:outline-none">
          <Dialog.Title className="text-xl font-semibold text-fg mb-2 flex items-center gap-2">Pay Invoice</Dialog.Title>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <svg className="animate-spin h-12 w-12 text-primary mb-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-fg-muted">Generating invoice...</p>
            </div>
          )}

          {/* Invoice Display */}
          {invoice && !loading && (
            <div className="space-y-4">
              {/* Amount Display */}
              {amount && (
                <div className="flex items-center justify-center gap-2 text-2xl font-bold text-fg">
                  {amount.toLocaleString()}
                  <SatsIcon width={24} height={24} />
                </div>
              )}

              {/* QR Code */}
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg">
                  <QRCodeSVG value={invoice} size={220} level="M" />
                </div>
              </div>

              {/* Invoice String (truncated) */}
              <div className="p-3 bg-bg-stat rounded border border-border">
                <p className="font-mono text-xs text-fg-muted break-all line-clamp-2">{invoice}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCopy}
                  className="flex-1 py-3 bg-secondary text-fg rounded font-medium hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center gap-2">
                  {copied ? (
                    <>
                      <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <CopyIcon />
                      Copy
                    </>
                  )}
                </button>
              </div>

              {/* Helper Text */}
              <p className="text-xs text-fg-muted text-center">Scan with a Lightning wallet or click "Open Wallet"</p>
            </div>
          )}

          {/* Close Button */}
          <Dialog.Close asChild>
            <button className="absolute top-4 right-4 text-fg-muted hover:text-fg transition-colors" aria-label="Close">
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
