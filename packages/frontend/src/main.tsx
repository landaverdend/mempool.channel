import ReactDOM from 'react-dom/client';
import App from './App';
import { WebSocketProvider } from './contexts/websocket-context';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <WebSocketProvider>
    <App />
  </WebSocketProvider>
);
