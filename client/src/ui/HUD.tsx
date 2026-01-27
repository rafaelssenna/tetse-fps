import React from 'react';
import { useGameStore } from '../store/gameStore';

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    padding: '1rem',
  },
  crosshair: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crosshairLine: {
    position: 'absolute',
    background: 'rgba(255, 255, 255, 0.9)',
    boxShadow: '0 0 2px rgba(0, 0, 0, 0.8)',
  },
  crosshairDot: {
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.9)',
    boxShadow: '0 0 2px rgba(0, 0, 0, 0.8)',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timer: {
    background: 'rgba(0, 0, 0, 0.5)',
    padding: '0.5rem 1.5rem',
    borderRadius: '0.5rem',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: 'white',
  },
  bottomBar: {
    position: 'absolute',
    bottom: '1rem',
    left: '1rem',
    right: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  healthContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  healthBar: {
    width: '200px',
    height: '20px',
    background: 'rgba(0, 0, 0, 0.5)',
    borderRadius: '0.25rem',
    overflow: 'hidden',
  },
  healthFill: {
    height: '100%',
    transition: 'width 0.2s, background 0.2s',
  },
  healthText: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: 'white',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
  },
  ammoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  ammoText: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: 'white',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
  },
  ammoMax: {
    fontSize: '1.2rem',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  scoreContainer: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    background: 'rgba(0, 0, 0, 0.5)',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    display: 'flex',
    gap: '1rem',
  },
  score: {
    fontSize: '1.2rem',
    color: 'white',
  },
  killFeed: {
    position: 'absolute',
    top: '4rem',
    right: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    maxWidth: '300px',
  },
  killEntry: {
    background: 'rgba(0, 0, 0, 0.5)',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    fontSize: '0.9rem',
    color: 'white',
  },
  hint: {
    position: 'absolute',
    bottom: '4rem',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0, 0, 0, 0.5)',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    fontSize: '0.9rem',
    color: 'rgba(255, 255, 255, 0.7)',
  },
};

function HUD() {
  const { health, ammo, kills, deaths, timeRemaining } = useGameStore();

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getHealthColor = (health: number): string => {
    if (health > 60) return '#4caf50';
    if (health > 30) return '#ff9800';
    return '#f44336';
  };

  return (
    <div style={styles.container}>
      {/* Crosshair */}
      <div style={styles.crosshair}>
        {/* Center dot */}
        <div style={styles.crosshairDot} />
        {/* Top line */}
        <div style={{
          ...styles.crosshairLine,
          width: '2px',
          height: '12px',
          top: '-18px',
        }} />
        {/* Bottom line */}
        <div style={{
          ...styles.crosshairLine,
          width: '2px',
          height: '12px',
          bottom: '-18px',
        }} />
        {/* Left line */}
        <div style={{
          ...styles.crosshairLine,
          width: '12px',
          height: '2px',
          left: '-18px',
        }} />
        {/* Right line */}
        <div style={{
          ...styles.crosshairLine,
          width: '12px',
          height: '2px',
          right: '-18px',
        }} />
      </div>

      {/* Timer */}
      <div style={styles.topBar}>
        <div style={styles.timer}>{formatTime(timeRemaining)}</div>
      </div>

      {/* Score */}
      <div style={styles.scoreContainer}>
        <span style={styles.score}>K: {kills}</span>
        <span style={styles.score}>D: {deaths}</span>
      </div>

      {/* Bottom Bar */}
      <div style={styles.bottomBar}>
        {/* Health */}
        <div style={styles.healthContainer}>
          <div style={styles.healthBar}>
            <div
              style={{
                ...styles.healthFill,
                width: `${health}%`,
                background: getHealthColor(health),
              }}
            />
          </div>
          <span style={styles.healthText}>{Math.max(0, Math.round(health))}</span>
        </div>

        {/* Ammo */}
        <div style={styles.ammoContainer}>
          <span style={styles.ammoText}>{ammo}</span>
          <span style={styles.ammoMax}>/ 30</span>
        </div>
      </div>

      {/* Hint */}
      <div style={styles.hint}>
        Pressione TAB para ver o placar
      </div>
    </div>
  );
}

export default HUD;
