// This declares the custom properties on the window object
declare global {
  interface Window {
    // Custom properties can be added here if needed in the future.
  }
}

// Structure for course progress tracking
export interface TenseProgress {
  completed: boolean;
  score: number; // last score
}

export interface CourseProgress {
  [tenseId: string]: TenseProgress;
}

export interface AllCourseProgress {
  [courseId: string]: CourseProgress;
}

// User profile data structure
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  xp: number;
  ai_coins: number;
  streak_days: number;
  last_login: string; // ISO String
  active_theme: string; // e.g., 'deep-space'
  achievements: string[]; // Array of achievement IDs
  purchased_themes: string[]; // Array of theme IDs
  purchased_power_ups: Record<string, number>; // e.g., { hint: 5, '5050': 2 }
  course_progress: AllCourseProgress;
  total_quizzes_completed: number;
  total_coins_spent: number;
  last_challenge_completed: string; // ISO String
  role: 'user' | 'admin';
}

// --- BLOCK-BASED EDITOR TYPES ---

export type HeadingBlock = { type: 'heading'; id: string; level: 2 | 3; text: string; };
export type ParagraphBlock = { type: 'paragraph'; id: string; text: string; };

export type StructureBlockItem = { id: string; type: 'positive' | 'negative' | 'interrogative' | 'negativeInterrogative'; content: string; };
export type StructureBlock = { type: 'structure'; id: string; items: StructureBlockItem[] };

export type ExampleBlockItem = { id: string; type: 'positive' | 'negative' | 'interrogative' | 'negativeInterrogative'; examples: string[]; };
export type ExampleBlock = { type: 'examples'; id: string; items: ExampleBlockItem[] };

export type AlertBlock = { type: 'alert'; id: string; style: 'info' | 'warning' | 'success'; text: string; };

export type ContentBlock = HeadingBlock | ParagraphBlock | StructureBlock | ExampleBlock | AlertBlock;

export interface SimpleExplanation {
  usage: string;
  structure: {
    positive: string;
    negative: string;
    interrogative: string;
    negativeInterrogative?: string;
  };
  examples: {
    positive: string[];
    negative: string[];
    interrogative: string[];
    negativeInterrogative?: string[];
  };
}

export interface AdvancedExplanation {
    content: ContentBlock[];
}

// Tense structure
export interface Tense {
  id: string;
  name: string;
  explanation: ({ mode: 'simple' } & SimpleExplanation) | ({ mode: 'advanced' } & AdvancedExplanation);
  course_id?: string;
  order?: number;
  user_id?: string;
}

// Course structure
export interface Course {
  id: string;
  name: string;
  description: string;
  iconName: string;
  userId?: string | null;
  tenses: Tense[];
}

// Quiz question structure
export interface QuizQuestion {
  id: string;
  sentence: string; // e.g., "She ___ to the store every day."
  correctAnswer: string;
  options: string[]; // Includes correct answer and distractors
}

// Achievement structure
export interface Achievement {
  id: string;
  name:string;
  description: string;
  reward: {
    xp: number;
    aiCoins: number;
  };
}

// Shop Item (Theme or Power-up)
export interface ShopItem {
    id: string;
    name: string;
    description: string;
    type: 'theme' | 'power-up';
    cost: number;
    premium?: boolean;
}

// Leaderboard user structure
export interface LeaderboardUser {
  id: string;
  username: string;
  xp: number;
  rank: number;
}

// --- GAUNTLET CHALLENGE TYPES ---
export interface GrammarDetectiveChallenge {
  id: string;
  paragraph: string;
  errors: {
    incorrect: string;
    correct: string;
  }[];
}

export interface ClozeTestChallenge {
  id: string;
  story_template: string;
  blanks: {
    id: number;
    options: string[];
    correct_answer: string;
  }[];
}

export interface TenseIdentificationChallenge {
    id: string;
    sentence: string;
    correct_tense_name: string;
}