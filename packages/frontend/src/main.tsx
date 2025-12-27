import ReactDOM from 'react-dom/client';
import App from './App';
import { WebSocketProvider } from './contexts/websocketContext';
import { DemoProvider } from './contexts/demoContext';
import './index.css';
import YoutubeMetadataProvider from './contexts/youtubeMetadataContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <DemoProvider>
    <WebSocketProvider>
      <YoutubeMetadataProvider>
        <App />
      </YoutubeMetadataProvider>
    </WebSocketProvider>
  </DemoProvider>
);
