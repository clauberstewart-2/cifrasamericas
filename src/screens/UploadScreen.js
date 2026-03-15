import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { addSong, uploadPDF } from '../services/db';
import { parseFileName, isYouTubeUrl, extractLinksFromPDF } from '../utils/parseFileName';

const STATUS = {
  PENDING: 'pending',
  READING: 'reading',
  UPLOADING: 'uploading',
  DONE: 'done',
  ERROR: 'error',
};

export default function UploadScreen() {
  const { user, refreshSongs } = useApp();
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const dzRef = useRef(null);
  const fileBuffers = useRef({});

  function updateItem(id, updates) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...updates } : it));
  }

  async function handleFiles(fileList) {
    const files = Array.from(fileList).filter(f => f.name.toLowerCase().endsWith('.pdf'));
    if (!files.length) return;

    for (const file of files) {
      if (items.find(i => i.filename === file.name)) continue;
      const id = Date.now() + Math.random();
      const parsed = parseFileName(file.name);
      const item = {
        id, filename: file.name, file, parsed,
        edited: { name: parsed.name, key: parsed.key, bpm: parsed.bpm === '' ? '' : String(parsed.bpm) },
        links: [], ytLinks: [], status: STATUS.READING, error: null, progress: 0,
      };
      setItems(prev => [...prev, item]);

      try {
        const buf = await file.arrayBuffer();
        fileBuffers.current[id] = buf;
        const links = await extractLinksFromPDF(buf.slice(0));
        updateItem(id, {
          links,
          ytLinks: links.filter(isYouTubeUrl),
          status: STATUS.PENDING,
        });
      } catch (e) {
        updateItem(id, { status: STATUS.ERROR, error: 'Erro ao ler o PDF' });
      }
    }
  }

  async function handleAddToLibrary() {
    const ready = items.filter(i => i.status === STATUS.PENDING && i.parsed.valid);
    if (!ready.length) return;
    setUploading(true);

    for (const item of ready) {
      try {
        updateItem(item.id, { status: STATUS.UPLOADING, progress: 0 });
        const { downloadURL, storagePath } = await uploadPDF(
          user.uid,
          item.file,
          (p) => updateItem(item.id, { progress: p })
        );
        const e = item.edited;
        await addSong(user.uid, {
          name: e.name || item.parsed.name,
          key: e.key || item.parsed.key || '?',
          bpm: +(e.bpm || item.parsed.bpm || 0),
          ytUrl: item.ytLinks[0] || null,
          hasPdf: true,
          pdfUrl: downloadURL,
          storagePath,
          filename: item.filename,
        });
        updateItem(item.id, { status: STATUS.DONE, progress: 100 });
      } catch (e) {
        updateItem(item.id, { status: STATUS.ERROR, error: e.message || 'Erro no upload' });
      }
    }

    await refreshSongs();
    setUploading(false);
  }

  const validPending = items.filter(i => i.status === STATUS.PENDING && i.parsed.valid);
  const done = items.filter(i => i.status === STATUS.DONE);
  const errors = items.filter(i => i.status === STATUS.ERROR);

  const SC = {
    [STATUS.READING]:   { l: 'Lendo...',  bg: '#E6F1FB', c: '#185FA5' },
    [STATUS.PENDING]:   { l: 'Pronto',    bg: '#E1F5EE', c: '#085041' },
    [STATUS.UPLOADING]: { l: 'Enviando...', bg: '#E6F1FB', c: '#185FA5' },
    [STATUS.DONE]:      { l: 'Salvo ✓',   bg: '#E1F5EE', c: '#085041' },
    [STATUS.ERROR]:     { l: 'Erro',      bg: '#FEF2F2', c: '#DC2626' },
  };

  return (
    <div className="screen-scroll">
      {/* Drop zone */}
      <div
        className="dropzone"
        ref={dzRef}
        onDragOver={e => { e.preventDefault(); dzRef.current?.classList.add('drag'); }}
        onDragLeave={() => dzRef.current?.classList.remove('drag')}
        onDrop={e => { e.preventDefault(); dzRef.current?.classList.remove('drag'); handleFiles(e.dataTransfer.files); }}
      >
        <input type="file" accept=".pdf,application/pdf" multiple onChange={e => handleFiles(e.target.files)} />
        <div className="dz-icon">📂</div>
        <div className="dz-title">Selecionar PDFs</div>
        <div className="dz-sub">Todos os arquivos são aceitos — edite se precisar</div>
        <div className="dz-hint">AGRADEÇO (A 70).pdf</div>
      </div>

      {/* Stats */}
      {items.length > 0 && (
        <div className="stats-row">
          {validPending.length > 0 && <span className="pill" style={{ background: '#E1F5EE', color: '#085041' }}>{validPending.length} pronto{validPending.length > 1 ? 's' : ''}</span>}
          {done.length > 0 && <span className="pill" style={{ background: '#EEEDFE', color: '#534AB7' }}>{done.length} salvo{done.length > 1 ? 's' : ''}</span>}
          {errors.length > 0 && <span className="pill" style={{ background: '#FEF2F2', color: '#DC2626' }}>{errors.length} com erro</span>}
        </div>
      )}

      {/* File cards */}
      {items.map(item => {
        const p = item.parsed;
        const e = item.edited;
        const sc = SC[item.status] || SC[STATUS.PENDING];
        const isEditing = editingId === item.id;

        return (
          <div key={item.id} className={`file-card ${item.status === STATUS.DONE || (p.valid && item.status === STATUS.PENDING) ? 'ok' : !p.valid ? 'pending' : ''}`}>
            {item.status === STATUS.READING && <div className="load-bar"><div className="load-fill" /></div>}
            <div className="file-card-inner">
              <div className="file-ico" style={{ background: item.status === STATUS.ERROR ? '#FEF2F2' : !p.valid ? '#FAEEDA' : '#E1F5EE' }}>📄</div>
              <div className="file-body">
                <div className="file-fname">{item.filename}</div>
                <div className="file-name" style={!p.valid ? { color: '#9ca3af', fontStyle: 'italic' } : {}}>
                  {p.valid ? (e.name || p.name) : 'Nome fora do padrão'}
                </div>
                {p.valid && (
                  <div className="file-badges">
                    <span className="badge" style={{ background: '#EEEDFE', color: '#3C3489' }}>{e.key || '—'}</span>
                    <span className="badge" style={{ background: '#E6F1FB', color: '#0C447C' }}>{e.bpm || '—'} BPM</span>
                    {item.ytLinks.length > 0 && <span className="badge" style={{ background: '#FEF2F2', color: '#DC2626' }}>▶ YT</span>}
                  </div>
                )}
                {!p.valid && item.status !== STATUS.ERROR && (
                  <div style={{ fontSize: 10, color: '#D97706', marginTop: 2 }}>✎ Edite para preencher</div>
                )}
                {item.status === STATUS.ERROR && (
                  <div style={{ fontSize: 10, color: '#DC2626', marginTop: 2 }}>{item.error}</div>
                )}
                {item.status === STATUS.UPLOADING && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                    <div style={{ flex: 1, height: 3, background: '#E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: 3, background: '#534AB7', borderRadius: 2, width: `${item.progress}%`, transition: 'width .3s' }} />
                    </div>
                    <span style={{ fontSize: 9, color: '#6B7280' }}>{item.progress}%</span>
                  </div>
                )}

                {/* Edit panel */}
                {isEditing && (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <input className="modal-input" style={{ fontSize: 12, padding: '6px 8px' }}
                      defaultValue={e.name || ''} placeholder="Nome da música"
                      onChange={ev => setItems(prev => prev.map(it => it.id === item.id ? { ...it, edited: { ...it.edited, name: ev.target.value } } : it))}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      <input className="modal-input" style={{ fontSize: 12, padding: '6px 8px' }}
                        defaultValue={e.key || ''} placeholder="Tom (ex: A)"
                        onChange={ev => setItems(prev => prev.map(it => it.id === item.id ? { ...it, edited: { ...it.edited, key: ev.target.value }, parsed: { ...it.parsed, valid: true } } : it))}
                      />
                      <input className="modal-input" style={{ fontSize: 12, padding: '6px 8px' }}
                        type="number" defaultValue={e.bpm || ''} placeholder="BPM"
                        onChange={ev => setItems(prev => prev.map(it => it.id === item.id ? { ...it, edited: { ...it.edited, bpm: ev.target.value } } : it))}
                      />
                    </div>
                    <button className="modal-btn primary" style={{ padding: '7px 14px', fontSize: 12 }} onClick={() => setEditingId(null)}>✓ OK</button>
                  </div>
                )}
              </div>

              <div className="file-right">
                <span className="status-badge" style={{ background: sc.bg, color: sc.c }}>{sc.l}</span>
                <div style={{ display: 'flex', gap: 3 }}>
                  {item.status !== STATUS.ERROR && (
                    <button className="icon-btn" onClick={() => setEditingId(isEditing ? null : item.id)}>✎</button>
                  )}
                  <button className="icon-btn"
                    onClick={() => { setItems(prev => prev.filter(i => i.id !== item.id)); delete fileBuffers.current[item.id]; }}
                    style={item.status === STATUS.UPLOADING ? { opacity: .3 } : {}}
                  >✕</button>
                </div>
              </div>
            </div>

            {/* YouTube links */}
            {item.ytLinks.map(url => (
              <div key={url} className="yt-bar">
                <span style={{ fontSize: 11 }}>▶</span>
                <span className="yt-url">{url}</span>
                <button className="yt-open-btn" onClick={() => window.open(url, '_blank')}>Abrir</button>
              </div>
            ))}
          </div>
        );
      })}

      {/* Add to library button */}
      {validPending.length > 0 && (
        <button
          className="btn-primary"
          onClick={handleAddToLibrary}
          disabled={uploading}
          style={uploading ? { opacity: .6 } : {}}
        >
          {uploading ? 'Enviando...' : `⬆ Adicionar ${validPending.length} música${validPending.length > 1 ? 's' : ''} à biblioteca`}
        </button>
      )}
    </div>
  );
}
