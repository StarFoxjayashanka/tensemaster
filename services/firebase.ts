

import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { UserProfile, Tense, LeaderboardUser, AllCourseProgress, GrammarDetectiveChallenge, ClozeTestChallenge, TenseIdentificationChallenge, SimpleExplanation, AdvancedExplanation } from '../types';

// The original generic Json type was causing "Type instantiation is excessively deep" errors in TypeScript,
// breaking type inference for the entire Database type. By using specific, non-recursive types below,
// we fix the downstream errors.

// Represents the structure of a single question row, used across all quiz tables.
interface QuizTableRow {
  id: string;
  sentence: string;
  options: string[];
  correct_answer: string;
  created_at: string;
}

// Represents the return type from the RPC functions, which omits created_at for brevity.
export interface QuizRpcResponseRow {
    id: string;
    sentence: string;
    options: string[];
    correct_answer: string;
}

// Defining Row types separately for clarity in the main Database interface
type ProfileRow = {
  id: string;
  email: string;
  username: string;
  xp: number;
  ai_coins: number;
  streak_days: number;
  last_login: string;
  active_theme: string;
  achievements: string[];
  purchased_themes: string[];
  purchased_power_ups: Record<string, number> | null;
  course_progress: AllCourseProgress | null;
  total_quizzes_completed: number;
  total_coins_spent: number;
  last_challenge_completed: string;
  role: 'user' | 'admin';
};
// Explicit Insert/Update types
type ProfileUpdate = Partial<ProfileRow>;
type ProfileInsert = ProfileRow;

type CourseRow = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  icon_name: string;
  tense_count: number;
  created_at: string;
};
// Explicit Insert/Update types
type CourseInsert = Omit<CourseRow, 'created_at'>;
type CourseUpdate = Partial<CourseInsert>;

type CourseTenseRow = {
  id: string;
  course_id: string;
  user_id: string;
  name: string;
  explanation: ({ mode: 'simple' } & SimpleExplanation) | ({ mode: 'advanced' } & AdvancedExplanation);
  order: number;
  created_at: string;
};
// Explicit Insert/Update types
type CourseTenseInsert = Omit<CourseTenseRow, 'id' | 'created_at'>;
type CourseTenseUpdate = Partial<CourseTenseRow>;

type CustomQuizQuestionRow = {
  id: string;
  tense_id: string;
  user_id: string;
  sentence: string;
  options: string[];
  correct_answer: string;
  created_at: string;
};
// Explicit Insert/Update types
type CustomQuizQuestionInsert = Omit<CustomQuizQuestionRow, 'id' | 'created_at'>;
type CustomQuizQuestionUpdate = Partial<CustomQuizQuestionRow>;


