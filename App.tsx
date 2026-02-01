/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback } from 'react';
import GeminiSlingshot from './components/GeminiSlingshot';
import GameLauncher from './components/GameLauncher';
import StoryPage from './components/StoryPage';
import * as Sound from './services/soundService';

// App screens flow: Story -> Launcher -> Game
type AppScreen = 'story' | 'launcher' | 'game';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('story');

  // Handle story completion - go to game launcher
  const handleStoryComplete = useCallback(async () => {
    await Sound.resumeAudio();
    setCurrentScreen('launcher');
  }, []);

  // Handle game start from launcher
  const handleStartGame = useCallback(async () => {
    // Ensure audio is ready
    await Sound.resumeAudio();
    
    // Transition to game
    setCurrentScreen('game');
    
    // Background music will continue from launcher
  }, []);

  return (
    <div className="w-full h-full">
      {currentScreen === 'story' && (
        <StoryPage onContinue={handleStoryComplete} />
      )}
      {currentScreen === 'launcher' && (
        <GameLauncher onStartGame={handleStartGame} />
      )}
      {currentScreen === 'game' && (
        <GeminiSlingshot />
      )}
    </div>
  );
};

export default App;
