import React, { useState, useEffect, useMemo } from 'react';
import { UserProgress, DailyWorkout, Exercise } from '../types';
import { getWorkoutForDay } from '../services/programData';
import { markDayComplete } from '../services/storage';
import { CheckCircle, Circle, Clock, Info, ArrowLeft, Sun, CloudRain, Video, ChevronDown, ChevronUp, PlayCircle, ExternalLink, X } from 'lucide-react';

interface WorkoutPlayerProps {
  progress: UserProgress;
  onComplete: (newProgress: UserProgress) => void;
  onExit: () => void;
}

// Reusable Pain Input Component
const PainLevelInput = ({ 
  label, 
  value, 
  onChange 
}: { 
  label: string; 
  value: number; 
  onChange: (val: number) => void; 
}) => {
  
  const getDescriptor = (v: number) => {
    if (v === 0) return { text: "No Pain", color: "text-green-600", bg: "bg-green-500" };
    if (v <= 3) return { text: "Mild Discomfort", color: "text-lime-600", bg: "bg-lime-500" };
    if (v <= 5) return { text: "Moderate Pain", color: "text-yellow-600", bg: "bg-yellow-500" };
    if (v <= 7) return { text: "Significant Pain", color: "text-orange-600", bg: "bg-orange-500" };
    if (v <= 9) return { text: "Severe Pain", color: "text-red-600", bg: "bg-red-500" };
    return { text: "Worst Possible", color: "text-red-800", bg: "bg-red-700" };
  };

  const descriptor = getDescriptor(value);

  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
      <div className="flex justify-between items-center mb-3">
        <label className="font-bold text-slate-700">{label}</label>
        <div className="flex items-center">
          <input 
            type="number" 
            min="0" 
            max="10" 
            value={value}
            onChange={(e) => {
              const val = Math.min(10, Math.max(0, parseInt(e.target.value) || 0));
              onChange(val);
            }}
            className="w-16 p-2 text-center font-bold text-lg border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
          />
          <span className="text-slate-400 text-xs ml-2 font-medium">/ 10</span>
        </div>
      </div>
      
      <input 
        type="range" 
        min="0" 
        max="10" 
        step="1"
        value={value} 
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-4 rounded-lg appearance-none cursor-pointer mb-2"
        style={{
          background: `linear-gradient(to right, #22c55e 0%, #eab308 50%, #ef4444 100%)`
        }}
      />
      
      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-400 font-medium">0</span>
        <span className={`text-sm font-bold ${descriptor.color} transition-colors duration-300`}>
          {descriptor.text}
        </span>
        <span className="text-xs text-slate-400 font-medium">10</span>
      </div>
    </div>
  );
};

