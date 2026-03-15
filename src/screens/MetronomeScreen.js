import React from 'react';
import { getTempoName } from '../hooks/useMetronome';

const COMPASS = [
  { label: '2/4', beats: 2 }, { label: '3/4', beats: 3 },
  { label: '4/4', beats: 4 }, { label: '5/4', beats: 5 },
  { label: '6/8', beats: 6 }, { label: '7/8', beats: 7 },
];
const SOUNDS = [
  { id: 'click', label: 'Clique' },
  { id: 'wood',  label: 'Madeira' },
  { id: 'beep',  label: 'Beep' },
];
const KEYS_MAJOR = ['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
const KEYS_MINOR = ['Cm','C#m','Dm','Ebm','Em','Fm','F#m','Gm','Abm','Am','Bbm','Bm'];

export default function MetronomeScreen({ metro }) {
  const {
    bpm, beats, playing, currentBeat, soundType,
    toggle, sync, setBPM, setBeats, setSound, tap,
  } = metro;

  return (
    <div className="screen-scroll metro-screen">
      {/* BPM display */}
      <div className="bpm-display">
        <div className="bpm-big">{bpm}</div>
        <div className="bpm-tempo-label">{getTempoName(bpm)}</div>
      </div>

      {/* Beat dots */}
      <div className="beats-row">
        {Array.from({ length: beats }, (_, i) => (
          <div key={i} className={`beat-dot ${currentBeat === i ? (i === 0 ? 'accent' : 'on') : ''}`} />
        ))}
      </div>

      {/* Slider */}
      <div className="bpm-slider-row">
        <span>30</span>
        <input
          type="range" min="30" max="300" value={bpm} step="1"
          style={{ flex: 1 }}
          onChange={e => setBPM(+e.target.value)}
        />
        <span>300</span>
      </div>

      {/* +/- buttons */}
      <div className="bpm-adj-row">
        {[-10, -5, -1, 1, 5, 10].map(d => (
          <button key={d} className="bpm-adj-btn" onClick={() => setBPM(bpm + d)}>
            {d > 0 ? `+${d}` : d}
          </button>
        ))}
      </div>

      {/* TAP — laranja */}
      <button className="tap-btn" onClick={tap}>
        TAP
        <span className="tap-hint">toque no ritmo para detectar o BPM</span>
      </button>

      {/* Sync + Contagem */}
      <div className="live-btns">
        <button className="btn-sync" onClick={sync}>↺ Sincronizar</button>
        <button className="btn-voice">🎙 Contagem</button>
      </div>

      {/* Compasso */}
      <div className="sec-label">Compasso</div>
      <div className="compass-row">
        {COMPASS.map(c => (
          <button
            key={c.label}
            className={`compass-btn ${beats === c.beats ? 'active' : ''}`}
            onClick={() => setBeats(c.beats)}
          >{c.label}</button>
        ))}
      </div>

      {/* Som */}
      <div className="sec-label">Som do clique</div>
      <div className="sound-row">
        {SOUNDS.map(s => (
          <button
            key={s.id}
            className={`sound-btn ${soundType === s.id ? 'active' : ''}`}
            onClick={() => setSound(s.id)}
          >{s.label}</button>
        ))}
      </div>
    </div>
  );
}
