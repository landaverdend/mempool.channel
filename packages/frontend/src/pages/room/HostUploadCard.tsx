import { useWebSocket } from '@/contexts/websocketContext';
import { useState } from 'react';
import { validateYouTubeVideo } from '@/lib/yt-utils';

export default function HostUploadCard() {
  const { addRequest } = useWebSocket();

  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleUpload = async () => {
    if (!videoUrl.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    setError(null);
    setIsValidating(true);

    const result = await validateYouTubeVideo(videoUrl);

    if (!result.valid) {
      setError(result.error || 'Invalid video');
      setIsValidating(false);
      return;
    }

    addRequest(videoUrl, 0);
    setVideoUrl('');
    setIsValidating(false);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVideoUrl(e.target.value);
    setError(null);
  };

  return (
    <div className="bg-bg-card rounded-sm p-4 flex flex-col gap-5">
      <h2 className="text-lg font-semibold ">Host Upload </h2>

      {error && (
        <div className="p-3 bg-red/10 border border-red rounded text-red text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-5">
        <input
          type="text"
          placeholder="Video URL"
          value={videoUrl}
          onChange={handleUrlChange}
          className="bg-bg-input text-white rounded-sm p-2"
        />
        <button
          onClick={handleUpload}
          disabled={isValidating || !videoUrl.trim()}
          className="bg-primary text-white rounded-sm p-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
          {isValidating ? 'Validating...' : 'Upload'}
        </button>
      </div>
    </div>
  );
}
