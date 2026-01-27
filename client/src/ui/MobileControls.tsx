import React, { useRef, useCallback, useEffect, useState } from 'react';

interface MobileControlsProps {
  onMove: (x: number, y: number) => void;
  onLook: (dx: number, dy: number) => void;
  onShoot: (shooting: boolean) => void;
  onJump: () => void;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: 100,
  },
  joystickArea: {
    position: 'absolute',
    left: 20,
    bottom: 20,
    width: 150,
    height: 150,
    pointerEvents: 'auto',
    touchAction: 'none',
  },
  joystickBase: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.2)',
    border: '3px solid rgba(255, 255, 255, 0.4)',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
  },
  joystickKnob: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.6)',
    border: '2px solid rgba(255, 255, 255, 0.8)',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    transition: 'none',
  },
  lookArea: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: '50%',
    height: '70%',
    pointerEvents: 'auto',
    touchAction: 'none',
  },
  fireButton: {
    position: 'absolute',
    right: 30,
    bottom: 100,
    width: 80,
    height: 80,
    borderRadius: '50%',
    background: 'rgba(255, 50, 50, 0.5)',
    border: '3px solid rgba(255, 100, 100, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
    pointerEvents: 'auto',
    touchAction: 'none',
    userSelect: 'none',
  },
  jumpButton: {
    position: 'absolute',
    right: 130,
    bottom: 60,
    width: 60,
    height: 60,
    borderRadius: '50%',
    background: 'rgba(50, 150, 255, 0.5)',
    border: '3px solid rgba(100, 180, 255, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
    pointerEvents: 'auto',
    touchAction: 'none',
    userSelect: 'none',
  },
  reloadButton: {
    position: 'absolute',
    right: 130,
    bottom: 140,
    width: 50,
    height: 50,
    borderRadius: '50%',
    background: 'rgba(50, 255, 150, 0.5)',
    border: '3px solid rgba(100, 255, 180, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '10px',
    fontWeight: 'bold',
    pointerEvents: 'auto',
    touchAction: 'none',
    userSelect: 'none',
  },
};

function MobileControls({ onMove, onLook, onShoot, onJump }: MobileControlsProps) {
  const joystickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [joystickActive, setJoystickActive] = useState(false);
  const joystickTouchId = useRef<number | null>(null);
  const lookTouchId = useRef<number | null>(null);
  const lastLookPos = useRef<{ x: number; y: number } | null>(null);

  // Joystick handlers
  const handleJoystickStart = useCallback((e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    joystickTouchId.current = touch.identifier;
    setJoystickActive(true);
    handleJoystickMove(e);
  }, []);

  const handleJoystickMove = useCallback((e: React.TouchEvent) => {
    if (joystickTouchId.current === null) return;

    const touch = Array.from(e.touches).find(t => t.identifier === joystickTouchId.current);
    if (!touch || !joystickRef.current || !knobRef.current) return;

    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let deltaX = touch.clientX - centerX;
    let deltaY = touch.clientY - centerY;

    const maxDistance = 40;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > maxDistance) {
      deltaX = (deltaX / distance) * maxDistance;
      deltaY = (deltaY / distance) * maxDistance;
    }

    knobRef.current.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;

    // Normalize to -1 to 1
    const normalX = deltaX / maxDistance;
    const normalY = -deltaY / maxDistance; // Invert Y for forward/backward

    onMove(normalX, normalY);
  }, [onMove]);

  const handleJoystickEnd = useCallback((e: React.TouchEvent) => {
    const touch = Array.from(e.changedTouches).find(t => t.identifier === joystickTouchId.current);
    if (!touch) return;

    joystickTouchId.current = null;
    setJoystickActive(false);

    if (knobRef.current) {
      knobRef.current.style.transform = 'translate(-50%, -50%)';
    }

    onMove(0, 0);
  }, [onMove]);

  // Look area handlers
  const handleLookStart = useCallback((e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    lookTouchId.current = touch.identifier;
    lastLookPos.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleLookMove = useCallback((e: React.TouchEvent) => {
    if (lookTouchId.current === null || !lastLookPos.current) return;

    const touch = Array.from(e.touches).find(t => t.identifier === lookTouchId.current);
    if (!touch) return;

    const dx = touch.clientX - lastLookPos.current.x;
    const dy = touch.clientY - lastLookPos.current.y;

    lastLookPos.current = { x: touch.clientX, y: touch.clientY };

    onLook(dx * 0.5, dy * 0.5);
  }, [onLook]);

  const handleLookEnd = useCallback((e: React.TouchEvent) => {
    const touch = Array.from(e.changedTouches).find(t => t.identifier === lookTouchId.current);
    if (!touch) return;

    lookTouchId.current = null;
    lastLookPos.current = null;
  }, []);

  // Fire button handlers
  const handleFireStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    onShoot(true);
  }, [onShoot]);

  const handleFireEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    onShoot(false);
  }, [onShoot]);

  // Jump button handler
  const handleJumpStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    onJump();
  }, [onJump]);

  return (
    <div style={styles.container}>
      {/* Movement Joystick */}
      <div
        ref={joystickRef}
        style={styles.joystickArea}
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
        onTouchCancel={handleJoystickEnd}
      >
        <div style={styles.joystickBase}>
          <div ref={knobRef} style={styles.joystickKnob} />
        </div>
      </div>

      {/* Look/Aim Area */}
      <div
        style={styles.lookArea}
        onTouchStart={handleLookStart}
        onTouchMove={handleLookMove}
        onTouchEnd={handleLookEnd}
        onTouchCancel={handleLookEnd}
      />

      {/* Fire Button */}
      <div
        style={styles.fireButton}
        onTouchStart={handleFireStart}
        onTouchEnd={handleFireEnd}
        onTouchCancel={handleFireEnd}
      >
        FIRE
      </div>

      {/* Jump Button */}
      <div
        style={styles.jumpButton}
        onTouchStart={handleJumpStart}
      >
        JUMP
      </div>
    </div>
  );
}

export default MobileControls;
