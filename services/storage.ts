import { UserProgress } from '../types';

const STORAGE_KEY = 'eoin_rehab_app_v1';

const initialProgress: UserProgress = {
  currentDay: 1,
  completedDays: [],
  painLog: {},
  streak: 0
};

export const getProgress = (): UserProgress => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : initialProgress;
  } catch (e) {
    return initialProgress;
  }
};

export const saveProgress = (progress: UserProgress) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
};

export const markDayComplete = (day: number, backPain: number, kneePain: number, notes: string) => {
  const progress = getProgress();
  if (!progress.completedDays.includes(day)) {
    progress.completedDays.push(day);
    progress.streak += 1;
  }
  
  // Advance day if it's the current one
  if (day === progress.currentDay) {
    progress.currentDay += 1;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  progress.painLog[todayStr] = { backPain, kneePain, notes, dayNumber: day };

  saveProgress(progress);
  return progress;
};

export const deleteWorkoutLog = (date: string) => {
  const progress = getProgress();
  const entry = progress.painLog[date];
  
  if (entry) {
    // Remove from completedDays if it exists
    if (entry.dayNumber) {
      progress.completedDays = progress.completedDays.filter(d => d !== entry.dayNumber);
      
      // If we deleted the latest day, revert currentDay
      if (entry.dayNumber === progress.currentDay - 1) {
        progress.currentDay = entry.dayNumber;
      }
    }
    
    delete progress.painLog[date];
    
    // Decrement streak safely
    if (progress.streak > 0) progress.streak -= 1; 
    
    saveProgress(progress);
  }
  return progress;
};

export const updateWorkoutLog = (date: string, updates: { backPain: number; kneePain: number; notes: string }) => {
  const progress = getProgress();
  if (progress.painLog[date]) {
    progress.painLog[date] = {
      ...progress.painLog[date],
      ...updates
    };
    saveProgress(progress);
  }
  return progress;
};