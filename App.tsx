


import React, { useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import CourseOverviewPage from './pages/CourseOverviewPage';
import LearningAreaPage from './pages/LearningAreaPage';
import QuizPage from './pages/QuizPage';
import DailyChallengePage from './pages/DailyChallengePage';
import ReviewQuizPage from './pages/ReviewQuizPage';
import ProgressDetailsPage from './pages/ProgressDetailsPage'; // Import the new page
import LeaderboardPage from './pages/LeaderboardPage';
import Header from './components/Header';
import AchievementToast from './components/AchievementToast';
import { Toaster } from 'react-hot-toast';
import CourseEditorPage from './pages/CourseEditorPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminCoursesPage from './pages/admin/AdminCoursesPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import GauntletPage from './pages/GauntletPage';
import GrammarDetectivePage from './pages/GrammarDetectivePage';
import ClozeTestPage from './pages/ClozeTestPage';
import TenseIdentificationPage from './pages/TenseIdentificationPage';


const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen bg-background">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
  </div>
);

// A wrapper for routes that require authentication.
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <ReactRouterDOM.Navigate to="/auth" />;
  return <>{children}</>;
};

// A wrapper for routes that require ADMIN authentication.
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user || !isAdmin) return <ReactRouterDOM.Navigate to="/" />;
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Toaster position="top-center" reverseOrder={false} toastOptions={{
          style: {
            background: 'hsl(var(--card))',
            color: 'hsl(var(--card-foreground))',
            border: '1px solid hsl(var(--border))',
          },
      }}/>
      <ReactRouterDOM.HashRouter>
        <Main />
      </ReactRouterDOM.HashRouter>
    </AuthProvider>
  );
};

