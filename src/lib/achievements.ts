export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  color: string
  category: 'nutrition' | 'workout' | 'weight' | 'streak' | 'supplement' | 'milestone'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  secret?: boolean
}

export const ACHIEVEMENTS: Achievement[] = [
  // ── Nutrition ──────────────────────────────────────────
  { id:'first_log',       title:'First Steps',         description:'Log your first meal',                                    icon:'🍽️',  color:'#10b981', category:'nutrition',   rarity:'common' },
  { id:'protein_goal',    title:'Protein Pro',          description:'Hit your protein target for the first time',             icon:'💪',  color:'#3b82f6', category:'nutrition',   rarity:'common' },
  { id:'cal_goal_5',      title:'Calorie Consistent',   description:'Hit your calorie goal 5 days in a row',                 icon:'🎯',  color:'#6366f1', category:'nutrition',   rarity:'rare' },
  { id:'cal_goal_30',     title:'Macro Master',         description:'Hit your calorie goal 30 days in a row',                icon:'👑',  color:'#f59e0b', category:'nutrition',   rarity:'legendary' },
  { id:'log_100',         title:'Century Club',         description:'Log 100 meals total',                                    icon:'💯',  color:'#8b5cf6', category:'nutrition',   rarity:'epic' },
  { id:'log_7_days',      title:'Week Warrior',         description:'Log food every day for 7 days straight',                icon:'📅',  color:'#10b981', category:'nutrition',   rarity:'rare' },
  { id:'all_macros',      title:'Balanced Diet',        description:'Hit all 4 macro targets in a single day',               icon:'⚖️',  color:'#6366f1', category:'nutrition',   rarity:'epic' },
  { id:'water_goal',      title:'Stay Hydrated',        description:'Hit your water goal for the first time',                icon:'💧',  color:'#0ea5e9', category:'nutrition',   rarity:'common' },
  { id:'water_7days',     title:'Hydration Hero',       description:'Hit water goal 7 days in a row',                        icon:'🌊',  color:'#0ea5e9', category:'nutrition',   rarity:'rare' },
  { id:'breakfast_7',     title:'Early Bird',           description:'Log breakfast 7 days in a row',                         icon:'🌅',  color:'#f59e0b', category:'nutrition',   rarity:'rare' },

  // ── Workout ─────────────────────────────────────────────
  { id:'first_workout',   title:'First Rep',            description:'Complete your first workout',                            icon:'🏋️', color:'#6366f1', category:'workout',     rarity:'common' },
  { id:'workout_5',       title:'Getting Started',      description:'Complete 5 workouts',                                    icon:'⚡',  color:'#3b82f6', category:'workout',     rarity:'common' },
  { id:'workout_20',      title:'Dedicated',            description:'Complete 20 workouts',                                   icon:'🔥',  color:'#ef4444', category:'workout',     rarity:'rare' },
  { id:'workout_50',      title:'Iron Will',            description:'Complete 50 workouts',                                   icon:'🦾',  color:'#8b5cf6', category:'workout',     rarity:'epic' },
  { id:'workout_100',     title:'Beast Mode',           description:'Complete 100 workouts',                                  icon:'🦁',  color:'#f59e0b', category:'workout',     rarity:'legendary' },
  { id:'first_pr',        title:'Personal Best',        description:'Set your first personal record',                         icon:'🏆',  color:'#f59e0b', category:'workout',     rarity:'common' },
  { id:'pr_10',           title:'Record Breaker',       description:'Set 10 personal records',                                icon:'💎',  color:'#6366f1', category:'workout',     rarity:'epic' },
  { id:'volume_1000',     title:'Volume King',          description:'Lift 1,000 kg in a single session',                     icon:'⚡',  color:'#ef4444', category:'workout',     rarity:'rare' },
  { id:'volume_100k',     title:'Titan',                description:'Lift 100,000 kg total across all workouts',              icon:'🌋',  color:'#dc2626', category:'workout',     rarity:'legendary' },
  { id:'workout_streak7', title:'7-Day Warrior',        description:'Work out 7 days in a row',                               icon:'🗓️', color:'#8b5cf6', category:'workout',     rarity:'epic' },

  // ── Weight ───────────────────────────────────────────────
  { id:'first_weigh',     title:'Step On It',           description:'Log your first weight',                                  icon:'⚖️',  color:'#10b981', category:'weight',      rarity:'common' },
  { id:'weight_7days',    title:'Scale Habit',          description:'Log weight 7 days in a row',                             icon:'📊',  color:'#6366f1', category:'weight',      rarity:'rare' },
  { id:'lost_1kg',        title:'First Kilo',           description:'Lose your first kilogram',                               icon:'📉',  color:'#10b981', category:'weight',      rarity:'common' },
  { id:'lost_5kg',        title:'5kg Down',             description:'Lose 5 kilograms total',                                 icon:'🎉',  color:'#10b981', category:'weight',      rarity:'rare' },
  { id:'lost_10kg',       title:'10kg Champion',        description:'Lose 10 kilograms total',                                icon:'🏅',  color:'#f59e0b', category:'weight',      rarity:'epic' },
  { id:'reached_goal',    title:'Goal Achieved!',       description:'Reach your target weight',                               icon:'🎯',  color:'#f59e0b', category:'weight',      rarity:'legendary' },

  // ── Streaks ──────────────────────────────────────────────
  { id:'streak_3',        title:'On Fire',              description:'3-day logging streak',                                   icon:'🔥',  color:'#ef4444', category:'streak',      rarity:'common' },
  { id:'streak_7',        title:'Week Strong',          description:'7-day logging streak',                                   icon:'🔥',  color:'#f59e0b', category:'streak',      rarity:'rare' },
  { id:'streak_30',       title:'Monthly Grind',        description:'30-day logging streak',                                  icon:'🔥',  color:'#8b5cf6', category:'streak',      rarity:'epic' },
  { id:'streak_100',      title:'Centurion',            description:'100-day logging streak',                                 icon:'🔥',  color:'#dc2626', category:'streak',      rarity:'legendary' },

  // ── Supplement ───────────────────────────────────────────
  { id:'first_supp',      title:'Supplement Start',     description:'Take your first supplement',                             icon:'💊',  color:'#8b5cf6', category:'supplement',  rarity:'common' },
  { id:'supp_week',       title:'Stack Consistent',     description:'Take all supplements for 7 days straight',              icon:'💊',  color:'#6366f1', category:'supplement',  rarity:'rare' },
  { id:'supp_month',      title:'Stack Master',         description:'Take all supplements for 30 days straight',             icon:'💊',  color:'#f59e0b', category:'supplement',  rarity:'epic' },

  // ── Milestones ───────────────────────────────────────────
  { id:'profile_complete',title:'All Set Up',           description:'Complete your profile 100%',                             icon:'✅',  color:'#10b981', category:'milestone',   rarity:'common' },
  { id:'early_adopter',   title:'Early Adopter',        description:'One of the first Kayven users',                         icon:'⭐',  color:'#f59e0b', category:'milestone',   rarity:'legendary', secret:true },
  { id:'night_owl',       title:'Night Owl',            description:'Log a meal after midnight',                              icon:'🌙',  color:'#6366f1', category:'milestone',   rarity:'rare', secret:true },
  { id:'overachiever',    title:'Overachiever',         description:'Exceed your calorie goal by less than 50 kcal 3 times',  icon:'🎖️', color:'#8b5cf6', category:'milestone',   rarity:'epic' },
]

