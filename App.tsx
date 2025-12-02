import React, { useState, useEffect } from 'react';
import { ViewState, UserProgress } from './types';
import { getProgress, saveProgress } from './services/storage';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import WorkoutPlayer from './pages/WorkoutPlayer';
import Nutrition from './pages/Nutrition';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [progress, setProgress] = useState<UserProgress>(getProgress());

  // Reload progress on mount
  useEffect(() => {
    setProgress(getProgress());
  }, []);

  const handleUpdateProgress = (newProgress: UserProgress) => {
    setProgress(newProgress);
    saveProgress(newProgress);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard progress={progress} onChangeView={setCurrentView} onUpdate={handleUpdateProgress} />;
      case 'workout':
        return <WorkoutPlayer progress={progress} onComplete={handleUpdateProgress} onExit={() => setCurrentView('dashboard')} />;
      case 'nutrition':
        return <Nutrition />;
      case 'profile':
        return (
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Profile & Constraints</h2>
            <div className="space-y-4">
              <div className="bg-red-50 border-l-4 border-red-500 p-4">
                <h3 className="font-bold text-red-700">MRI Constraints (Strict)</h3>
                <ul className="list-disc ml-5 text-red-700 mt-2 space-y-1">
                  <li>No heavy axial loading (Barbell Squats/Deadlifts)</li>
                  <li>No loaded twisting</li>
                  <li>No running or high-impact jumping</li>
                  <li>Regress if pain exceeds 5/10</li>
                </ul>
              </div>
              <div className="bg-blue-50 p-4 rounded text-blue-800">
                <h3 className="font-bold">Goal</h3>
                <p>Regain lean athletic physique while healing L4-S1 and Right Knee.</p>
              </div>
            </div>
          </div>
        );
      default:
        return <Dashboard progress={progress} onChangeView={setCurrentView} onUpdate={handleUpdateProgress} />;
    }
  };

  return (
    <Layout currentView={currentView} onChangeView={setCurrentView}>
      {renderView()}
    </Layout>
  );
}