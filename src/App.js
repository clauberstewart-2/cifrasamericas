import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { useMetronome, getTempoName } from './hooks/useMetronome';
import LibraryScreen from './screens/LibraryScreen';
import PlaylistsScreen from './screens/PlaylistsScreen';
import ShowScreen from './screens/ShowScreen';
import MetronomeScreen from './screens/MetronomeScreen';
import UploadScreen from './screens/UploadScreen';
import LoginScreen from './screens/LoginScreen';
import './App.css';

function AppShell() {
  const { user, authLoading } = useApp();
  const metro = useMetronome();
  const [screen, setScreen] = useState('library');
  const [screenStack, setScreenStack] = useState([]);
  const [currentPL, setCurrentPL] = useState(null);
  const [currentSongIdx, setCurrentSongIdx] = useState(0);

  if (authLoading) return (
    <div className="loading-screen">
      <div className="loading-logo">🎵</div>
      <div className="loading-text">Cifras Américas</div>
    </div>
  );

  if (!user) return <LoginScreen />;

  function navigate(to, resetStack = false) {
    if (resetStack) {
      setScreenStack([]);
    } else {
      setScreenStack(prev => [...prev, screen]);
    }
    setScreen(to);
  }

  function goBack() {
    const prev = screenStack[screenStack.length - 1];
    setScreenStack(s => s.slice(0, -1));
    setScreen(prev || 'library');
  }

  function openShow(pl) {
    setCurrentPL(pl);
    setCurrentSongIdx(0);
    navigate('show');
  }

  const screenProps = {
    navigate, goBack, metro,
    currentPL, setCurrentPL,
    currentSongIdx, setCurrentSongIdx,
    openShow,
  };

  const navItems = [
    { id: 'library',   icon: '🎵', label: 'Biblioteca' },
    { id: 'playlists', icon: '🎬', label: 'Playlists' },
    { id: 'metronome', icon: '⏱', label: 'Metrônomo' },
    { id: 'upload',    icon: '⬆', label: 'Upload' },
  ];

  const mainScreens = ['library', 'playlists', 'metronome', 'upload'];
  const isMainScreen = mainScreens.includes(screen);

  return (
    <div className="app-shell">
      {/* Header */}
      <div className={`topbar ${screen === 'show' ? 'topbar-dark' : ''}`}>
        {!isMainScreen && (
          <button className="tb-back" onClick={goBack}>← Voltar</button>
        )}
        <span className="tb-title">
          {{ library: 'Minhas cifras', playlists: 'Playlists', metronome: 'Metrônomo',
             upload: 'Upload', show: 'Modo show' }[screen] || ''}
        </span>
        {screen === 'metronome' && (
          <span className="tb-tempo">{getTempoName(metro.bpm)}</span>
        )}
      </div>

      {/* Screens */}
      <div className="screen-area">
        {screen === 'library'   && <LibraryScreen   {...screenProps} />}
        {screen === 'playlists' && <PlaylistsScreen  {...screenProps} />}
        {screen === 'metronome' && <MetronomeScreen  {...screenProps} />}
        {screen === 'upload'    && <UploadScreen     {...screenProps} />}
        {screen === 'show'      && <ShowScreen       {...screenProps} />}
      </div>

      {/* ── BARRA DE METRÔNOMO GLOBAL — sempre visível ── */}
      <MetroBar metro={metro} />

      {/* Navbar */}
      <nav className="navbar">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${screen === item.id ? 'active' : ''}`}
            onClick={() => navigate(item.id, true)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function MetroBar({ metro }) {
  const { bpm, beats, playing, currentBeat, toggle, sync, setBPM } = metro;

  return (
    <div className="metro-bar">
      {/* Beats visuais */}
      <div className="metro-bar-beats">
        {Array.from({ length: beats }, (_, i) => (
          <div
            key={i}
            className={`mb-beat ${currentBeat === i ? (i === 0 ? 'accent' : 'on') : ''}`}
          />
        ))}
      </div>

      {/* Controles */}
      <div className="metro-bar-controls">
        <button className="mb-adj" onClick={() => setBPM(bpm - 1)}>−</button>
        <div className="mb-bpm-wrap">
          <span className="mb-bpm-num">{bpm}</span>
          <span className="mb-bpm-label">BPM</span>
        </div>
        <button className="mb-adj" onClick={() => setBPM(bpm + 1)}>+</button>
        <button className="mb-sync" onClick={sync}>↺</button>
        <button className={`mb-play ${playing ? 'playing' : 'stopped'}`} onClick={toggle}>
          <span className="mb-play-icon">{playing ? '⏸' : '▶'}</span>
          <span className="mb-play-label">{playing ? 'Parar' : 'Iniciar'}</span>
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
