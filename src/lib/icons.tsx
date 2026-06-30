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
export const CouchIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <rect x="3" y="10" width="18" height="8" rx="2"/>
    <path d="M5 10V7a2 2 0 012-2h10a2 2 0 012 2v3"/>
    <path d="M7 18v2M17 18v2"/>
    <path d="M6 14h12"/>
  </svg>
)
export const WalkIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <circle cx="13" cy="5" r="2"/>
    <path d="M7 21l3-8 4 3 2-5 4 7"/>
    <path d="M3 11l4-2 3 3 3-4"/>
  </svg>
)
export const PlayIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M5 4v16l14-8-14-8z"/>
  </svg>
)
export const SproutIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M12 2c2 3 2 5 2 8 0 2.7-1.1 4.8-3 6.5"/>
    <path d="M8 7c-2 2-3 4.3-3 7 0 3.7 2.1 6 5 7"/>
    <path d="M16 7c2 2 3 4.3 3 7 0 3.7-2.1 6-5 7"/>
  </svg>
)
export const CircleIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <circle cx="12" cy="12" r="8"/>
    <path d="M12 4v16M4 12h16"/>
  </svg>
)
export const RulerIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M4 6h16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z"/>
    <path d="M7 9h10M7 13h6M7 17h4"/>
  </svg>
)
export const SunriseIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M4 18h16"/>
    <path d="M6 15a6 6 0 0112 0"/>
    <path d="M12 3v3M4.5 7.5l2.1 2.1M19.5 7.5l-2.1 2.1M3 13h2M19 13h2M4.2 19.8l1.4-1.4M18.4 19.8l-1.4-1.4"/>
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

// ── Additional Icons ────────────────────────────────────
export const WaveIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M23 5c0-1.1-.9-2-2-2s-2 .9-2 2v.18c-.63-.57-1.5-.93-2.48-.93-1.98 0-3.59 1.61-3.59 3.59V13c0 5-4 8-8 8"/>
    <path d="M15.73 2.5A2.5 2.5 0 0013.23 5M5 13v5a2 2 0 002 2h6"/>
  </svg>
)
export const PartyIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M13.73 3a2 2 0 011.8 1.11l3.05 6.29M1 23c0-3 2-5 4-6M9.6 3.39a2 2 0 00-3.2 1.73v6.88M22 23l-4-3-2 5"/>
    <path d="M7.7 3.87A2 2 0 005.5 2"/>
  </svg>
)
export const TagIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
)
export const PackageIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
)
export const ReceiptIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M6 2h12a2 2 0 012 2v16a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z"/>
    <path d="M10 6h4M9 11h6M9 16h6"/>
  </svg>
)
export const SaladIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M7 21h10M8 4l2-2 3 2 3-2 2 2M6 8h12a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8a2 2 0 012-2z"/>
    <circle cx="10" cy="12" r="1.5" fill={color}/>
    <circle cx="14" cy="12" r="1.5" fill={color}/>
    <circle cx="12" cy="14" r="1.5" fill={color}/>
  </svg>
)
export const LegIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M8 2v8a4 4 0 008 0V2M10 6a1 1 0 100-2 1 1 0 000 2zM11 13v8M8 22h4M13 13v8M16 22h4"/>
  </svg>
)
export const ChartUpIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
)
export const ChartDownIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
    <polyline points="17 18 23 18 23 12"/>
  </svg>
)
export const MedalIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <circle cx="8" cy="8" r="6.5"/>
    <circle cx="16" cy="8" r="6.5"/>
    <path d="M12 2l1.5 5 5.5.5-4 3 1.5 5-5-3-5 3 1.5-5-4-3 5.5-.5 1.5-5z"/>
    <line x1="12" y1="14.5" x2="12" y2="22"/>
    <line x1="9" y1="22" x2="15" y2="22"/>
  </svg>
)
export const AwardIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <circle cx="12" cy="8" r="7"/>
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
  </svg>
)
export const SparkleIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M12 3l3.53 7.26 8.02 1.17-5.63 5.36 1.41 8.22L12 17.77 4.67 22.01l1.41-8.22-5.63-5.36 8.02-1.17L12 3z"/>
  </svg>
)
export const RefreshIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0114.85-3.36M20.49 15A9 9 0 005.64 18.36"/>
  </svg>
)
export const PillIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M23 7l-7 7-10-10a3.73 3.73 0 015.27 0L20 3a3.73 3.73 0 013 4z" fill={color} stroke='none'/>
    <path d="M1 17l7-7"/>
  </svg>
)
export const GlassIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M6 3h12l1 6v2a4 4 0 01-4 4h-6a4 4 0 01-4-4v-2l1-6zM9 17a4 4 0 004 4h2"/>
  </svg>
)
export const FishIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M13.5 2H2v7.5a4.5 4.5 0 009 0 4.5 4.5 0 009 0 4.5 4.5 0 009 0v-7.5h-11.5z"/>
    <path d="M22 13.5a4.5 4.5 0 01-9 0"/>
  </svg>
)
export const BatteryIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <rect x="2" y="7" width="18" height="10" rx="1"/>
    <line x1="22" y1="11" x2="22" y2="13"/>
    <rect x="4" y="9" width="8" height="6" rx="0.5" fill={color}/>
  </svg>
)
export const LeafIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M11 22C17 18 21 15 21 10a5 5 0 10-10 0c0 5-4 8-10 12z"/>
  </svg>
)
export const CoffeeIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M18 8h1a4 4 0 010 8h-1"/>
    <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/>
    <line x1="6" y1="1" x2="6" y2="4"/>
    <line x1="10" y1="1" x2="10" y2="4"/>
    <line x1="14" y1="1" x2="14" y2="4"/>
  </svg>
)
export const BoneIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <circle cx="6" cy="12" r="3"/>
    <circle cx="18" cy="12" r="3"/>
    <line x1="9" y1="12" x2="15" y2="12"/>
  </svg>
)
export const TimerIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <circle cx="12" cy="13" r="9"/>
    <path d="M12 9v4l3 3M9 2h6"/>
  </svg>
)
export const HeartBeatIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
)
export const ClipboardIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1"/>
  </svg>
)

