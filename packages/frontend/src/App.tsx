import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useWebSocket } from './contexts/websocket-context';
import Home from './pages/Home';
import Room from './pages/Room';

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
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
