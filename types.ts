export type ExerciseType = 'strength' | 'rehab-back' | 'rehab-knee' | 'core' | 'cardio' | 'warmup' | 'cooldown';

export interface Exercise {
  id: string;
  name: string;
  sets?: number;
  reps?: string;
  tempo?: string; // e.g., "3-0-1-0"
  rest?: string;
  notes?: string;
  type: ExerciseType;
  videoUrl?: string; // Placeholder for video links
  completed?: boolean;
}

export interface WorkoutBlock {
  title: string;
  type: ExerciseType;
  exercises: Exercise[];
}

export interface DailyWorkout {
  dayNumber: number;
  weekNumber: number;
  title: string;
  durationMinutes: number;
  blocks: WorkoutBlock[];
  cardioOption: {
    outdoor: string;
    indoor: string;
    notes: string;
  };
}

export interface UserProgress {
  currentDay: number;
  completedDays: number[]; // Array of completed dayNumbers
  painLog: {
    [date: string]: {
      backPain: number; // 0-10
      kneePain: number; // 0-10
      notes: string;
      dayNumber: number;
    };
  };
  streak: number;
}

export type ViewState = 'dashboard' | 'workout' | 'nutrition' | 'profile';