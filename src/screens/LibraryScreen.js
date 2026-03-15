import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function LibraryScreen({ navigate, metro }) {
  const { songs, user, logout } = useApp();
  const [query, setQuery] = useState('');

  const filtered = songs.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    (s.artist || '').toLowerCase().includes(query.toLowerCase())
  );

  function openSong(song) {
    metro.setBPM(song.bpm || 90);
    navigate('metronome');
  }

  return (
    <div className="screen-scroll">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          className="search-box"
          style={{ flex: 1 }}
          placeholder="🔍 Buscar música..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button
          onClick={logout}
          style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af' }}
          title="Sair"
        >⏻</button>
      </div>

      <div className="sec-label">{filtered.length} música{filtered.length !== 1 ? 's' : ''}</div>

      {!filtered.length && (
        <div className="empty-state">
          <span className="empty-icon">🎵</span>
          {songs.length === 0
            ? 'Nenhuma música ainda.\nVá em Upload para adicionar PDFs.'
            : 'Nenhuma música encontrada.'}
        </div>
      )}

      {filtered.map(song => (
        <div key={song.id} className="song-card" onClick={() => openSong(song)}>
          <div className="song-key">{song.key || '?'}</div>
          <div className="song-body">
            <div className="song-name">{song.name}</div>
            <div className="song-meta">
              {song.bpm ? `${song.bpm} BPM` : ''}
              {song.hasPdf ? ' · PDF' : ' · sem PDF'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {song.ytUrl && <div className="yt-dot" />}
            {!song.hasPdf && (
              <span style={{ fontSize: 9, background: '#FAEEDA', color: '#854F0B', borderRadius: 5, padding: '2px 5px', fontWeight: 700 }}>
                sem PDF
              </span>
            )}
            <span style={{ fontSize: 16, color: '#9ca3af' }}>›</span>
          </div>
        </div>
      ))}
    </div>
  );
}
