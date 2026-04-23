import React from 'react';
import { MessageSquare } from 'lucide-react';

const API_URL = 'http://localhost:5000';

function Login({ onLogin }) {
  const handleDiscordLogin = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/discord`);
      const data = await response.json();
      window.location.href = data.url;
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  // Vérifier si retour de Discord
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const discordId = urlParams.get('discord_id');
    const username = urlParams.get('username');
    const avatar = urlParams.get('avatar');
    const isAdmin = urlParams.get('is_admin') === 'true';

    if (discordId && username) {
      onLogin({
        discordId,
        username: decodeURIComponent(username),
        avatar: decodeURIComponent(avatar),
        isAdmin
      });
      // Nettoyer l'URL
      window.history.replaceState({}, document.title, '/');
    }
  }, [onLogin]);

  return (
    <div className="login-container">
      <div className="login-box fade-in">
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🍔</div>
        <h1>BurgerShot Manager</h1>
        <p>Connectez-vous avec Discord pour accéder au système de gestion</p>
        
        <button onClick={handleDiscordLogin} className="discord-btn">
          <MessageSquare size={20} />
          Se connecter avec Discord
        </button>
        
        <div style={{ marginTop: '2rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          <p>Système de gestion pour employés BurgerShot</p>
          <p style={{ marginTop: '0.5rem' }}>GTA RP • Management • Suivi des ventes</p>
        </div>
      </div>
    </div>
  );
}

export default Login;