import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { NetworkManager } from '../network/NetworkManager';

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
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '3rem',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '1rem',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#e94560',
    marginBottom: '2rem',
  },
  spinner: {
    width: '60px',
    height: '60px',
    border: '4px solid rgba(255, 255, 255, 0.1)',
    borderTop: '4px solid #e94560',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '2rem',
  },
  status: {
    fontSize: '1.2rem',
    color: 'white',
    marginBottom: '1rem',
  },
  info: {
    fontSize: '1rem',
    color: '#888',
    marginBottom: '0.5rem',
  },
  cancelButton: {
    marginTop: '2rem',
    padding: '0.8rem 2rem',
    fontSize: '1rem',
    color: 'white',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '0.5rem',
    transition: 'all 0.2s',
  },
};

// Add keyframes for spinner
const spinnerStyle = document.createElement('style');
spinnerStyle.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(spinnerStyle);

function Matchmaking() {
  const {
    playerName,
    selectedCharacter,
    selectedMode,
    queuePosition,
    playersInQueue,
    estimatedWait,
    setScreen,
  } = useGameStore();

  const [dots, setDots] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Conectando...');
  const networkRef = useRef<NetworkManager | null>(null);

  useEffect(() => {
    // Animate dots
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    // Connect to server
    const network = NetworkManager.getInstance();
    networkRef.current = network;

    const serverUrl = import.meta.env.VITE_SERVER_URL || 'ws://localhost:8080';

    network.connect(serverUrl).then(() => {
      setConnectionStatus('Conectado! Entrando na fila...');
      network.sendConnect(playerName, selectedCharacter);
      network.joinQueue(selectedMode);
    }).catch((error) => {
      setConnectionStatus('Erro ao conectar. Tentando novamente...');
      console.error('Connection error:', error);
    });

    return () => {
      clearInterval(dotsInterval);
    };
  }, [playerName, selectedCharacter, selectedMode]);

  const handleCancel = () => {
    if (networkRef.current) {
      networkRef.current.leaveQueue();
      networkRef.current.disconnect();
    }
    setScreen('character-select');
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Buscando Partida{dots}</h1>

        <div style={styles.spinner} />

        <p style={styles.status}>{connectionStatus}</p>

        <p style={styles.info}>
          Modo: {selectedMode === 'ffa' ? 'Free-for-All' : 'Team Deathmatch'}
        </p>

        {playersInQueue > 0 && (
          <>
            <p style={styles.info}>
              Jogadores na fila: {playersInQueue}
            </p>
            <p style={styles.info}>
              Sua posição: {queuePosition}
            </p>
            {estimatedWait > 0 && (
              <p style={styles.info}>
                Tempo estimado: ~{formatTime(estimatedWait)}
              </p>
            )}
          </>
        )}

        <button
          style={styles.cancelButton}
          onClick={handleCancel}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default Matchmaking;
