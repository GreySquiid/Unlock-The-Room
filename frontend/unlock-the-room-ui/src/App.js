import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Levels from "./pages/Levels";
import Reports from "./pages/Reports";
import AiGenerator from "./pages/AiGenerator";
import Game from "./pages/Game";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/levels" element={<Levels />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/ai-generator" element={<AiGenerator />} />
        <Route path="/game" element={<Game />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
