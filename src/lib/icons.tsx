import React from 'react'

interface IconProps { size?: number; color?: string; strokeWidth?: number; className?: string }
const d = (size=24, color='currentColor', sw=1.8) => ({ width:size, height:size, viewBox:'0 0 24 24', fill:'none', stroke:color, strokeWidth:sw, strokeLinecap:'round' as const, strokeLinejoin:'round' as const })

// ── Navigation Icons ─────────────────────────────────────
export const HomeIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
    <path d="M9 21V12h6v9"/>
  </svg>
)
export const NutritionIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M12 2C8 2 4 5.5 4 10c0 4 2.5 7.5 6 9v2h4v-2c3.5-1.5 6-5 6-9 0-4.5-4-8-8-8z"/>
    <path d="M12 6v4M10 8h4"/>
  </svg>
)
export const WorkoutIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M6.5 6.5v11M17.5 6.5v11M2 9.5h4M18 9.5h4M2 14.5h4M18 14.5h4"/>
  </svg>
)
export const SupplementIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M9 3h6l1 4H8L9 3zM7 7h10l1 12a1 1 0 01-1 1H7a1 1 0 01-1-1L7 7z"/>
    <path d="M12 11v6M9.5 14h5"/>
  </svg>
)
export const ProfileIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
)
export const WeightIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M6 7c0-2.2 2.7-4 6-4s6 1.8 6 4"/>
    <path d="M6 7l-2 14h16L18 7"/>
    <path d="M9 11h6M9 15h6"/>
  </svg>
)