export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      courses: {
        Row: CourseRow;
        Insert: CourseInsert;
        Update: CourseUpdate;
      };
      course_tenses: {
        Row: CourseTenseRow;
        Insert: CourseTenseInsert;
        Update: CourseTenseUpdate;
      };
      custom_quiz_questions: {
        Row: CustomQuizQuestionRow;
        Insert: CustomQuizQuestionInsert;
        Update: CustomQuizQuestionUpdate;
      };
      // --- TENSE QUIZ TABLES (READ-ONLY) ---
      quiz_simple_present: { Row: QuizTableRow; Insert: never; Update: never; };
      quiz_present_continuous: { Row: QuizTableRow; Insert: never; Update: never; };
      quiz_present_perfect: { Row: QuizTableRow; Insert: never; Update: never; };
      quiz_present_perfect_continuous: { Row: QuizTableRow; Insert: never; Update: never; };
      quiz_simple_past: { Row: QuizTableRow; Insert: never; Update: never; };
      quiz_past_continuous: { Row: QuizTableRow; Insert: never; Update: never; };
      quiz_past_perfect: { Row: QuizTableRow; Insert: never; Update: never; };
      quiz_past_perfect_continuous: { Row: QuizTableRow; Insert: never; Update: never; };
      quiz_simple_future: { Row: QuizTableRow; Insert: never; Update: never; };
      quiz_future_continuous: { Row: QuizTableRow; Insert: never; Update: never; };
      quiz_future_perfect: { Row: QuizTableRow; Insert: never; Update: never; };
      quiz_future_perfect_continuous: { Row: QuizTableRow; Insert: never; Update: never; };
      quiz_passive_present_simple: { Row: QuizTableRow; Insert: never; Update: never; };
      quiz_passive_past_simple: { Row: QuizTableRow; Insert: never; Update: never; };
      quiz_passive_future_simple: { Row: QuizTableRow; Insert: never; Update: never; };
      quiz_reported_statements: { Row: QuizTableRow; Insert: never; Update: never; };
      quiz_reported_questions: { Row: QuizTableRow; Insert: never; Update: never; };
      // --- REVIEW QUIZ TABLES (READ-ONLY) ---
      review_present: { Row: QuizTableRow; Insert: never; Update: never; };
      review_past: { Row: QuizTableRow; Insert: never; Update: never; };
      review_future: { Row: QuizTableRow; Insert: never; Update: never; };
      review_passive: { Row: QuizTableRow; Insert: never; Update: never; };
      review_reported_speech: { Row: QuizTableRow; Insert: never; Update: never; };
      // --- CHALLENGE TABLES (READ-ONLY) ---
      challenge_classic: { Row: QuizTableRow; Insert: never; Update: never; };
      challenge_hard: { Row: QuizTableRow; Insert: never; Update: never; };
      challenge_time_attack: { Row: QuizTableRow; Insert: never; Update: never; };
      // --- GRAMMAR GAUNTLET TABLES (READ-ONLY) ---
      challenge_grammar_detective: { Row: GrammarDetectiveChallenge; Insert: never; Update: never; };
      challenge_cloze_test: { Row: ClozeTestChallenge; Insert: never; Update: never; };
      challenge_tense_identification: { Row: TenseIdentificationChallenge; Insert: never; Update: never; };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_quiz_questions: {
        Args: { p_table_name: string };
        Returns: QuizRpcResponseRow[];
      };
      get_challenge_questions: {
        Args: { p_mode: string }; // 'classic', 'hard', or 'time-attack'
        Returns: QuizRpcResponseRow[];
      };
      is_admin: {
        Args: { user_id_to_check: string };
        Returns: boolean;
      };
      get_leaderboard_data: {
        Args: { p_user_id: string; p_limit: number };
        Returns: LeaderboardUser[];
      };
    };
  };
}

// --- Supabase Client Initialization ---
// IMPORTANT: Replace with your actual Supabase Project URL and Anon Key
const supabaseUrl: string = 'https://sbufhwplhekpveksflqu.supabase.co';
const supabaseAnonKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNidWZod3BsaGVrcHZla3NmbHF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MzE5MjksImV4cCI6MjA3MDMwNzkyOX0.eAJYAxZF3frgTKriIApJRiuFPBD25S_heJyP9xnRCcs';

if (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseAnonKey === 'YOUR_supabaseAnonKey') {
    console.warn("Supabase credentials are not set. Please update services/firebase.ts with your project's URL and Key.");
}

const supabase: SupabaseClient<Database> = createClient<Database>(supabaseUrl, supabaseAnonKey);


// --- Helper Functions ---
const areConsecutiveDays = (date1: Date, date2: Date) => {
    const d1 = new Date(date1);
    d1.setHours(0, 0, 0, 0);
    const d2 = new Date(date2);
    d2.setHours(0, 0, 0, 0);
    return d2.getTime() - d1.getTime() === 86400000;
};

const isSameDay = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
};


// --- API Service Implementation ---

