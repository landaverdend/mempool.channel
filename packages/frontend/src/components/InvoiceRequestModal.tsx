import { useWebSocket } from '@/contexts/websocket-context';
import { useState } from 'react';

interface InvoiceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number, comment?: string) => void;
  isLoading: boolean;
}

export default function InvoiceRequestModal({ isOpen, onClose, onSubmit, isLoading }: InvoiceRequestModalProps) {
  const { roomState } = useWebSocket();

  const [amount, setAmount] = useState(roomState.minSendable.toString());
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const validateAmount = (amount: number) => {
    if (amount < roomState.minSendable) {
      setError(`Amount must be greater than ${roomState.minSendable} sats`);
      return false;
    }

    if (amount > roomState.maxSendable) {
      setError(`Amount must be less than ${roomState.maxSendable} sats`);
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    const amountNum = parseInt(amount, 10);

    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!validateAmount(amountNum)) {
      return;
    }

    setError(null);
    onSubmit(amountNum, comment.trim() || undefined);
  };

  const handleClose = () => {
    setAmount('');
    setComment('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
        <h2 className="text-xl font-semibold mb-4">Request Payment</h2>

        {error && <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">{error}</div>}

        <div className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Amount (sats) <span className="text-red-400">*</span>{' '}
              <span className="text-gray-400 text-xs">({roomState.minSendable} sats minimum)</span>
            </label>
            <input
              type="number"
              value={amount}
              min={roomState.minSendable.toString()}
              max={roomState.maxSendable.toString()}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="21000"
              className="w-full px-4 py-3 bg-slate-700 text-gray-100 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none"
              autoFocus
            />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Comment / Message <span className="text-gray-600">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Thanks for the coffee!"
              rows={3}
              className="w-full px-4 py-3 bg-slate-700 text-gray-100 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-slate-700 text-gray-100 rounded-lg cursor-pointer hover:bg-slate-600 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !amount}
            className="flex-1 px-4 py-3 bg-indigo-700 text-gray-100 rounded-lg cursor-pointer hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? 'Generating...' : 'Generate Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
}
