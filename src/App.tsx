import React from 'react';
import StartScreen from './components/StartScreen';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-blue-100 flex items-center justify-center p-4">
      <StartScreen />
    </div>
  );
};

export default App; 