const iconMap = {
  HomeIcon,
  NutritionIcon,
  WorkoutIcon,
  SupplementIcon,
  ProfileIcon,
  WeightIcon,
  FireIcon,
  DropletIcon,
  ChartBarIcon,
  ChartLineIcon,
  TargetIcon,
  BoltIcon,
  TrophyIcon,
  CalendarIcon,
  ClockIcon,
  BellIcon,
  SearchIcon,
  PlusIcon,
  CheckIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ChevronDownIcon,
  CloseIcon,
  BackIcon,
  EditIcon,
  DeleteIcon,
  SettingsIcon,
  LockIcon,
  LogoutIcon,
  CameraIcon,
  MuscleIcon,
  BodyIcon,
  FoodIcon,
  ScaleIcon,
  HeartIcon,
  AppleIcon,
  RunIcon,
  MoonIcon,
  SunIcon,
  AutoIcon,
  ShareIcon,
  InfoIcon,
  StarIcon,
  MeasureIcon,
  WaterIcon,
  BMIIcon,
  CalcIcon,
  MealPlanIcon,
  AIIcon,
  HistoryIcon,
  TemplateIcon,
  ExercisesIcon,
  StreakIcon,
  ProteinIcon,
  WaveIcon,
  PartyIcon,
  TagIcon,
  PackageIcon,
  ReceiptIcon,
  SaladIcon,
  LegIcon,
  ChartUpIcon,
  ChartDownIcon,
  MedalIcon,
  AwardIcon,
  SparkleIcon,
  RefreshIcon,
  PillIcon,
  GlassIcon,
  FishIcon,
  BatteryIcon,
  LeafIcon,
  CoffeeIcon,
  BoneIcon,
  TimerIcon,
  HeartBeatIcon,
  ClipboardIcon,
  CouchIcon,
  WalkIcon,
  PlayIcon,
  SproutIcon,
  CircleIcon,
  RulerIcon,
  SunriseIcon,
} as const

export const IconByName = ({ name, ...props }: { name?: string } & IconProps) => {
  const key = (name || 'HomeIcon') as keyof typeof iconMap
  const Icon = iconMap[key] || HomeIcon
  return <Icon {...props} />
}
export const PencilIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
export const WarningIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
export const LightbulbIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
)
export const CartIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <circle cx="9" cy="21" r="1"/>
    <circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
  </svg>
)
export const SaveIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
)
export const EmailIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="M22 6L12 13 2 6"/>
  </svg>
)
export const KeyIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M21 2l-9.5 9.5M11 2C6 2 2 6 2 11s4 9 9 9 9-4 9-9"/>
    <circle cx="11" cy="11" r="1.5" fill={color}/>
  </svg>
)
export const UploadIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
)


export const GearIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 0l4.24-4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08 0l4.24 4.24"/>
  </svg>
)


export const RobotIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <rect x="7" y="7" width="3" height="3" fill={color}/>
    <rect x="14" y="7" width="3" height="3" fill={color}/>
    <line x1="9" y1="14" x2="15" y2="14"/>
  </svg>
)

// ── Missing/Additional Icons ────────────────────────────

export const BottleIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M12 2v3m0 14v3M8 5h8a1 1 0 011 1v8a2 2 0 01-2 2h-6a2 2 0 01-2-2V6a1 1 0 011-1z"/>
  </svg>
)
export const SyringeIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M9 4l3-3 3 3M12 1v18M3 6l6 6M21 6l-6 6M6 9l-2 2 6 6 2-2"/>
  </svg>
)
export const TeaIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M9 3h6a1 1 0 011 1v6a1 1 0 01-1 1h-6a1 1 0 01-1-1V4a1 1 0 011-1z"/>
    <path d="M12 10c-2 0-3 1-3 3s1 3 3 3 3-1 3-3-1-3-3-3z"/>
    <path d="M8 10l-2-2M16 10l2-2"/>
  </svg>
)
export const BeakerIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M4.5 3h15v3L9 21H6l7.5-15H4.5V3z"/>
  </svg>
)
export const FlaskIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M9 3h6M9 3v4h6V3M8 7h8v2l-4 8-4-8v-2z"/>
  </svg>
)
export const NutBoltIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <circle cx="12" cy="8" r="3"/>
    <path d="M9 14h6l1-3h-8l1 3z"/>
    <path d="M12 14v2"/>
  </svg>
)
export const DNAIcon = ({size=24,color='currentColor',strokeWidth=1.8}:IconProps) => (
  <svg {...d(size,color,strokeWidth)}>
    <path d="M6 3c3 0 4 3 4 7v7c0 4-1 7-4 7"/>
    <path d="M18 3c-3 0-4 3-4 7v7c0 4 1 7 4 7"/>
    <path d="M6 10l12 4M18 10l-12 4"/>
  </svg>
)

