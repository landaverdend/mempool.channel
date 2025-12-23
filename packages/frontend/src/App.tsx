import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useWebSocket } from './contexts/websocket-context';
import Home from './pages/home/Home';
import Room from './pages/room/Room';

function AppRoutes() {
  const { connect, connected } = useWebSocket();

  // Auto-connect on mount
  useEffect(() => {
    if (!connected) {
      connect();
    }
  }, [connect, connected]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/room/:roomCode" element={<Room />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-fg)',
          },
        }}
      />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