export const RARITY_COLORS = {
  common:    { bg:'#f0fdf4', border:'#86efac', text:'#16a34a', badge:'Common' },
  rare:      { bg:'#eff6ff', border:'#93c5fd', text:'#2563eb', badge:'Rare' },
  epic:      { bg:'#faf5ff', border:'#c084fc', text:'#9333ea', badge:'Epic' },
  legendary: { bg:'#fefce8', border:'#fde047', text:'#ca8a04', badge:'Legendary' },
}

export const WEEKLY_CHALLENGES = [
  { id:'wc_log5meals',  title:'Meal Tracker',        description:'Log at least 3 meals for 5 days this week', icon:'🍽️', color:'#10b981', target:5, category:'nutrition' },
  { id:'wc_hit_protein',title:'Protein Week',         description:'Hit your protein target 5 days this week',  icon:'💪', color:'#3b82f6', target:5, category:'nutrition' },
  { id:'wc_workouts3',  title:'3x Workout Week',      description:'Complete 3 workouts this week',              icon:'🏋️',color:'#6366f1', target:3, category:'workout' },
  { id:'wc_water5days', title:'Stay Hydrated',        description:'Hit water goal 5 days this week',            icon:'💧', color:'#0ea5e9', target:5, category:'nutrition' },
  { id:'wc_weight7days',title:'Daily Weigh-In',       description:'Log your weight every day this week',        icon:'⚖️', color:'#f59e0b', target:7, category:'weight' },
  { id:'wc_no_junk',    title:'Clean Week',           description:'Stay under your calorie goal every day',      icon:'🥗', color:'#10b981', target:7, category:'nutrition' },
]
