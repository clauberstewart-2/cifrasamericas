import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function ShowScreen({ currentPL, currentSongIdx, setCurrentSongIdx, metro, goBack }) {
  const { songs } = useApp();

  const plSongs = (currentPL?.songs || [])
    .map(id => songs.find(s => s.id === id))
    .filter(Boolean);

  const curr = plSongs[currentSongIdx];

  // Carrega BPM automaticamente quando muda de música
  useEffect(() => {
    if (curr?.bpm) metro.setBPM(curr.bpm);
  }, [currentSongIdx, curr?.bpm]);

  function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr + 'T12:00').toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long'
    });
  }

  if (!currentPL) {
    goBack();
    return null;
  }

  return (
    <div className="show-screen">
      {/* Cabeçalho escuro */}
      <div className="show-header">
        <div className="show-pl-name">{currentPL.name}</div>
        {curr && (
          <div className="curr-card">
            <div className="curr-label">tocando agora</div>
            <div className="curr-name">{curr.name}</div>
            <div className="curr-meta">Tom {curr.key} · {curr.bpm} BPM</div>
            {curr.ytUrl && (
              <button className="curr-yt" onClick={() => window.open(curr.ytUrl, '_blank')}>
                ▶ YouTube
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lista setlist */}
      <div className="show-list">
        {plSongs.map((s, i) => (
          <div
            key={s.id}
            className={`show-song ${i === currentSongIdx ? 'current' : ''} ${i < currentSongIdx ? 'done' : ''}`}
            onClick={() => setCurrentSongIdx(i)}
          >
            <div className={`show-num ${i === currentSongIdx ? 'current' : ''} ${i < currentSongIdx ? 'done' : ''}`}>
              {i < currentSongIdx ? '✓' : i + 1}
            </div>
            <div className="show-song-body">
              <div className="show-song-name">{s.name}</div>
              <div className="show-song-meta">Tom {s.key} · {s.bpm} BPM{s.ytUrl ? ' · YT' : ''}</div>
            </div>
            {i === currentSongIdx && (
              <span style={{ background: '#534AB7', color: '#fff', borderRadius: 6, padding: '2px 7px', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                ATUAL
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Navegação */}
      <div className="show-footer">
        <button
          className="show-nav"
          onClick={() => setCurrentSongIdx(i => Math.max(0, i - 1))}
        >← Anterior</button>
        <button
          className="show-nav primary"
          onClick={() => setCurrentSongIdx(i => Math.min(plSongs.length - 1, i + 1))}
        >Próxima →</button>
      </div>
    </div>
  );
}
