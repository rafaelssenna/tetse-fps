import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  },
  title: {
    fontSize: '4rem',
    fontWeight: 'bold',
    color: '#e94560',
    textShadow: '0 0 20px rgba(233, 69, 96, 0.5)',
    marginBottom: '3rem',
    letterSpacing: '0.5rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.5rem',
    padding: '2rem',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '1rem',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  label: {
    fontSize: '1rem',
    color: '#ccc',
    marginBottom: '0.5rem',
  },
  input: {
    width: '300px',
    padding: '1rem 1.5rem',
    fontSize: '1.1rem',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '0.5rem',
    color: 'white',
    outline: 'none',
    transition: 'border-color 0.3s',
  },
  button: {
    width: '300px',
    padding: '1rem 2rem',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: 'white',
    background: 'linear-gradient(135deg, #e94560 0%, #c73659 100%)',
    borderRadius: '0.5rem',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 4px 15px rgba(233, 69, 96, 0.3)',
  },
  footer: {
    position: 'absolute',
    bottom: '2rem',
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '0.9rem',
  },
};

function MainMenu() {
  const { playerName, setPlayerName, setScreen } = useGameStore();
  const [name, setName] = useState(playerName);

  const handlePlay = () => {
    if (name.trim()) {
      setPlayerName(name.trim());
      setScreen('character-select');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePlay();
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>FPS ARENA</h1>

      <div style={styles.form}>
        <div>
          <label style={styles.label}>Nome do Jogador</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite seu nome..."
            maxLength={20}
            style={styles.input}
            autoFocus
          />
        </div>

        <button
          onClick={handlePlay}
          disabled={!name.trim()}
          style={{
            ...styles.button,
            opacity: name.trim() ? 1 : 0.5,
            cursor: name.trim() ? 'pointer' : 'not-allowed',
          }}
          onMouseEnter={(e) => {
            if (name.trim()) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(233, 69, 96, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(233, 69, 96, 0.3)';
          }}
        >
          JOGAR
        </button>
      </div>

      <div style={styles.footer}>
        Use WASD para mover, Mouse para mirar, Clique para atirar
      </div>
    </div>
  );
}

export default MainMenu;
