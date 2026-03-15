import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { getSongs, getPlaylists } from '../services/db';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [songs, setSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setAuthLoading(false);
      if (u) {
        await loadData(u.uid);
      } else {
        setSongs([]);
        setPlaylists([]);
      }
    });
    return unsub;
  }, []);

  async function loadData(uid) {
    setLoading(true);
    try {
      const [s, p] = await Promise.all([getSongs(uid), getPlaylists(uid)]);
      setSongs(s);
      setPlaylists(p);
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
    }
    setLoading(false);
  }

  async function login() {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error('Erro no login:', e);
    }
  }

  async function logout() {
    await signOut(auth);
  }

  async function refreshSongs() {
    if (!user) return;
    const s = await getSongs(user.uid);
    setSongs(s);
  }

  async function refreshPlaylists() {
    if (!user) return;
    const p = await getPlaylists(user.uid);
    setPlaylists(p);
  }

  return (
    <AppContext.Provider value={{
      user, authLoading, songs, playlists, loading,
      login, logout, refreshSongs, refreshPlaylists,
      setSongs, setPlaylists,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
