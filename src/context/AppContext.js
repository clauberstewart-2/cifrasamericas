import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { getSongs, getPlaylists } from '../services/db';

const ADMIN_EMAIL = 'clauberstewart@gmail.com';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [songs, setSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setAuthLoading(false);
      if (u) {
        setIsAdmin(u.email === ADMIN_EMAIL);
        await loadData();
      } else {
        setSongs([]);
        setPlaylists([]);
        setIsAdmin(false);
      }
    });
    return unsub;
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [s, p] = await Promise.all([getSongs(), getPlaylists()]);
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
    const s = await getSongs();
    setSongs(s);
  }

  async function refreshPlaylists() {
    const p = await getPlaylists();
    setPlaylists(p);
  }

  return (
    <AppContext.Provider value={{
      user, authLoading, songs, playlists, loading,
      isAdmin, login, logout, refreshSongs, refreshPlaylists,
      setSongs, setPlaylists,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
