import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import PMRoute from './components/PMRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import BacklogPage from './pages/BacklogPage';
import SprintCreatePage from './pages/SprintCreatePage';
import RetroFormPage from './pages/RetroFormPage';
import RetroResultsPage from './pages/RetroResultsPage';
import SprintHistoryPage from './pages/SprintHistoryPage';
import TeamPage from './pages/TeamPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/retro/:sprintId" element={<RetroFormPage />} />
      </Route>

      <Route element={<PMRoute />}>
        <Route path="/backlog" element={<BacklogPage />} />
        <Route path="/sprint/new" element={<SprintCreatePage />} />
        <Route path="/retro/:sprintId/results" element={<RetroResultsPage />} />
        <Route path="/history" element={<SprintHistoryPage />} />
        <Route path="/team" element={<TeamPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
