import React from 'react';
import { useGameStore } from '../store/gameStore';
import { CHARACTERS } from 'shared';

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  container: {
    background: 'rgba(0, 0, 0, 0.9)',
    borderRadius: '1rem',
    padding: '2rem',
    minWidth: '500px',
    maxWidth: '700px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#e94560',
    textAlign: 'center',
    marginBottom: '1.5rem',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  headerRow: {
    borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
  },
  headerCell: {
    padding: '0.75rem',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    color: '#888',
    textAlign: 'left',
  },
  row: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  cell: {
    padding: '0.75rem',
    fontSize: '1rem',
    color: 'white',
  },
  playerCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    color: 'white',
  },
  localPlayer: {
    background: 'rgba(233, 69, 96, 0.2)',
  },
  teamRed: {
    borderLeft: '3px solid #f44336',
  },
  teamBlue: {
    borderLeft: '3px solid #2196f3',
  },
};

function Scoreboard() {
  const { players, localPlayerId, selectedMode } = useGameStore();

  const sortedPlayers = Array.from(players.values()).sort((a, b) => {
    // Sort by kills descending, then deaths ascending
    if (b.kills !== a.kills) return b.kills - a.kills;
    return a.deaths - b.deaths;
  });

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        <h2 style={styles.title}>PLACAR</h2>

        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={{ ...styles.headerCell, width: '50%' }}>Jogador</th>
              <th style={{ ...styles.headerCell, width: '15%', textAlign: 'center' }}>K</th>
              <th style={{ ...styles.headerCell, width: '15%', textAlign: 'center' }}>D</th>
              <th style={{ ...styles.headerCell, width: '20%', textAlign: 'center' }}>K/D</th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((player) => {
              const character = CHARACTERS[player.characterId];
              const isLocal = player.id === localPlayerId;
              const kd = player.deaths > 0
                ? (player.kills / player.deaths).toFixed(2)
                : player.kills.toFixed(2);

              return (
                <tr
                  key={player.id}
                  style={{
                    ...styles.row,
                    ...(isLocal ? styles.localPlayer : {}),
                    ...(selectedMode === 'tdm' && player.team === 'red' ? styles.teamRed : {}),
                    ...(selectedMode === 'tdm' && player.team === 'blue' ? styles.teamBlue : {}),
                  }}
                >
                  <td style={styles.cell}>
                    <div style={styles.playerCell}>
                      <div
                        style={{
                          ...styles.avatar,
                          background: character?.color || '#666',
                        }}
                      >
                        {character?.name.charAt(0) || '?'}
                      </div>
                      <span>{character?.name || 'Unknown'}</span>
                      {isLocal && <span style={{ color: '#e94560' }}>(Você)</span>}
                    </div>
                  </td>
                  <td style={{ ...styles.cell, textAlign: 'center' }}>{player.kills}</td>
                  <td style={{ ...styles.cell, textAlign: 'center' }}>{player.deaths}</td>
                  <td style={{ ...styles.cell, textAlign: 'center' }}>{kd}</td>
                </tr>
              );
            })}

            {sortedPlayers.length === 0 && (
              <tr>
                <td colSpan={4} style={{ ...styles.cell, textAlign: 'center', color: '#888' }}>
                  Nenhum jogador
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Scoreboard;
