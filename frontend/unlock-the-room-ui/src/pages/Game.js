import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import MainMenu from "../components/game/MainMenu";
import LevelSelect from "../components/game/LevelSelect";
import GameCanvas from "../components/game/GameCanvas.js";
import GameLogin from "../components/game/GameLogin";
import SavedLevels from "../components/game/SavedLevels";
import Settings from "../components/game/Settings";

const DEFAULT_SETTINGS = {
  soundEnabled: true,
  showTimer: true,
  showControls: true,
  highContrast: false,
};

function Game() {
  const [screen, setScreen] = useState("menu");
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [player, setPlayer] = useState(null);
  const [publishedLevels, setPublishedLevels] = useState([]);
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("gameSettings");
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });
  // fromContext tracks which external screen launched the current playtest
  const [fromContext, setFromContext] = useState(null); // "ai-generator" | "level-editor" | null
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setPlayer(JSON.parse(stored));

    api.get('/Levels').then(res => {
      setPublishedLevels(res.data.filter(l => l.isPublished));
    }).catch(() => {});
  }, []);

  // Handle entry via location.state (LevelEditor playtest) or URL params (AI Generator playtest)
  useEffect(() => {
    const levelIdParam = searchParams.get("level");
    const fromParam = searchParams.get("from");

    if (levelIdParam) {
      // AI Generator path: fetch level by ID (works for draft levels), start game
      api.get(`/Levels/${levelIdParam}`)
        .then(res => {
          setSelectedLevel(res.data);
          setScreen("game");
          setFromContext(fromParam || null);
        })
        .catch(() => {});
    } else if (location.state?.autoPlay) {
      // LevelEditor path: level object passed directly in state
      setSelectedLevel(location.state.autoPlay);
      setScreen("game");
      setFromContext(location.state?.from || null);
    }
  }, []);

  const updateSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem("gameSettings", JSON.stringify(newSettings));
  };

  const handleLogin = (userData) => {
    setPlayer(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", userData.token);
    setScreen("menu");
  };

  const handleLogout = () => {
    setPlayer(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setScreen("menu");
  };

  // Build the return URL/action for playtest exit paths
  const returnToContext = useCallback(() => {
    if (fromContext === "ai-generator") {
      // Preserve the form constraint params; add saved=1 so the generator shows confirmation
      const returnParams = new URLSearchParams(searchParams);
      returnParams.delete("level");
      returnParams.delete("from");
      returnParams.set("saved", "1");
      navigate(`/ai-generator?${returnParams.toString()}`);
    } else if (fromContext === "level-editor") {
      navigate("/levels", { state: { reopenEditor: selectedLevel } });
    }
  }, [fromContext, navigate, searchParams, selectedLevel]);

  const handleLevelComplete = useCallback((timeSeconds) => {
    if (fromContext) {
      returnToContext();
      return;
    }
    const currentIndex = publishedLevels.findIndex(l => l.id === selectedLevel?.id);
    const nextLevel = publishedLevels[currentIndex + 1];
    if (nextLevel) {
      setSelectedLevel(nextLevel);
      setScreen("game");
    } else {
      setScreen("levelSelect");
    }
  }, [fromContext, returnToContext, publishedLevels, selectedLevel]);

  const handleMenu = useCallback(() => {
    if (fromContext) { returnToContext(); return; }
    setScreen("menu");
  }, [fromContext, returnToContext]);

  const handleLevelSelect = useCallback(() => {
    if (fromContext) { returnToContext(); return; }
    setScreen("levelSelect");
  }, [fromContext, returnToContext]);

  const handlePlayLevel = useCallback((level) => {
    setSelectedLevel(level);
    setScreen("game");
  }, []);

  const stableSettings = useMemo(() => settings, [
    settings.soundEnabled,
    settings.showTimer,
    settings.showControls,
    settings.highContrast,
  ]);

  const renderScreen = () => {
    switch (screen) {
      case "menu":
        return <MainMenu player={player} onNavigate={setScreen} />;
      case "levelSelect":
        return (
          <LevelSelect
            player={player}
            settings={settings}
            onPlay={handlePlayLevel}
            onBack={() => setScreen("menu")}
          />
        );
      case "game":
        return (
          <GameCanvas
            level={selectedLevel}
            player={player}
            settings={stableSettings}
            onComplete={handleLevelComplete}
            onMenu={handleMenu}
            onLevelSelect={handleLevelSelect}
          />
        );
      case "login":
        return (
          <GameLogin
            player={player}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onBack={() => setScreen("menu")}
          />
        );

      case "savedLevels":
        return (
          <SavedLevels
            player={player}
            onPlay={handlePlayLevel}
            onBack={() => setScreen("menu")}
          />
        );
      case "settings":
        return (
          <Settings
            settings={settings}
            onSave={updateSettings}
            onBack={() => setScreen("menu")}
          />
        );
      default:
        return <MainMenu player={player} onNavigate={setScreen} />;
    }
  };

  return <div style={styles.shell}>{renderScreen()}</div>;
}

const styles = {
  shell: {
    minHeight: "100vh",
    background: 'var(--game-bg)',
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Segoe UI', sans-serif",
  },
};

export default Game;