// Main component containing router logic to access auth context.
const Main: React.FC = () => {
    const { user, userData, unlockedAchievement, hideAchievementNotification } = useAuth();
    const location = ReactRouterDOM.useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

    useEffect(() => {
        // --- Theme setup ---
        const savedFontSize = localStorage.getItem('tense-master-font-size') || 'font-size-normal';
        document.body.classList.remove('font-size-small', 'font-size-normal', 'font-size-large');
        document.body.classList.add(savedFontSize);

        const theme = userData?.active_theme || 'deep-space';
        document.documentElement.setAttribute('data-theme', theme);

        // --- Theme type for cursor ---
        const lightThemes = new Set(['theme-mint', 'theme-sakura', 'theme-desert', 'theme-lavender', 'theme-diamond']);
        const themeType = lightThemes.has(theme) ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme-type', themeType);
        
        const cursor = document.querySelector('.custom-cursor') as HTMLElement;
        if (!cursor) return;

        let lastSparkleMove = 0;
        const sparkleThrottleInterval = 50; // ms

        // --- Throttled Mouse Move Handler ---
        const mousePos = { x: 0, y: 0 };
        let animationFrameId: number | null = null;
        let cursorInitialized = false;

        const onThrottledMouseMove = () => {
            // 1. Update Custom Cursor Position using CSS variables
            if (cursor) {
                cursor.style.setProperty('--cursor-x', `${mousePos.x}px`);
                cursor.style.setProperty('--cursor-y', `${mousePos.y}px`);
            }

            // 2. Update CSS variables for parallax & background effects
            const ww = window.innerWidth;
            const wh = window.innerHeight;
            const xNorm = (mousePos.x - ww / 2) / ww;
            const yNorm = (mousePos.y - wh / 2) / wh;
            document.documentElement.style.setProperty('--mouse-x', `${xNorm}`);
            document.documentElement.style.setProperty('--mouse-y', `${yNorm}`);
            document.documentElement.style.setProperty('--mouse-x-bg', `${mousePos.x}px`);
            document.documentElement.style.setProperty('--mouse-y-bg', `${mousePos.y}px`);

            // 3. Diamond theme sparkle effect (throttled inside)
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const now = Date.now();
            if (currentTheme === 'theme-diamond' && now - lastSparkleMove > sparkleThrottleInterval) {
                lastSparkleMove = now;

                const sparkle = document.createElement('div');
                sparkle.className = 'sparkle';
                document.body.appendChild(sparkle);

                sparkle.style.left = `${mousePos.x}px`;
                sparkle.style.top = `${mousePos.y}px`;

                const randomX = (Math.random() - 0.5) * 80;
                const randomY = (Math.random() - 0.5) * 80;
                sparkle.style.setProperty('--tx', `${randomX}px`);
                sparkle.style.setProperty('--ty', `${randomY}px`);

                setTimeout(() => {
                    if (sparkle.parentElement) {
                        sparkle.remove();
                    }
                }, 700); // match animation duration
            }
            animationFrameId = null; // Allow next frame to be requested
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!cursorInitialized) {
                cursor.style.opacity = '1';
                cursorInitialized = true;
            }
            mousePos.x = e.clientX;
            mousePos.y = e.clientY;

            if (animationFrameId === null) {
                animationFrameId = requestAnimationFrame(onThrottledMouseMove);
            }
        };

        const handleMouseLeave = () => {
            if (cursor) {
                cursor.style.opacity = '0';
            }
            cursorInitialized = false;
        };

        const handleTouchStart = () => {
            if (cursor) {
                cursor.style.opacity = '0';
            }
            cursorInitialized = false;
        }
        
        const isFinePointer = window.matchMedia('(pointer: fine)').matches;

        if (isFinePointer) {
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseleave', handleMouseLeave);
          document.addEventListener('touchstart', handleTouchStart);
        } else {
            if(cursor) cursor.style.display = 'none';
        }

        // Cleanup sparkles if theme is not diamond
        if (theme !== 'theme-diamond') {
            document.querySelectorAll('.sparkle').forEach(el => el.remove());
        }

        return () => {
            if (isFinePointer) {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseleave', handleMouseLeave);
              document.removeEventListener('touchstart', handleTouchStart);
            }
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            // Clean up any remaining sparkles when component unmounts or theme changes
            document.querySelectorAll('.sparkle').forEach(el => el.remove());
        };
    }, [userData?.active_theme]);


    return (
        <div className="min-h-screen bg-background font-sans">
            <Header />
            <main>
                <ReactRouterDOM.Routes>
                    <ReactRouterDOM.Route path="/auth" element={!user ? <AuthPage /> : <ReactRouterDOM.Navigate to="/" />} />
                    
                    {/* Public Landing Page */}
                    <ReactRouterDOM.Route path="/" element={<HomePage />} />
                    
                    {/* Protected Routes */}
                    <ReactRouterDOM.Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                    <ReactRouterDOM.Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
                    <ReactRouterDOM.Route path="/progress-details" element={<ProtectedRoute><ProgressDetailsPage /></ProtectedRoute>} />
                    <ReactRouterDOM.Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                    <ReactRouterDOM.Route path="/challenge/:mode" element={<ProtectedRoute><DailyChallengePage /></ProtectedRoute>} />
                    <ReactRouterDOM.Route path="/course/:courseId" element={<ProtectedRoute><CourseOverviewPage /></ProtectedRoute>} />
                    <ReactRouterDOM.Route path="/learn/:courseId/:tenseId" element={<ProtectedRoute><LearningAreaPage /></ProtectedRoute>} />
                    <ReactRouterDOM.Route path="/quiz/:courseId/:tenseId" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
                    <ReactRouterDOM.Route path="/review/:courseId" element={<ProtectedRoute><ReviewQuizPage /></ProtectedRoute>} />
                    
                    {/* Grammar Gauntlet Routes */}
                    <ReactRouterDOM.Route path="/gauntlet" element={<ProtectedRoute><GauntletPage /></ProtectedRoute>} />
                    <ReactRouterDOM.Route path="/gauntlet/detective" element={<ProtectedRoute><GrammarDetectivePage /></ProtectedRoute>} />
                    <ReactRouterDOM.Route path="/gauntlet/cloze" element={<ProtectedRoute><ClozeTestPage /></ProtectedRoute>} />
                    <ReactRouterDOM.Route path="/gauntlet/identification" element={<ProtectedRoute><TenseIdentificationPage /></ProtectedRoute>} />
                   
                    {/* Admin Routes */}
                    <ReactRouterDOM.Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
                    <ReactRouterDOM.Route path="/admin/courses" element={<AdminRoute><AdminCoursesPage /></AdminRoute>} />
                    <ReactRouterDOM.Route path="/admin/courses/new" element={<AdminRoute><CourseEditorPage /></AdminRoute>} />
                    <ReactRouterDOM.Route path="/admin/courses/edit/:courseId" element={<AdminRoute><CourseEditorPage /></AdminRoute>} />
                    <ReactRouterDOM.Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />

                    <ReactRouterDOM.Route path="*" element={<ReactRouterDOM.Navigate to="/" />} />
                </ReactRouterDOM.Routes>
            </main>
            <AchievementToast achievement={unlockedAchievement} onClose={hideAchievementNotification} />
        </div>
    );
}

export default App;