import React from 'react';
import { useGameStore } from '../store/gameStore';
import { CHARACTERS, CHARACTER_IDS, CharacterId, GameMode } from 'shared';

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '2rem',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    overflow: 'auto',
  },
  header: {
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#e94560',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#888',
    textAlign: 'center',
    marginTop: '0.5rem',
  },
  modeSection: {
    marginBottom: '2rem',
  },
  modeTitle: {
    fontSize: '1.2rem',
    color: 'white',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  modeButtons: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
  },
  modeButton: {
    padding: '1rem 2rem',
    fontSize: '1rem',
    fontWeight: 'bold',
    borderRadius: '0.5rem',
    transition: 'all 0.2s',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: '1rem',
    maxWidth: '800px',
    width: '100%',
    marginBottom: '2rem',
  },
  characterCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '1rem',
    borderRadius: '1rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: '3px solid transparent',
  },
  avatar: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '0.5rem',
  },
  characterName: {
    fontSize: '0.9rem',
    color: 'white',
    textAlign: 'center',
  },
  playButton: {
    padding: '1rem 4rem',
    fontSize: '1.3rem',
    fontWeight: 'bold',
    color: 'white',
    background: 'linear-gradient(135deg, #e94560 0%, #c73659 100%)',
    borderRadius: '0.5rem',
    transition: 'all 0.2s',
    boxShadow: '0 4px 15px rgba(233, 69, 96, 0.3)',
  },
  backButton: {
    position: 'absolute',
    top: '2rem',
    left: '2rem',
    padding: '0.5rem 1rem',
    fontSize: '1rem',
    color: 'white',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '0.5rem',
    transition: 'all 0.2s',
  },
};

function CharacterSelect() {
  const {
    selectedCharacter,
    setSelectedCharacter,
    selectedMode,
    setSelectedMode,
    setScreen,
  } = useGameStore();

  const handlePlay = () => {
    setScreen('matchmaking');
  };

  return (
    <div style={styles.container}>
      <button
        style={styles.backButton}
        onClick={() => setScreen('menu')}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        }}
      >
        ← Voltar
      </button>

      <div style={styles.header}>
        <h1 style={styles.title}>Escolha seu Personagem</h1>
        <p style={styles.subtitle}>Todos os personagens têm as mesmas habilidades</p>
      </div>

      <div style={styles.modeSection}>
        <h2 style={styles.modeTitle}>Modo de Jogo</h2>
        <div style={styles.modeButtons}>
          <button
            style={{
              ...styles.modeButton,
              background: selectedMode === 'ffa' ? '#e94560' : 'rgba(255, 255, 255, 0.1)',
              color: 'white',
            }}
            onClick={() => setSelectedMode('ffa')}
          >
            Free-for-All
          </button>
          <button
            style={{
              ...styles.modeButton,
              background: selectedMode === 'tdm' ? '#e94560' : 'rgba(255, 255, 255, 0.1)',
              color: 'white',
            }}
            onClick={() => setSelectedMode('tdm')}
          >
            Team Deathmatch
          </button>
        </div>
      </div>

      <div style={styles.grid}>
        {CHARACTER_IDS.map((id) => {
          const character = CHARACTERS[id];
          const isSelected = selectedCharacter === id;

          return (
            <div
              key={id}
              style={{
                ...styles.characterCard,
                background: isSelected
                  ? 'rgba(233, 69, 96, 0.2)'
                  : 'rgba(255, 255, 255, 0.05)',
                borderColor: isSelected ? '#e94560' : 'transparent',
              }}
              onClick={() => setSelectedCharacter(id)}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }
              }}
            >
              <div
                style={{
                  ...styles.avatar,
                  background: character.color,
                }}
              >
                {character.name.charAt(0)}
              </div>
              <span style={styles.characterName}>{character.name}</span>
            </div>
          );
        })}
      </div>

      <button
        style={styles.playButton}
        onClick={handlePlay}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(233, 69, 96, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(233, 69, 96, 0.3)';
        }}
      >
        BUSCAR PARTIDA
      </button>
    </div>
  );
}

export default CharacterSelect;
