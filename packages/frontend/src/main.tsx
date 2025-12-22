import ReactDOM from 'react-dom/client';
import App from './App';
import { WebSocketProvider } from './contexts/websocket-context';
import './index.css';
import YoutubeMetadataProvider from './contexts/youtubeMetadataContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <WebSocketProvider>
    <YoutubeMetadataProvider>
      <App />
    </YoutubeMetadataProvider>
  </WebSocketProvider>
);
