import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { Game } from '../engine/Game';
import HUD from './HUD';
import Scoreboard from './Scoreboard';
import MobileControls from './MobileControls';

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  canvas: {
    width: '100%',
    height: '100%',
    display: 'block',
    outline: 'none',
  },
  crosshair: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
    zIndex: 1000,
  },
};

function GameView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const { showScoreboard, currentMapId } = useGameStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile device
    const checkMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsMobile(checkMobile);

    if (!canvasRef.current) return;

    const game = new Game(canvasRef.current);
    gameRef.current = game;
    game.start();

    // Handle pointer lock (desktop only)
    const handleClick = () => {
      if (!checkMobile) {
        canvasRef.current?.requestPointerLock();
      }
    };

    canvasRef.current.addEventListener('click', handleClick);

    // Handle Tab for scoreboard
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        useGameStore.getState().setShowScoreboard(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        useGameStore.getState().setShowScoreboard(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      canvasRef.current?.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      game.dispose();
    };
  }, []);

  // Mobile control handlers
  const handleMove = useCallback((x: number, y: number) => {
    gameRef.current?.getInputManager()?.setTouchMove(x, y);
  }, []);

  const handleLook = useCallback((dx: number, dy: number) => {
    gameRef.current?.getInputManager()?.setTouchLook(dx, dy);
  }, []);

  const handleShoot = useCallback((shooting: boolean) => {
    gameRef.current?.getInputManager()?.setTouchShoot(shooting);
  }, []);

  const handleJump = useCallback(() => {
    gameRef.current?.getInputManager()?.triggerTouchJump();
  }, []);

  return (
    <div style={styles.container}>
      <canvas ref={canvasRef} style={styles.canvas} id="game-canvas" />

      {/* Crosshair */}
      <svg style={styles.crosshair} width="24" height="24" viewBox="0 0 24 24">
        <line x1="12" y1="0" x2="12" y2="10" stroke="white" strokeWidth="2" />
        <line x1="12" y1="14" x2="12" y2="24" stroke="white" strokeWidth="2" />
        <line x1="0" y1="12" x2="10" y2="12" stroke="white" strokeWidth="2" />
        <line x1="14" y1="12" x2="24" y2="12" stroke="white" strokeWidth="2" />
        <circle cx="12" cy="12" r="2" fill="none" stroke="white" strokeWidth="1" />
      </svg>

      <HUD />
      {showScoreboard && <Scoreboard />}

      {/* Mobile Controls */}
      {isMobile && (
        <MobileControls
          onMove={handleMove}
          onLook={handleLook}
          onShoot={handleShoot}
          onJump={handleJump}
        />
      )}
    </div>
  );
}

export default GameView;