const auth = {
    onAuthStateChanged: (callback: (user: User | null) => void) => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            callback(session?.user ?? null);
        });

        // Immediately call with current user
        supabase.auth.getUser().then(({ data: { user } }) => {
            callback(user);
        });

        return () => subscription.unsubscribe();
    },

    signInWithEmailAndPassword: async (email: string, pass: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;

        // Handle streak logic
        const user = data.user;
        if (user) {
            const { data: userProfile, error: profileError } = await supabase.from('profiles').select('last_login, streak_days').eq('id', user.id).single();
            if (profileError) console.error("Could not get user profile for streak check:", profileError);
            if (userProfile) {
                const today = new Date();
                const lastLogin = new Date(userProfile.last_login);
                if (!isSameDay(today, lastLogin)) {
                    const newStreak = areConsecutiveDays(lastLogin, today) ? (userProfile.streak_days || 0) + 1 : 1;
                    const { error: updateError } = await supabase.from('profiles').update({ last_login: today.toISOString(), streak_days: newStreak }).eq('id', user.id);
                    if (updateError) console.error("Failed to update streak:", updateError);
                }
            }
        }
        return { user: data.user };
    },

 signUp: async (email: string, pass: string, username: string) => {
  // Step 1: Check your own table for existing email
  const { data: existingUser, error: checkError } = await supabase
    .from('user_confirmed_at')
    .select('email_confirmed_at')
    .eq('email', email)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    checkError.message = `Custom error: DB issue detected - ${checkError.message}`;
    throw checkError;
  }

  if (existingUser) {
    if (existingUser.email_confirmed_at) {
      throw new Error('This email address is already in use. Please try to log in.');
    } else {
      throw new Error('This email is already registered but not confirmed. Please check your inbox for the confirmation link.');
    }
  }

  // Step 2: Check for existing username in the public profiles table.
  // This prevents sign-ups with usernames that are already taken by verified users.
  const { data: existingProfile, error: profileCheckError } = await db
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single();

  if (profileCheckError && profileCheckError.code !== 'PGRST116') { // PGRST116 means no row found, which is what we want.
      throw new Error(`Database error checking username: ${profileCheckError.message}`);
  }

  if (existingProfile) {
      throw new Error('This username is already taken. Please choose another one.');
  }

  // Step 3: Sign up the user since email and username are available
  const { data, error } = await supabase.auth.signUp({
    email,
    password: pass,
    options: {
      data: {
        username: username,
      }
    }
  });

  if (error) {
    // Make Supabase's somewhat cryptic errors more user-friendly.
    if (error.message.includes("User already registered")) {
        // This can happen in a race condition if our initial check passes but Supabase's internal check catches it.
        throw new Error("This email is already registered. Please try to log in or reset your password.");
    }
    error.message = `Sign-up failed: ${error.message}`;
    throw error;
  }

  if (data.user) {
    // Return success only if sign-up went through
    return { user: data.user };
  }

  throw new Error('An unexpected issue occurred during sign-up. Please try again.');
},

    signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    changePassword: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
        // First, check if the current password is correct by re-authenticating.
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            throw new Error("User not found. Please log in again.");
        }

        // The 'signInWithPassword' method will return an error if the password is wrong.
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email!,
            password: currentPassword,
        });

        if (signInError) {
            // Provide a user-friendly error message.
            throw new Error("Your current password was incorrect.");
        }
        
        // If re-authentication was successful, proceed to update the password.
        const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

        if (updateError) {
            throw updateError;
        }
    },

    sendPasswordResetEmail: async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin,
        });
        if (error) throw error;
    },
};

const db = {
    from<TableName extends keyof Database['public']['Tables']>(table: TableName) {
        return supabase.from(table);
    },
    rpc: supabase.rpc.bind(supabase),
    
    // Realtime subscription helper for a single document
    onSnapshot: (table: 'profiles', id: string, callback: (payload: any) => void) => {
        // IMPORTANT: For this to work, you MUST enable real-time for the 'profiles' table in your Supabase project.
        // Go to your project's SQL Editor and run the following command ONCE:
        // ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
        const channel = supabase
            .channel(`public:${table}:${id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table, filter: `id=eq.${id}` }, (payload) => {
                // The new, updated record is included in the payload.
                // We can use it directly without another fetch for maximum efficiency.
                if (payload.eventType === 'DELETE') {
                    callback({
                        exists: () => false,
                        data: () => null,
                    });
                } else if (payload.new) {
                     callback({
                        exists: () => true,
                        data: () => payload.new,
                    });
                }
            })
            .subscribe();

        // Initial fetch remains the same
        db.from(table).select('*').eq('id', id).single().then(({ data }) => {
            callback({
                exists: () => !!data,
                data: () => data,
            });
        });

        return () => { void supabase.removeChannel(channel); };
    },
};

export { auth, db };
