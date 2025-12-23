import { useState, useEffect } from 'react';
import { useWebSocket } from '@/contexts/websocket-context';
import { useYoutubeMetadata } from '@/contexts/youtubeMetadataContext';
import { getYouTubeVideoId } from '@/lib/yt-utils';
import { isValidUrl } from '@/lib/utils';
import { SatsIcon } from '@/components/Icons';
import InvoiceModal from '@/components/InvoiceModal';

const PRESET_AMOUNTS = [100, 500, 1000, 5000];

export default function RequestSongCard() {
  const { roomState, makeRequest, invoiceState, clearInvoice } = useWebSocket();
  const { getMetadata } = useYoutubeMetadata();

  const [url, setUrl] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [submittedAmount, setSubmittedAmount] = useState<number | undefined>();

  const videoId = getYouTubeVideoId(url);
  const metadata = videoId ? getMetadata(url) : null;

  // Clear error when inputs change
  useEffect(() => {
    setError(null);
  }, [url, amount]);

  const handleSubmit = () => {
    const amountNum = parseInt(amount, 10);

    if (!url.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    if (!isValidUrl(url)) {
      setError('Please enter a valid URL');
      return;
    }

    if (!videoId) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setSubmittedAmount(amountNum);
    setShowInvoiceModal(true);
    clearInvoice();
    makeRequest({
      roomCode: roomState.roomCode,
      amount: amountNum,
      url: url.trim(),
    });
  };

  const handleCloseModal = () => {
    setShowInvoiceModal(false);
    clearInvoice();
    // Clear form on close
    setUrl('');
    setAmount('');
    setSubmittedAmount(undefined);
  };

  const handlePresetClick = (preset: number) => {
    setAmount(preset.toString());
  };

  return (
    <div className="bg-bg-card rounded-sm p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-fg mb-4">Request a Song</h2>

      {/* Error Display */}
      {error && <div className="mb-4 p-3 bg-red/10 border border-red rounded text-red text-sm">{error}</div>}

      <div className="space-y-4">
        {/* YouTube URL Input */}
        <div>
          <label className="block text-sm text-fg-muted mb-2">YouTube URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full px-4 py-3 bg-bg-input text-fg rounded border border-border focus:border-primary focus:outline-none placeholder:text-fg-muted/50 transition-colors"
          />
        </div>

        {/* Video Preview */}
        {videoId && (
          <div className="flex gap-3 p-3 bg-bg-stat rounded border border-border">
            <img
              src={metadata?.thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`}
              alt="Video thumbnail"
              className="w-24 h-18 object-cover rounded shrink-0"
            />
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              {metadata ? (
                <>
                  <p className="text-fg font-medium text-sm line-clamp-2">{metadata.title}</p>
                  <p className="text-fg-muted text-xs mt-1">{metadata.author}</p>
                </>
              ) : (
                <p className="text-fg-muted text-sm">Loading video info...</p>
              )}
            </div>
          </div>
        )}

        {/* Amount Input */}
        <div>
          <label className="block text-sm text-fg-muted mb-2">Amount (sats)</label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="1"
              className="w-full px-4 py-3 pr-12 bg-bg-input text-fg rounded border border-border focus:border-primary focus:outline-none placeholder:text-fg-muted/50 transition-colors"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <SatsIcon width={20} height={20} className="text-fg-muted" />
            </div>
          </div>
        </div>

        {/* Preset Amounts */}
        <div className="flex gap-2">
          {PRESET_AMOUNTS.map((preset) => (
            <button
              key={preset}
              onClick={() => handlePresetClick(preset)}
              className={`flex-1 py-2 rounded border text-sm font-medium transition-colors cursor-pointer ${
                amount === preset.toString()
                  ? 'bg-primary border-primary text-white'
                  : 'bg-bg-input border-border text-fg-muted hover:border-primary hover:text-fg'
              }`}>
              {preset.toLocaleString()}
            </button>
          ))}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!url.trim() || !amount}
          className="w-full py-3 bg-mainnet text-white rounded font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
          <span className="flex items-center justify-center gap-2">
            <SatsIcon width={18} height={18} />
            Request Song
          </span>
        </button>

        {/* Helper Text */}
        <p className="text-xs text-fg-muted text-center">Higher amounts get priority in the queue</p>
      </div>

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={showInvoiceModal}
        onClose={handleCloseModal}
        invoice={invoiceState.invoice}
        loading={invoiceState.loading}
        error={invoiceState.error}
        amount={submittedAmount}
      />
    </div>
  );
}