// ── Feature Icons ────────────────────────────────────────
export const FireIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M12 2c0 0-4 4-4 8.5S10.5 17 12 17s4-2.5 4-6.5c0-1.5-.5-3-1.5-4 0 0 0 2-1.5 3-1 .7-2 .3-2.5-.5C10 8 12 2 12 2z"/>
    <path d="M12 17c-2.2 0-4 1.3-4 3h8c0-1.7-1.8-3-4-3z"/>
  </svg>
)
export const DropletIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M12 2l7 10a7 7 0 11-14 0L12 2z"/>
  </svg>
)
export const ChartBarIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <rect x="3" y="12" width="4" height="9" rx="1"/>
    <rect x="10" y="7" width="4" height="14" rx="1"/>
    <rect x="17" y="3" width="4" height="18" rx="1"/>
  </svg>
)
export const ChartLineIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <polyline points="3 17 8 12 13 14 21 6"/>
    <path d="M3 21h18"/>
  </svg>
)
export const TargetIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <circle cx="12" cy="12" r="9"/>
    <circle cx="12" cy="12" r="5"/>
    <circle cx="12" cy="12" r="1" fill={color}/>
  </svg>
)
export const BoltIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="none"/>
  </svg>
)
export const TrophyIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M6 2h12v8a6 6 0 01-12 0V2z"/>
    <path d="M6 5H3a2 2 0 000 4h3M18 5h3a2 2 0 010 4h-3"/>
    <path d="M9 17v2M15 17v2M7 21h10"/>
    <line x1="12" y1="14" x2="12" y2="17"/>
  </svg>
)
export const CalendarIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <path d="M16 2v4M8 2v4M3 10h18"/>
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
  </svg>
)
export const ClockIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 7v5l3 3"/>
  </svg>
)
export const BellIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M18 8a6 6 0 00-12 0c0 5-3 7-3 7h18s-3-2-3-7"/>
    <path d="M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
)
export const SearchIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <circle cx="11" cy="11" r="7"/>
    <path d="M21 21l-4.35-4.35"/>
  </svg>
)
export const PlusIcon = ({size=24,color='currentColor',strokeWidth=2}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M12 5v14M5 12h14"/>
  </svg>
)
export const CheckIcon = ({size=24,color='currentColor',strokeWidth=2.5}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
export const ChevronRightIcon = ({size=24,color='currentColor',strokeWidth=2}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)
export const ChevronLeftIcon = ({size=24,color='currentColor',strokeWidth=2}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)
export const ChevronDownIcon = ({size=24,color='currentColor',strokeWidth=2}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)
export const CloseIcon = ({size=24,color='currentColor',strokeWidth=2}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
export const BackIcon = ({size=24,color='currentColor',strokeWidth=2.5}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)
export const EditIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
export const DeleteIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
)
export const SettingsIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
  </svg>
)
export const LockIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
)
export const LogoutIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
  </svg>
)
export const CameraIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
)
export const MuscleIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M12 2C9 2 7 4 7 7s2 5 5 5 5-2 5-5-2-5-5-5z"/>
    <path d="M7 12c-3 1-5 3.5-5 6.5V21h20v-2.5c0-3-2-5.5-5-6.5"/>
    <path d="M9 12v9M15 12v9"/>
  </svg>
)
export const BodyIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <circle cx="12" cy="4" r="2"/>
    <path d="M12 6v8M8 8l4 2 4-2M9 21l3-7 3 7"/>
    <path d="M7 14l2-4M17 14l-2-4"/>
  </svg>
)
export const FoodIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M3 11l19-9-9 19-2-8-8-2z"/>
  </svg>
)
export const ScaleIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M12 3v5M3 8h18M5 8l2 10h10L19 8"/>
    <path d="M9 8C9 5.8 10.3 4 12 4s3 1.8 3 4"/>
  </svg>
)
export const HeartIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>
)
export const AppleIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M12 3c.5-1 2-2 4-1M8.5 4C5 5 3 8 3 11.5 3 17 6.5 21 9 21c1 0 2-.5 3-1 1 .5 2 1 3 1 2.5 0 6-4 6-9.5A7 7 0 0015 4c-1.5 0-2.5.5-3 1"/>
  </svg>
)
export const RunIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <circle cx="13" cy="4" r="2"/>
    <path d="M7 21l4-8 3 3 3-5 4 10"/>
    <path d="M3 11l4-2 3 3 3-4"/>
  </svg>
)
export const MoonIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
  </svg>
)
export const SunIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
)
export const AutoIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 3v9l6 3"/>
  </svg>
)
export const ShareIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
    <polyline points="16 6 12 2 8 6"/>
    <line x1="12" y1="2" x2="12" y2="15"/>
  </svg>
)
export const InfoIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <circle cx="12" cy="12" r="9"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)
export const StarIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)
export const MeasureIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M2 12h20M2 12l4-4M2 12l4 4M22 12l-4-4M22 12l-4 4"/>
    <path d="M8 8v8M12 6v12M16 8v8"/>
  </svg>
)
export const WaterIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M12 2C12 2 5 9.5 5 14a7 7 0 0014 0C19 9.5 12 2 12 2z"/>
    <path d="M12 14c0 1.7-1.3 3-3 3" strokeOpacity="0.5"/>
  </svg>
)
export const BMIIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M3 18c0-7 4-13 9-13s9 6 9 13"/>
    <path d="M3 18h18M12 18V9M8 18l4-6 4 6"/>
  </svg>
)
export const CalcIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <rect x="4" y="2" width="16" height="20" rx="2"/>
    <path d="M8 6h8M8 10h8M8 14h4M8 18h2"/>
  </svg>
)
export const MealPlanIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M14.5 4h-5L7 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2h-3l-2.5-3z"/>
    <circle cx="12" cy="13" r="3"/>
  </svg>
)
export const AIIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/>
  </svg>
)
export const HistoryIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M3 12a9 9 0 109-9 9 9 0 00-9 9"/>
    <polyline points="3 12 7 8 3 4"/>
    <path d="M12 7v5l3 3"/>
  </svg>
)
export const TemplateIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="8" y1="13" x2="16" y2="13"/>
    <line x1="8" y1="17" x2="16" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
)
export const ExercisesIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v4M10 1v4M14 1v4"/>
  </svg>
)
export const StreakIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z" fill="none"/>
  </svg>
)
export const ProteinIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M20.24 12.24a6 6 0 00-8.49-8.49L5 10.5V19h8.5l6.74-6.76zM16 8L2 22M17.5 15H9"/>
  </svg>
)
