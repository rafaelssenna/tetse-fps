import React from 'react';
import { useGameStore } from './store/gameStore';
import MainMenu from './ui/MainMenu';
import CharacterSelect from './ui/CharacterSelect';
import GameView from './ui/GameView';
import Matchmaking from './ui/Matchmaking';

type Screen = 'menu' | 'character-select' | 'matchmaking' | 'game';

function App() {
  const { screen } = useGameStore();

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {screen === 'menu' && <MainMenu />}
      {screen === 'character-select' && <CharacterSelect />}
      {screen === 'matchmaking' && <Matchmaking />}
      {screen === 'game' && <GameView />}
    </div>
  );
}

export default App;
