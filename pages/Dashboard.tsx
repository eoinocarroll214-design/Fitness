import React, { useState } from 'react';
import { UserProgress, ViewState } from '../types';
import { getWorkoutForDay } from '../services/programData';
import { deleteWorkoutLog, updateWorkoutLog } from '../services/storage';
import { Play, TrendingUp, Calendar, AlertCircle, History, Edit2, Trash2, X, Save } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';

interface DashboardProps {
  progress: UserProgress;
  onChangeView: (view: ViewState) => void;
}

// Extending Props to include onUpdate for the parent to refresh state
interface ExtendedDashboardProps extends DashboardProps {
  onUpdate?: (newProgress: UserProgress) => void;
}

const getPainDescriptor = (val: number) => {
  if (val === 0) return 'None';
  if (val <= 3) return 'Mild';
  if (val <= 6) return 'Moderate';
  if (val <= 8) return 'High';
  return 'Severe';
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-sm">
        <p className="font-bold text-slate-700 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1" style={{ color: entry.color }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
            <span className="font-medium">{entry.name}:</span>
            <span>{entry.value} ({getPainDescriptor(entry.value)})</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Edit Modal Component
const EditLogModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData, 
  dateStr 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (date: string, data: { backPain: number; kneePain: number; notes: string }) => void;
  initialData: { backPain: number; kneePain: number; notes: string };
  dateStr: string;
}) => {
  const [backPain, setBackPain] = useState(initialData.backPain);
  const [kneePain, setKneePain] = useState(initialData.kneePain);
  const [notes, setNotes] = useState(initialData.notes);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">Edit Log: {dateStr}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-slate-600"/></button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Back Pain (0-10)</label>
            <input 
              type="number" min="0" max="10" 
              value={backPain} 
              onChange={(e) => setBackPain(Number(e.target.value))}
              className="w-full p-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Knee Pain (0-10)</label>
            <input 
              type="number" min="0" max="10" 
              value={kneePain} 
              onChange={(e) => setKneePain(Number(e.target.value))}
              className="w-full p-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg h-24"
            />
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
          <button 
            onClick={() => {
              onSave(dateStr, { backPain, kneePain, notes });
              onClose();
            }}
            className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center"
          >
            <Save className="w-4 h-4 mr-2" /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<ExtendedDashboardProps> = ({ progress, onChangeView, onUpdate }) => {
  const nextWorkout = getWorkoutForDay(progress.currentDay);
  
  // State for editing
  const [editingLog, setEditingLog] = useState<{date: string, data: any} | null>(null);

  const handleDelete = (date: string) => {
    if (window.confirm("Are you sure you want to delete this workout log? This will revert your progress for that day.")) {
      const newProgress = deleteWorkoutLog(date);
      if (onUpdate) onUpdate(newProgress);
      else window.location.reload(); // Fallback if onUpdate not provided
    }
  };

  const handleUpdate = (date: string, data: { backPain: number; kneePain: number; notes: string }) => {
    const newProgress = updateWorkoutLog(date, data);
    if (onUpdate) onUpdate(newProgress);
    else window.location.reload();
  };
  
  // Format data for chart
  const chartData = Object.entries(progress.painLog)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .slice(-14) // Show last 2 weeks
    .map(([date, log]) => ({
      name: new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' }),
      back: log.backPain,
      knee: log.kneePain,
    }));

  if (chartData.length === 0) {
    chartData.push({ name: 'Start', back: 0, knee: 0 });
  }

  const lastEntry = chartData[chartData.length - 1];
  const currentStatus = Math.max(lastEntry.back, lastEntry.knee) > 4 ? 'Monitor' : 'Stable';
  const statusColor = currentStatus === 'Monitor' ? 'text-amber-600' : 'text-green-600';

  // History List Data
  const historyList = Object.entries(progress.painLog)
    .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()); // Newest first

  return (
    <div className="space-y-6">
      {/* Edit Modal */}
      {editingLog && (
        <EditLogModal 
          isOpen={!!editingLog}
          dateStr={editingLog.date}
          initialData={editingLog.data}
          onClose={() => setEditingLog(null)}
          onSave={handleUpdate}
        />
      )}

      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Welcome Back, Eoin</h2>
          <p className="text-slate-500 mt-1">Day {progress.currentDay} of 42 • Phase 1: Stability & Activation</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center text-slate-500 mb-2">
            <TrendingUp className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Current Streak</span>
          </div>
          <div className="text-3xl font-bold text-slate-900">{progress.streak} <span className="text-base font-normal text-slate-400">days</span></div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
           <div className="flex items-center text-slate-500 mb-2">
            <Calendar className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Completion</span>
          </div>
          <div className="text-3xl font-bold text-slate-900">{Math.round((progress.completedDays.length / 42) * 100)}%</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
           <div className="flex items-center text-slate-500 mb-2">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Status</span>
          </div>
          <div className={`text-lg font-medium ${statusColor}`}>{currentStatus}</div>
          <p className="text-xs text-slate-400 mt-1">Back: {lastEntry.back}/10 • Knee: {lastEntry.knee}/10</p>
        </div>
      </div>

      {/* Main Action Card */}
      <div className="bg-gradient-to-r from-primary-900 to-primary-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <DumbbellIcon size={120} />
        </div>
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-medium mb-3 backdrop-blur-sm">
            Ready for Today?
          </span>
          <h3 className="text-2xl font-bold mb-2">{nextWorkout.title}</h3>
          <p className="text-primary-100 mb-6 max-w-lg">
            {nextWorkout.durationMinutes} mins • {nextWorkout.blocks.length} Blocks • Focus: {nextWorkout.blocks.find(b => b.type === 'strength')?.title || 'Recovery'}
          </p>
          <button 
            onClick={() => onChangeView('workout')}
            className="bg-white text-primary-900 px-6 py-3 rounded-lg font-bold flex items-center hover:bg-slate-50 transition-colors shadow-md"
          >
            <Play className="w-5 h-5 mr-2 fill-current" />
            Start Workout
          </button>
        </div>
      </div>

      {/* Pain Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h4 className="font-bold text-slate-800">Pain Trend (Last 14 Days)</h4>
          <div className="flex items-center gap-3 text-xs font-medium">
             <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span> Back</div>
             <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-amber-500 mr-1"></span> Knee</div>
          </div>
        </div>
        
        <div className="h-64 w-full">
           <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 11, fill: '#64748b'}} 
                dy={10}
              />
              <YAxis 
                domain={[0, 10]} 
                axisLine={false} 
                tickLine={false} 
                tickCount={6}
                tick={{fontSize: 11, fill: '#64748b'}}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={5} stroke="#cbd5e1" strokeDasharray="3 3" label={{ value: 'Warning Threshold', position: 'insideBottomRight', fontSize: 10, fill: '#94a3b8' }} />
              
              <Line 
                type="monotone" 
                dataKey="back" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} 
                activeDot={{ r: 6 }} 
              />
              <Line 
                type="monotone" 
                dataKey="knee" 
                stroke="#f59e0b" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} 
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-1 text-center text-xs text-white font-bold h-6 rounded-md overflow-hidden">
           <div className="bg-green-500 flex items-center justify-center">0-3 Mild</div>
           <div className="bg-yellow-400 flex items-center justify-center">4-5 Moderate</div>
           <div className="bg-orange-500 flex items-center justify-center">6-7 High</div>
           <div className="bg-red-500 flex items-center justify-center">8-10 Severe</div>
        </div>
      </div>

      {/* Workout History */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
           <h4 className="font-bold text-slate-800 flex items-center">
             <History className="w-5 h-5 mr-2 text-slate-400" />
             Workout History
           </h4>
        </div>
        
        {historyList.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No workouts logged yet. Complete your first session to see it here.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            <div className="grid grid-cols-12 bg-slate-50 p-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
               <div className="col-span-3">Date</div>
               <div className="col-span-4">Session</div>
               <div className="col-span-3">Pain (Back/Knee)</div>
               <div className="col-span-2 text-right">Actions</div>
            </div>
            {historyList.map(([date, entry]) => (
              <div key={date} className="grid grid-cols-12 p-4 items-center hover:bg-slate-50 transition-colors">
                 <div className="col-span-3 text-sm font-medium text-slate-900">
                    {new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                 </div>
                 <div className="col-span-4 text-sm text-slate-600">
                    Day {entry.dayNumber || '?'}
                 </div>
                 <div className="col-span-3 flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${entry.backPain > 4 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>B: {entry.backPain}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${entry.kneePain > 4 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>K: {entry.kneePain}</span>
                 </div>
                 <div className="col-span-2 flex justify-end space-x-2">
                    <button 
                      onClick={() => setEditingLog({ date, data: entry })}
                      className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                      title="Edit Log"
                    >
                       <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(date)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete Log"
                    >
                       <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
                 {entry.notes && (
                   <div className="col-span-12 mt-2 text-xs text-slate-400 italic pl-2 border-l-2 border-slate-200">
                     "{entry.notes}"
                   </div>
                 )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

// Simple Icon component
const DumbbellIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 6.5h11" />
    <path d="M6.5 17.5h11" />
    <path d="M6.5 6.5 4 9 6.5 11.5" />
    <path d="M17.5 6.5 20 9 17.5 11.5" />
    <path d="M6.5 17.5 4 15 6.5 12.5" />
    <path d="M17.5 17.5 20 15 17.5 12.5" />
    <path d="M6.5 11.5h11" />
    <path d="M6.5 12.5h11" />
  </svg>
);

export default Dashboard;