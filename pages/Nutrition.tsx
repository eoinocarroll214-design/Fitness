import React, { useState, useEffect, useRef } from 'react';
import { Scan, Trash2, CheckCircle2, X } from 'lucide-react';

// Define a type for logged meals
interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  timestamp: string;
}

// Mock database for Fitt Meals (simulated QR codes)
// In a real app, this would be an API call
const FITT_MEALS_DB: Record<string, { name: string; calories: number; protein: number }> = {
  "default": { name: "Standard Fitt Chicken & Rice", calories: 450, protein: 40 },
  "fitt-001": { name: "Lean Beef Bowl", calories: 520, protein: 45 },
  "fitt-002": { name: "Salmon & Quinoa", calories: 480, protein: 35 },
  "fitt-003": { name: "Vegan Power Bowl", calories: 400, protein: 25 },
  "fitt-004": { name: "Chicken Pesto Pasta", calories: 600, protein: 42 },
  "fitt-005": { name: "Turkey Meatballs & Zoodles", calories: 350, protein: 38 },
};

export default function Nutrition() {
  const [isScanning, setIsScanning] = useState(false);
  const [todaysMeals, setTodaysMeals] = useState<Meal[]>([]);
  
  // Use a ref to hold the scanner instance to manage cleanup reliably
  const scannerRef = useRef<any>(null);

  // Initialize Scanner when isScanning becomes true
  useEffect(() => {
    if (!isScanning) return;

    // Flag to prevent starting if component unmounts quickly
    let isMounted = true;
    const elementId = "reader";

    const startScanner = async () => {
      // Small delay to ensure the modal DOM element is rendered
      await new Promise(r => setTimeout(r, 100));
      
      if (!isMounted) return;
      if (!document.getElementById(elementId)) {
        console.error("Scanner element not found");
        return;
      }

      try {
        // @ts-ignore
        if (!window.Html5Qrcode) {
          alert("Scanner library not loaded. Please refresh.");
          setIsScanning(false);
          return;
        }

        // @ts-ignore
        const html5QrCode = new window.Html5Qrcode(elementId);
        scannerRef.current = html5QrCode;

        // Start the camera directly
        await html5QrCode.start(
          { facingMode: "environment" }, // Prefer back camera
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText: string) => {
            // Success callback
            if (isMounted) {
              handleScanSuccess(decodedText);
            }
          },
          (errorMessage: any) => {
            // Ignore frame parse errors (common while scanning)
          }
        );
      } catch (err) {
        console.error("Error starting scanner:", err);
        if (isMounted) {
          alert("Failed to start camera. Please ensure camera permissions are allowed.");
          setIsScanning(false);
        }
      }
    };

    startScanner();

    // Cleanup function
    return () => {
      isMounted = false;
      if (scannerRef.current) {
        // Stop the scanner. Catch errors if it's already stopped or element is gone.
        scannerRef.current.stop().then(() => {
          scannerRef.current.clear();
        }).catch((err: any) => {
          console.warn("Scanner stop/clear warning:", err);
        });
        scannerRef.current = null;
      }
    };
  }, [isScanning]);

  const handleScanSuccess = (decodedText: string) => {
    // Lookup the meal
    const lookupKey = decodedText.toLowerCase();
    const foundMeal = FITT_MEALS_DB[lookupKey] || FITT_MEALS_DB[decodedText] || FITT_MEALS_DB["default"];
    
    // Create new meal entry
    const newMeal: Meal = {
      id: Math.random().toString(36).substr(2, 9),
      name: foundMeal.name,
      calories: foundMeal.calories,
      protein: foundMeal.protein,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setTodaysMeals(prev => [newMeal, ...prev]);
    
    // Close scanner - this triggers the useEffect cleanup
    setIsScanning(false);
  };

  const removeMeal = (id: string) => {
    setTodaysMeals(prev => prev.filter(m => m.id !== id));
  };

  const totalCalories = todaysMeals.reduce((acc, m) => acc + m.calories, 0);
  const totalProtein = todaysMeals.reduce((acc, m) => acc + m.protein, 0);

  return (
    <div className="space-y-6">
      
      {/* Scanner Modal Overlay */}
      {isScanning && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl overflow-hidden w-full max-w-md relative flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <h3 className="font-bold flex items-center"><Scan className="w-5 h-5 mr-2"/> Scan QR Code</h3>
              <button 
                onClick={() => setIsScanning(false)} 
                className="p-1 hover:bg-slate-700 rounded transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="bg-black flex-1 flex items-center justify-center relative min-h-[350px]">
               {/* The reader div where the camera feed renders */}
              <div id="reader" className="w-full h-full"></div>
            </div>
            
            <div className="p-4 bg-white text-center border-t border-slate-100 shrink-0">
              <p className="text-sm text-slate-600 font-medium">Point camera at your Fitt Meal label</p>
              <p className="text-xs text-slate-400 mt-1">Try codes: "fitt-001", "fitt-002"</p>
            </div>
          </div>
        </div>
      )}

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Nutrition Tracker</h2>
            <p className="text-slate-600 text-sm mb-6">
              Log your Fitt meals to ensure optimal recovery.
            </p>
            
            <button 
              onClick={() => setIsScanning(true)}
              className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold flex items-center justify-center hover:bg-slate-800 transition-colors shadow-lg active:scale-[0.98]"
            >
              <Scan className="w-5 h-5 mr-2" />
              Scan Fitt Meal
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-center">
          <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-2">
            <span className="text-slate-500 font-medium">Daily Calories</span>
            <span className="text-2xl font-bold text-slate-900">{totalCalories} <span className="text-sm text-slate-400 font-normal">/ 2400</span></span>
          </div>
          <div className="flex justify-between items-center">
             <span className="text-slate-500 font-medium">Protein</span>
             <span className="text-2xl font-bold text-primary-600">{totalProtein}g <span className="text-sm text-slate-400 font-normal">/ 180g</span></span>
          </div>
        </div>
      </div>

      {/* Meals List */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden min-h-[200px]">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Today's Meals</h3>
          <span className="text-xs font-medium bg-white px-2 py-1 rounded border border-slate-200 text-slate-500">
            {todaysMeals.length} Entries
          </span>
        </div>
        
        {todaysMeals.length === 0 ? (
          <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center h-full">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mb-3">
              <Scan className="w-8 h-8 text-slate-300" />
            </div>
            <p>No meals scanned yet today.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {todaysMeals.map((meal) => (
              <div key={meal.id} className="p-4 flex justify-between items-center group hover:bg-slate-50 transition-colors animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-start">
                  <div className="mt-1 mr-3 text-green-500">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm md:text-base">{meal.name}</h4>
                    <div className="text-xs text-slate-500 mt-1 flex space-x-3">
                      <span>{meal.calories} kcal</span>
                      <span>•</span>
                      <span>{meal.protein}g protein</span>
                      <span>•</span>
                      <span>{meal.timestamp}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => removeMeal(meal.id)}
                  className="text-slate-300 hover:text-red-500 p-2 transition-colors rounded-full hover:bg-red-50"
                  title="Remove meal"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Guidelines Section */}
      <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 mt-6">
        <h3 className="font-bold text-blue-900 mb-3">General Guidelines</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
          <ul className="space-y-2">
            <li>• <strong>Breakfast:</strong> Oats w/ Chia & Whey</li>
            <li>• <strong>Lunch:</strong> Chicken/Fish + Salad + Sweet Potato</li>
          </ul>
           <ul className="space-y-2">
            <li>• <strong>Snack:</strong> Greek Yogurt + Walnuts</li>
            <li>• <strong>Dinner:</strong> Lean Beef/Salmon + Quinoa</li>
          </ul>
        </div>
         <div className="mt-4 pt-4 border-t border-blue-200">
             <div className="flex justify-between items-center text-blue-900 font-bold">
               <span>Hydration Goal (Abu Dhabi)</span>
               <span>3 - 4 Liters / Day</span>
             </div>
         </div>
      </div>
    </div>
  );
}