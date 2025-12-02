import { DailyWorkout, Exercise, WorkoutBlock } from '../types';

// Helper to get current origin safely
const getOrigin = () => {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }
  return '';
};

// Helper to create exercises with optional video and start time
const createEx = (name: string, type: any, sets: number, reps: string, notes: string = "", videoId?: string, startTime: number = 0): Exercise => {
  // Construct the secure embed URL with origin to prevent Error 153
  let videoUrl: string | undefined = undefined;
  if (videoId) {
    // origin must be the exact domain, not encoded in some cases depending on the browser, but mostly encoded.
    // However, for React apps, usually window.location.origin is sufficient.
    const origin = getOrigin(); 
    videoUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&controls=1&start=${startTime}&enablejsapi=1&origin=${origin}`;
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    name,
    type,
    sets,
    reps,
    notes,
    completed: false,
    videoUrl
  };
};

// The McGill Big 3 - Daily Essentials
const mcGillBig3: Exercise[] = [
  createEx("McGill Curl Up", "rehab-back", 3, "10s hold x 6 reps", "Hands under lower back, one leg bent. Lift head slightly.", "S8VFbkSjCsQ", 0), // Core Strength (Verified)
  createEx("Side Plank (Knees)", "rehab-back", 3, "10s hold x 4 reps", "Focus on hinge from knees, keep spine neutral.", "ecgU1u0xST0", 0), // Stu McGill (Verified)
  createEx("Bird Dog", "rehab-back", 3, "10s hold x 6 reps", "Opposite arm/leg. Do not hyperextend back.", "S1QbyYZaXIg", 0) // McGill Big 3 (Verified)
];

const kneeRehabBasics: Exercise[] = [
  createEx("VMO Terminal Knee Extension", "rehab-knee", 2, "15 reps", "Lock out knee fully against band tension.", "nfJ5QCx_fSg", 0), // Physical Therapy Video (Verified)
  createEx("Clam Shells", "rehab-knee", 2, "15 reps/side", "Glute medius focus.", "DAAjOdwZdks", 0), // Clam Shell Video (Verified)
  createEx("Single Leg Balance", "rehab-knee", 2, "30s/side", "Soft knee, engage core.", "2BcSwcxN6Rk", 0) // Balance Training (Verified)
];

// Program Generator Logic
export const getWorkoutForDay = (day: number): DailyWorkout => {
  const week = Math.ceil(day / 7);
  const dayOfWeek = day % 7 === 0 ? 7 : day % 7; // 1 = Mon, 7 = Sun

  let title = "Rest & Recover";
  let blocks: WorkoutBlock[] = [];
  let duration = 30;
  
  // Default Cardio
  let cardio = {
    outdoor: "30 min Brisk Walk (Evening)",
    indoor: "20 min Elliptical (Low resistance)",
    notes: "Keep heart rate < 130bpm. Stop if knee pain > 3/10."
  };

  // Warmup is consistent
  const warmup: WorkoutBlock = {
    title: "Warm Up & Activation",
    type: "warmup",
    exercises: [
      createEx("Cat-Cow", "warmup", 2, "10 reps", "Move mostly through thoracic spine, gentle on lumbar.", "y_cKHKi9UaM", 0), // Well+Good (Verified from Doc)
      createEx("Glute Bridge (Two leg)", "warmup", 2, "15 reps", "Squeeze glutes at top, no back arch.", "vPBb5zzMBoc", 0), // AskDoctorJo (Verified)
      createEx("World's Greatest Stretch", "warmup", 1, "5/side", "Slow and controlled.", "-CiWQ2IvY34", 0) // Squat Univ (Verified)
    ]
  };

  const backRehabBlock: WorkoutBlock = {
    title: "Back Rehab (McGill Big 3)",
    type: "rehab-back",
    exercises: [...mcGillBig3]
  };

  const kneeRehabBlock: WorkoutBlock = {
    title: "Knee Stability & VMO",
    type: "rehab-knee",
    exercises: [...kneeRehabBasics]
  };

  // --- DAILY LOGIC ---

  if (dayOfWeek === 1) { // Monday: Upper Push
    title = `Week ${week} - Upper Push & Core`;
    duration = 50;
    blocks = [
      warmup,
      backRehabBlock,
      {
        title: "Strength: Push (Spine Neutral)",
        type: "strength",
        exercises: [
          createEx("Seated DB Shoulder Press", "strength", 3, "10-12", "Keep back firmly against bench. No arching.", "B-aVuyhvLHU", 0), // General Fitness (Verified)
          createEx("Incline DB Chest Press", "strength", 3, "10-12", "Control the descent (3s down).", "8iPEnn-ltC8", 0), // General Fitness (Verified)
          createEx("Cable Tricep Pushdowns", "strength", 3, "12-15", "Keep elbows tucked.", "2-LAMcpzODU", 0), // Scott Herman (Verified)
          createEx("Pallof Press (Iso Hold)", "core", 3, "20s hold", "Anti-rotation core work.", "DsVso3c92ZI", 0) // GuerrillaZen (Verified)
        ]
      },
      kneeRehabBlock
    ];
  } 
  else if (dayOfWeek === 2) { // Tuesday: Upper Pull
    title = `Week ${week} - Upper Pull & Posture`;
    duration = 50;
    blocks = [
      warmup,
      backRehabBlock,
      {
        title: "Strength: Pull (Hinge Supported)",
        type: "strength",
        exercises: [
          createEx("Chest Supported Row (Machine)", "strength", 3, "10-12", "Support chest fully to offload spine.", "0UBRfiO4zDs", 0), // Scott Herman
          createEx("Lat Pulldown (Neutral Grip)", "strength", 3, "10-12", "Pull to upper chest. Don't lean back.", "CAwf7n6Luuc", 0), // Scott Herman
          createEx("Face Pulls", "strength", 3, "15", "Focus on rear delts and posture.", "V8dZqdIe_sI", 0), // Scott Herman
          createEx("Dead Bug (Core)", "core", 3, "10 total", "Press lower back into floor hard.", "I5xbsA71v1A", 0) // Scott Herman
        ]
      },
      kneeRehabBlock
    ];
  }
  else if (dayOfWeek === 3) { // Wed: Active Recovery
    title = `Week ${week} - Active Recovery`;
    duration = 45;
    cardio = {
      outdoor: "45 min Walk or 20 min Swim",
      indoor: "30 min Recumbent Bike",
      notes: "Focus on movement quality. Swimming is excellent for spine decompression."
    };
    blocks = [
      warmup,
      backRehabBlock,
      {
        title: "Mobility Flow",
        type: "rehab-back",
        exercises: [
          createEx("Hip Flexor Stretch (Kneeling)", "rehab-back", 2, "30s/side", "Squeeze glute of kneeling leg.", "YQmpO9VT2X4", 0), // Scott Herman
          createEx("Thoracic Rotation", "rehab-back", 2, "10/side", "Open chest.", "L-o2W9F_F2s", 0), // Scott Herman
          createEx("Child's Pose", "rehab-back", 2, "1 min", "Gentle stretch.", "EqkQ594e9QM", 0) // Scott Herman
        ]
      }
    ];
  }
  else if (dayOfWeek === 4) { // Thu: Lower Body (Safe)
    title = `Week ${week} - Lower Body (Knee/Back Safe)`;
    duration = 60;
    blocks = [
      warmup,
      kneeRehabBlock,
      backRehabBlock,
      {
        title: "Leg Strength (No Axial Load)",
        type: "strength",
        exercises: [
          createEx("Glute Bridge (Weighted)", "strength", 3, "12", "DB on hips. Squeeze glutes.", "Jt478Ic8pLE", 0), // Scott Herman
          createEx("Seated Leg Curl", "strength", 3, "12-15", "Hamstring focus to protect ACL/Knee.", "OrxowW5nqaM", 0), // Scott Herman
          createEx("Leg Press", "strength", 3, "10-12", "Do NOT go deep. 90 degrees max. Protect lumbar.", "IZxyjW7MPJQ", 0), // Scott Herman
          createEx("Calf Raises (Seated)", "strength", 3, "15", "Full range.", "JbyjNymZOt0", 0) // Scott Herman
        ]
      }
    ];
  }
  else if (dayOfWeek === 5) { // Fri: Full Body / Accessory
    title = `Week ${week} - Full Body Tune-Up`;
    duration = 45;
    blocks = [
      warmup,
      backRehabBlock,
      {
        title: "Accessory Work",
        type: "strength",
        exercises: [
          createEx("DB Lateral Raises", "strength", 3, "15", "Strict form.", "3VcKaXpzqRo", 0), // Scott Herman
          createEx("Bicep Curls (Seated)", "strength", 3, "12", "Keep torso still.", "Efd2p10pTgw", 0), // Scott Herman
          createEx("Suitcase Carry", "core", 3, "30s/side", "Hold DB in one hand, walk keeping spine perfectly straight.", "BqvpnLLwWNc", 0), // Scott Herman
          createEx("Bird Dog", "core", 3, "10/side", "Perfect form focus.", "S1QbyYZaXIg", 0) // McGill Big 3
        ]
      }
    ];
  }
  else if (dayOfWeek === 6) { // Sat: Outdoor Challenge
    title = `Week ${week} - Outdoor Activity`;
    duration = 60;
    cardio = {
      outdoor: "Rucking (Weighted Walk)",
      indoor: "Incline Walking (Treadmill)",
      notes: "For Rucking: Use a backpack with 5-10kg max. Keep posture upright. Engaging core protects back."
    };
    blocks = [
      warmup,
      backRehabBlock,
      {
        title: "Outdoor Prep",
        type: "warmup",
        exercises: [
          createEx("Ankle Mobilization", "warmup", 2, "10 reps", "Knee over toe (gently).", "IikP_ScSjb4", 0), // Rehab Science
          createEx("Leg Swings", "warmup", 2, "10/side", "Controlled.", "lM8n7Y5_sxo", 0) // Scott Herman
        ]
      }
    ];
  }
  else { // Sun: Rest
    title = "Rest & Decompress";
    duration = 15;
    blocks = [
      {
        title: "Optional Decompression",
        type: "rehab-back",
        exercises: [
          createEx("90/90 Breathing", "rehab-back", 1, "5 mins", "Lie on back, legs up on chair/couch at 90 deg. Breathe deeply.", "9-3iK-jQ-Qk", 0), // E3 Rehab
          createEx("Gentle Walking", "cardio", 1, "20 mins", "Optional evening stroll.")
        ]
      }
    ];
  }

  return {
    dayNumber: day,
    weekNumber: week,
    title,
    durationMinutes: duration,
    blocks,
    cardioOption: cardio
  };
};