const WorkoutPlayer: React.FC<WorkoutPlayerProps> = ({ progress, onComplete, onExit }) => {
  // Memoize workout generation so it doesn't run on every render (which resets the internal state)
  const workout = useMemo(() => getWorkoutForDay(progress.currentDay), [progress.currentDay]);
  
  // State for per-set tracking: Record<ExerciseID, Array<boolean>>
  const [setsStatus, setSetsStatus] = useState<Record<string, boolean[]>>({});
  
  const [backPain, setBackPain] = useState(0);
  const [kneePain, setKneePain] = useState(0);
  const [notes, setNotes] = useState("");
  const [finished, setFinished] = useState(false);
  
  // State for active video
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  // Initialize sets status on mount
  useEffect(() => {
    const initialStatus: Record<string, boolean[]> = {};
    workout.blocks.forEach(block => {
      block.exercises.forEach(ex => {
        initialStatus[ex.id] = new Array(ex.sets || 1).fill(false);
      });
    });
    setSetsStatus(initialStatus);
  }, [workout]);

  const toggleSet = (exerciseId: string, setIndex: number) => {
    setSetsStatus(prev => {
      const currentSets = [...(prev[exerciseId] || [])];
      currentSets[setIndex] = !currentSets[setIndex];
      return { ...prev, [exerciseId]: currentSets };
    });
  };

  const isExerciseComplete = (exId: string) => {
    const statuses = setsStatus[exId];
    return statuses && statuses.every(s => s === true);
  };

  const handleFinish = () => {
    if (backPain > 5 || kneePain > 5) {
      alert("Warning: Your pain level is high. The system will recommend a regression next session.");
    }
    const newProgress = markDayComplete(progress.currentDay, backPain, kneePain, notes);
    onComplete(newProgress);
    onExit();
  };

  const getYouTubeThumbnail = (url: string) => {
    try {
      // Handle both standard and nocookie URLs
      // Format 1: https://www.youtube.com/embed/VIDEO_ID?params
      let videoId = "";
      if (url.includes('/embed/')) {
        videoId = url.split('/embed/')[1]?.split('?')[0];
      }
      
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  if (finished) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
          <div className="text-center mb-8">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4 animate-in zoom-in duration-300" />
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Session Complete!</h2>
            <p className="text-slate-500">Great work, Eoin. Log your status to track recovery.</p>
          </div>
          
          <div className="space-y-6">
            <PainLevelInput 
              label="Back Pain Level" 
              value={backPain} 
              onChange={setBackPain} 
            />

            <PainLevelInput 
              label="Knee Pain Level" 
              value={kneePain} 
              onChange={setKneePain} 
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Session Notes</label>
              <textarea 
                className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none text-slate-700"
                placeholder="How did the hinge movements feel today? Any discomfort?"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button 
              onClick={handleFinish}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-[0.98]"
            >
              Save & Finish
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <button onClick={onExit} className="flex items-center text-slate-500 hover:text-slate-800">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
      </button>

      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">{workout.title}</h1>
        <div className="flex items-center text-slate-500 mt-2 text-sm space-x-4">
          <span className="flex items-center"><Clock className="w-4 h-4 mr-1"/> {workout.durationMinutes} min</span>
          <span className="bg-primary-50 text-primary-700 px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide">
             Week {workout.weekNumber}
          </span>
        </div>
      </div>

      {/* Exercise Blocks */}
      <div className="space-y-6">
        {workout.blocks.map((block, bIdx) => (
          <div key={bIdx} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className={`p-4 border-b border-slate-100 flex justify-between items-center ${
              block.type.includes('rehab') ? 'bg-teal-50' : 
              block.type === 'warmup' ? 'bg-orange-50' : 'bg-white'
            }`}>
              <h3 className="font-bold text-slate-800">{block.title}</h3>
              <span className="text-xs font-medium text-slate-400 uppercase">{block.type.replace('-', ' ')}</span>
            </div>
            <div className="divide-y divide-slate-100">
              {block.exercises.map((ex) => {
                const isComplete = isExerciseComplete(ex.id);
                const isActiveVideo = activeVideoId === ex.id;
                const thumbnailUrl = ex.videoUrl ? getYouTubeThumbnail(ex.videoUrl) : null;
                
                return (
                  <div 
                    key={ex.id} 
                    className={`p-4 transition-colors flex flex-col ${isComplete ? 'bg-green-50/50' : ''}`}
                  >
                    {/* Header Row: Name & Video Thumbnail */}
                    <div className="flex justify-between items-start mb-2 gap-3">
                      <div className="flex items-start flex-1">
                         {/* Visual indicator of completion */}
                         <div className={`mt-1 mr-3 ${isComplete ? 'text-green-500' : 'text-slate-300'}`}>
                           {isComplete ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                         </div>
                         <div>
                            <h4 className={`font-bold text-lg text-slate-900 ${isComplete ? 'line-through text-slate-400' : ''}`}>
                              {ex.name}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              {ex.reps && <span className="text-xs font-medium bg-slate-100 px-2 py-0.5 rounded text-slate-600">Reps: {ex.reps}</span>}
                              {ex.tempo && <span className="text-xs text-slate-400">Tempo: {ex.tempo}</span>}
                            </div>
                            
                            {/* Notes moved here for better flow with thumbnail */}
                            {ex.notes && (
                              <p className="text-sm text-slate-500 mt-2 italic max-w-md">
                                {ex.notes}
                              </p>
                            )}
                         </div>
                      </div>

                      {ex.videoUrl && thumbnailUrl && (
                        <button 
                          onClick={() => setActiveVideoId(isActiveVideo ? null : ex.id)}
                          className="relative group flex-shrink-0 w-32 h-20 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all"
                          title={isActiveVideo ? "Close Video" : "Watch Demo"}
                        >
                          <img 
                            src={thumbnailUrl} 
                            alt={ex.name} 
                            className={`w-full h-full object-cover transition-opacity ${isActiveVideo ? 'opacity-50' : 'opacity-100 group-hover:opacity-90'}`}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className={`rounded-full p-1.5 backdrop-blur-sm ${isActiveVideo ? 'bg-slate-900/70' : 'bg-black/40 group-hover:bg-primary-600/80'} transition-colors`}>
                              {isActiveVideo ? (
                                <X className="w-5 h-5 text-white" />
                              ) : (
                                <PlayCircle className="w-8 h-8 text-white" />
                              )}
                            </div>
                          </div>
                          <span className="absolute bottom-1 right-1 text-[10px] font-bold text-white bg-black/50 px-1 rounded backdrop-blur-sm">
                            VIDEO
                          </span>
                        </button>
                      )}
                    </div>
                    
                    {/* Video Player Area - Rendered directly inline if active */}
                    {isActiveVideo && ex.videoUrl && (
                       <div className="mb-6 mt-2 ml-0 md:ml-9 rounded-xl overflow-hidden bg-slate-900 shadow-xl border border-slate-200 animate-in fade-in slide-in-from-top-2 duration-300 relative w-full md:w-[500px] mx-auto">
                         {/* Aspect Ratio 16:9 for Standard Videos */}
                         <div className="relative aspect-video bg-black">
                           <iframe
                             src={ex.videoUrl}
                             className="absolute top-0 left-0 w-full h-full"
                             title={ex.name}
                             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                             allowFullScreen
                             referrerPolicy="strict-origin-when-cross-origin"
                           />
                         </div>
                         <div className="bg-slate-900 p-2 flex justify-end">
                            <a 
                              href={ex.videoUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-slate-400 hover:text-white flex items-center"
                            >
                              Video not playing? Open in YouTube <ExternalLink className="w-3 h-3 ml-1"/>
                            </a>
                         </div>
                       </div>
                    )}

                    {/* Set Tracker Bubbles */}
                    <div className="ml-9 mt-4">
                       <span className="text-xs font-bold text-slate-400 uppercase mb-2 block tracking-wider">Sets</span>
                       <div className="flex flex-wrap gap-3">
                        {setsStatus[ex.id]?.map((done, idx) => (
                          <button
                            key={idx}
                            onClick={() => toggleSet(ex.id, idx)}
                            className={`
                              w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-2 transition-all duration-200 outline-none
                              ${done 
                                ? 'bg-primary-500 border-primary-500 text-white shadow-lg scale-105 ring-2 ring-primary-200 ring-offset-1' 
                                : 'bg-white border-slate-300 text-slate-300 hover:border-primary-300 hover:text-primary-300'
                              }
                            `}
                          >
                            {done ? <CheckCircle size={20}/> : idx + 1}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 md:relative md:border-none md:bg-transparent md:p-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-none">
        <button 
          onClick={() => setFinished(true)}
          className="w-full md:w-auto bg-slate-900 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center md:ml-auto"
        >
          Complete Session
        </button>
      </div>
    </div>
  );
};

export default WorkoutPlayer;