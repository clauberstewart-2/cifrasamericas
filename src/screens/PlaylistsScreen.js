import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { addPlaylist, deletePlaylist } from '../services/db';

export default function PlaylistsScreen({ openShow, navigate }) {
  const { user, playlists, songs, refreshPlaylists } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [plName, setPlName] = useState('');
  const [plDate, setPlDate] = useState(new Date().toISOString().split('T')[0]);

  async function handleCreate() {
    if (!plName.trim()) return;
    await addPlaylist(user.uid, { name: plName.trim(), date: plDate, songs: [] });
    await refreshPlaylists();
    setShowModal(false);
    setPlName('');
  }

  async function handleDelete(id) {
    if (!window.confirm('Apagar esta playlist?')) return;
    await deletePlaylist(id);
    await refreshPlaylists();
  }

  function getSongList(pl) {
    return (pl.songs || []).map(id => songs.find(s => s.id === id)).filter(Boolean);
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr + 'T12:00').toLocaleDateString('pt-BR', {
      weekday: 'short', day: '2-digit', month: 'short'
    });
  }

  return (
    <>
      <div className="screen-scroll">
        {!playlists.length && (
          <div className="empty-state">
            <span className="empty-icon">🎬</span>
            Nenhuma playlist ainda.<br />Crie uma para o próximo show!
          </div>
        )}

        {playlists.map(pl => {
          const plSongs = getSongList(pl);
          const dateStr = formatDate(pl.date);
          return (
            <div key={pl.id} className="pl-card">
              <div className="pl-card-head" onClick={() => openShow(pl)}>
                <div className="pl-cover">🎬</div>
                <div className="pl-body">
                  <div className="pl-name">{pl.name}</div>
                  <div className="pl-meta">
                    {plSongs.length} música{plSongs.length !== 1 ? 's' : ''}
                    {dateStr ? ` · ${dateStr}` : ''}
                  </div>
                </div>
                <div className="pl-actions">
                  <button className="pl-btn" onClick={e => { e.stopPropagation(); navigate('editPlaylist'); }}>✎</button>
                  <button className="pl-btn" style={{ color: '#DC2626' }} onClick={e => { e.stopPropagation(); handleDelete(pl.id); }}>🗑</button>
                </div>
              </div>
              {plSongs.length > 0 && (
                <div className="pl-songs">
                  {plSongs.slice(0, 3).map((s, i) => (
                    <div key={s.id} className="pl-song-row">
                      <span className="pl-song-num">{i + 1}</span>
                      <span className="pl-song-name">{s.name}</span>
                      <span className="pl-song-key">{s.key}</span>
                    </div>
                  ))}
                  {plSongs.length > 3 && (
                    <div style={{ fontSize: 10, color: '#9ca3af', paddingTop: 3 }}>
                      +{plSongs.length - 3} músicas
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Nova playlist
        </button>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-title">Nova playlist</div>
            <div className="modal-label">Nome do evento</div>
            <input
              className="modal-input"
              placeholder="ex: Culto Domingo — Igreja Central"
              value={plName}
              onChange={e => setPlName(e.target.value)}
              maxLength={60}
              autoFocus
            />
            <div className="modal-label">Data</div>
            <input
              className="modal-input"
              type="date"
              value={plDate}
              onChange={e => setPlDate(e.target.value)}
            />
            <div className="modal-actions">
              <button className="modal-btn" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="modal-btn primary" onClick={handleCreate}>Criar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
