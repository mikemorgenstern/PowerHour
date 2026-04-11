import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSpotifyAuth } from './hooks/useSpotifyAuth';
import LoginScreen from './components/auth/LoginScreen';
import AuthCallback from './components/auth/AuthCallback';
import PlaylistPicker from './components/setup/PlaylistPicker';
import GameSettings from './components/setup/GameSettings';
import GameView from './components/game/GameView';
import GameSummary from './components/results/GameSummary';
import Spinner from './components/shared/Spinner';

function AppRoutes() {
  const { isAuthenticated, isLoading } = useSpotifyAuth();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/callback" element={<AuthCallback />} />
      <Route
        path="/select"
        element={isAuthenticated ? <PlaylistPicker /> : <Navigate to="/login" />}
      />
      <Route
        path="/settings"
        element={isAuthenticated ? <GameSettings /> : <Navigate to="/login" />}
      />
      <Route
        path="/play"
        element={isAuthenticated ? <GameView /> : <Navigate to="/login" />}
      />
      <Route
        path="/results"
        element={isAuthenticated ? <GameSummary /> : <Navigate to="/login" />}
      />
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? '/select' : '/login'} />}
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
