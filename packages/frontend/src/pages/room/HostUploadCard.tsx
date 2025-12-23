import { useWebSocket } from '@/contexts/websocketContext';
import { useState } from 'react';

export default function HostUploadCard() {
  const { addRequest } = useWebSocket();

  const [videoUrl, setVideoUrl] = useState('');
  const [amount, setAmount] = useState(0);

  const handleUpload = () => {
    addRequest(videoUrl, amount);
    setVideoUrl('');
    setAmount(0);
  };

  return (
    <div className="bg-bg-card rounded-sm p-4 flex flex-col gap-5">
      <h2 className="text-lg font-semibold ">Host Upload </h2>

      <div className="flex flex-col gap-5">
        <input
          type="text"
          placeholder="Video URL"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          className="bg-bg-input text-white rounded-sm p-2"
        />
        <input
          type="text"
          placeholder="Amount (sats)"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="bg-bg-input text-white rounded-sm p-2"
        />
        <button onClick={handleUpload} className="bg-primary text-white rounded-sm p-2 cursor-pointer">
          Upload
        </button>
      </div>
    </div>
  );
}
