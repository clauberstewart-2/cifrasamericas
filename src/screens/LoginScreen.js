import React from 'react';
import { useApp } from '../context/AppContext';

export default function LoginScreen() {
  const { login } = useApp();
  return (
    <div className="login-screen">
      <span className="login-logo">🎵</span>
      <h1 className="login-title">Cifras Américas</h1>
      <p className="login-sub">
        Seu app de cifras, metrônomo e playlists para shows ao vivo.
      </p>
      <button className="btn-google" onClick={login}>
        <span className="btn-google-icon">G</span>
        Entrar com Google
      </button>
    </div>
  );
}
