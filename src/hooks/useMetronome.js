import { useRef, useState, useCallback } from 'react';

const TEMPO_NAMES = [
  { max: 39,  name: 'Larghissimo' },
  { max: 59,  name: 'Largo' },
  { max: 65,  name: 'Larghetto' },
  { max: 75,  name: 'Adagio' },
  { max: 107, name: 'Andante' },
  { max: 119, name: 'Moderato' },
  { max: 139, name: 'Allegretto' },
  { max: 167, name: 'Allegro' },
  { max: 199, name: 'Vivace' },
  { max: 300, name: 'Presto' },
];

export function getTempoName(bpm) {
  return (TEMPO_NAMES.find(t => bpm <= t.max) || TEMPO_NAMES[TEMPO_NAMES.length - 1]).name;
}

export function useMetronome() {
  const [bpm, setBpmState] = useState(90);
  const [beats, setBeatsState] = useState(4);
  const [playing, setPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [soundType, setSoundType] = useState('click');

  const audioCtxRef = useRef(null);
  const scheduleTimerRef = useRef(null);
  const nextBeatTimeRef = useRef(0);
  const beatRef = useRef(0);
  const bpmRef = useRef(90);
  const beatsRef = useRef(4);
  const soundTypeRef = useRef('click');
  const tapTimesRef = useRef([]);

  function getCtx() {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtxRef.current;
  }

  function playClick(accent, time) {
    try {
      const ctx = getCtx();
      const t = time;
      const sType = soundTypeRef.current;

      if (sType === 'click') {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(accent ? 1500 : 900, t);
        g.gain.setValueAtTime(accent ? 0.8 : 0.4, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        o.start(t); o.stop(t + 0.09);
      } else if (sType === 'wood') {
        const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.07), ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
        const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
        f.type = 'bandpass'; f.frequency.value = accent ? 900 : 550; f.Q.value = 3;
        g.gain.setValueAtTime(accent ? 1 : 0.65, t);
        src.buffer = buf; src.connect(f); f.connect(g); g.connect(ctx.destination);
        src.start(t);
      } else {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'square';
        o.frequency.setValueAtTime(accent ? 1047 : 659, t);
        g.gain.setValueAtTime(accent ? 0.28 : 0.16, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        o.start(t); o.stop(t + 0.07);
      }
    } catch (e) {}
  }

  function scheduler() {
    const ctx = getCtx();
    while (nextBeatTimeRef.current < ctx.currentTime + 0.12) {
      const isAccent = beatRef.current === 0;
      const t = nextBeatTimeRef.current;
      const sb = beatRef.current;
      playClick(isAccent, t);
      const delay = Math.max(0, (t - ctx.currentTime) * 1000);
      setTimeout(() => setCurrentBeat(sb), delay);
      beatRef.current = (beatRef.current + 1) % beatsRef.current;
      nextBeatTimeRef.current += 60 / bpmRef.current;
    }
    scheduleTimerRef.current = setTimeout(scheduler, 25);
  }

  const start = useCallback(() => {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
    beatRef.current = 0;
    nextBeatTimeRef.current = ctx.currentTime + 0.05;
    scheduler();
    setPlaying(true);
  }, []);

  const stop = useCallback(() => {
    clearTimeout(scheduleTimerRef.current);
    beatRef.current = 0;
    setPlaying(false);
    setCurrentBeat(-1);
  }, []);

  const toggle = useCallback(() => {
    if (playing) stop(); else start();
  }, [playing, start, stop]);

  const sync = useCallback(() => {
    if (!playing) return;
    clearTimeout(scheduleTimerRef.current);
    beatRef.current = 0;
    nextBeatTimeRef.current = getCtx().currentTime + 0.02;
    scheduler();
  }, [playing]);

  const setBPM = useCallback((v) => {
    const val = Math.min(300, Math.max(30, +v));
    bpmRef.current = val;
    setBpmState(val);
    if (playing) { stop(); setTimeout(start, 50); }
  }, [playing, stop, start]);

  const setBeats = useCallback((v) => {
    beatsRef.current = v;
    setBeatsState(v);
    beatRef.current = 0;
    if (playing) { stop(); setTimeout(start, 50); }
  }, [playing, stop, start]);

  const setSound = useCallback((s) => {
    soundTypeRef.current = s;
    setSoundType(s);
  }, []);

  const tap = useCallback(() => {
    const now = Date.now();
    tapTimesRef.current.push(now);
    if (tapTimesRef.current.length > 8) tapTimesRef.current.shift();
    if (tapTimesRef.current.length > 1) {
      const gaps = [];
      for (let i = 1; i < tapTimesRef.current.length; i++) {
        gaps.push(tapTimesRef.current[i] - tapTimesRef.current[i - 1]);
      }
      const avg = gaps.reduce((a, b) => a + b) / gaps.length;
      setBPM(Math.round(60000 / avg));
    }
    setTimeout(() => {
      const last = tapTimesRef.current[tapTimesRef.current.length - 1];
      if (last && Date.now() - last > 2000) tapTimesRef.current = [];
    }, 2100);
  }, [setBPM]);

  return {
    bpm, beats, playing, currentBeat, soundType,
    toggle, start, stop, sync, setBPM, setBeats, setSound, tap,
  };
}
