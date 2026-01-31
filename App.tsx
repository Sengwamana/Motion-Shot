/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback } from 'react';
import GeminiSlingshot from './components/GeminiSlingshot';
import GameLauncher from './components/GameLauncher';
import * as Sound from './services/soundService';

const App: React.FC = () => {
  const [gameStarted, setGameStarted] = useState(false);

  const handleStartGame = useCallback(async () => {
    // Ensure audio is ready
    await Sound.resumeAudio();
    
    // Transition to game
    setGameStarted(true);
    
    // Background music will continue from launcher
  }, []);

  return (
    <div className="w-full h-full">
      {gameStarted ? (
        <GeminiSlingshot />
      ) : (
        <GameLauncher onStartGame={handleStartGame} />
      )}
    </div>
  );
};

export default App;
