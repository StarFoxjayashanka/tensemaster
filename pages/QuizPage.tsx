import React, { useState, useMemo, useCallback, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { ACHIEVEMENTS_DATA } from '../constants';
import { getCourseData, getAllCoursesData, COURSES_METADATA } from '../data/course-data';
import Button from '../components/Button';
import Card from '../components/Card';
import CircularProgress from '../components/CircularProgress';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { db, QuizRpcResponseRow } from '../services/firebase';
import { Lightbulb, ShieldHalf, SkipForward, Star, HelpCircle, RotateCcw, Loader2 } from 'lucide-react';
import { UserProfile, Achievement, QuizQuestion, Course } from '../types';

type UserAnswer = { questionId: string; selectedAnswer: string | null; skipped: boolean };

// Helper function to check for and award achievements
const checkAndAwardAchievements = (
  userData: UserProfile,
  allCourses: Course[],
  courseId: string,
  score: number
): { newAchievements: Achievement[]; totalXpReward: number; totalCoinReward: number } => {
  let updatedUserData = { ...userData };
  const newAchievements: Achievement[] = [];
  let totalXpReward = 0;
  let totalCoinReward = 0;
  const currentAchievements = new Set(userData.achievements || []);

  const checkAndAdd = (id: string) => {
    const achievement = ACHIEVEMENTS_DATA.find(a => a.id === id);
    if (achievement && !currentAchievements.has(id)) {
      newAchievements.push(achievement);
      totalXpReward += achievement.reward.xp;
      totalCoinReward += achievement.reward.aiCoins;
      currentAchievements.add(id);
    }
  };

  // Note: We use the passed-in userData which is a temporary state for this check
  if (updatedUserData.total_quizzes_completed === 1) checkAndAdd('first-quiz');
  if (score >= 100) checkAndAdd('perfect-score');
  if (updatedUserData.total_quizzes_completed >= 25) checkAndAdd('quiz-master');
  if (updatedUserData.streak_days >= 3) checkAndAdd('streak-starter');
  if (updatedUserData.streak_days >= 7) checkAndAdd('streak-master');

  const course = allCourses.find(c => c.id === courseId);
  if (course) {
    const allTensesInCourseCompleted = course.tenses.every(
      t => (updatedUserData.course_progress as any)?.[courseId]?.[t.id]?.completed
    );
    if (allTensesInCourseCompleted) {
      const isBuiltIn = COURSES_METADATA.some(c => c.id === courseId);
      if (isBuiltIn) {
        checkAndAdd(`${courseId}-master`);
      } else {
        // It's a custom course. Award the 'first-custom-master' achievement if not already earned.
        checkAndAdd('first-custom-master');
      }
    }
  }

  const allCoursesCompleted = allCourses.every(c => 
    c.tenses.length > 0 && c.tenses.every(t => (updatedUserData.course_progress as any)?.[c.id]?.[t.id]?.completed)
  );
  if (allCoursesCompleted) checkAndAdd('grammar-guru');
  
  return { newAchievements, totalXpReward, totalCoinReward };
};

const QuizPage: React.FC = () => {
  const { courseId, tenseId } = ReactRouterDOM.useParams<{ courseId: string; tenseId: string }>();
  const navigate = ReactRouterDOM.useNavigate();
  const { userData, updateUserData, showAchievementNotification } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [lockedAnswers, setLockedAnswers] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [usedPowerUps, setUsedPowerUps] = useState<{[key: string]: number}>({});
  const [activePowerUps, setActivePowerUps] = useState({ 'double-xp': false });
  const [fiftyFiftyUsed, setFiftyFiftyUsed] = useState<string[]>([]);
  const [hintUsed, setHintUsed] = useState<string[]>([]);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
        if (!courseId || !tenseId) return;
        setIsLoading(true);
        
        try {
            const allCoursesData = await getAllCoursesData();
            setAllCourses(allCoursesData);

            const courseData = await getCourseData(courseId);
            setCourse(courseData || null);

            // Determine if the course is built-in or custom
            const isBuiltInCourse = COURSES_METADATA.some(c => c.id === courseId);
            let data: QuizRpcResponseRow[] | null = null;
            let error: any = null;

            if (isBuiltInCourse) {
                const tableName = `quiz_${tenseId.replace(/-/g, '_')}`;
                let query;
                switch (tableName) {
                    case 'quiz_simple_present': query = db.from('quiz_simple_present').select('id, sentence, options, correct_answer'); break;
                    case 'quiz_present_continuous': query = db.from('quiz_present_continuous').select('id, sentence, options, correct_answer'); break;
                    case 'quiz_present_perfect': query = db.from('quiz_present_perfect').select('id, sentence, options, correct_answer'); break;
                    case 'quiz_present_perfect_continuous': query = db.from('quiz_present_perfect_continuous').select('id, sentence, options, correct_answer'); break;
                    case 'quiz_simple_past': query = db.from('quiz_simple_past').select('id, sentence, options, correct_answer'); break;
                    case 'quiz_past_continuous': query = db.from('quiz_past_continuous').select('id, sentence, options, correct_answer'); break;
                    case 'quiz_past_perfect': query = db.from('quiz_past_perfect').select('id, sentence, options, correct_answer'); break;
                    case 'quiz_past_perfect_continuous': query = db.from('quiz_past_perfect_continuous').select('id, sentence, options, correct_answer'); break;
                    case 'quiz_simple_future': query = db.from('quiz_simple_future').select('id, sentence, options, correct_answer'); break;
                    case 'quiz_future_continuous': query = db.from('quiz_future_continuous').select('id, sentence, options, correct_answer'); break;
                    case 'quiz_future_perfect': query = db.from('quiz_future_perfect').select('id, sentence, options, correct_answer'); break;
                    case 'quiz_future_perfect_continuous': query = db.from('quiz_future_perfect_continuous').select('id, sentence, options, correct_answer'); break;
                    case 'quiz_passive_present_simple': query = db.from('quiz_passive_present_simple').select('id, sentence, options, correct_answer'); break;
                    case 'quiz_passive_past_simple': query = db.from('quiz_passive_past_simple').select('id, sentence, options, correct_answer'); break;
                    case 'quiz_passive_future_simple': query = db.from('quiz_passive_future_simple').select('id, sentence, options, correct_answer'); break;
                    case 'quiz_reported_statements': query = db.from('quiz_reported_statements').select('id, sentence, options, correct_answer'); break;
                    case 'quiz_reported_questions': query = db.from('quiz_reported_questions').select('id, sentence, options, correct_answer'); break;
                    default:
                        error = { message: `Quiz table "${tableName}" is not configured in the frontend.` };
                }
                
                if (query) {
                    const result = await query;
                    if (result.error) {
                        error = result.error;
                    } else if (result.data) {
                        const allQuestions = result.data as QuizRpcResponseRow[];
                        const shuffledData = [...allQuestions].sort(() => 0.5 - Math.random()).slice(0, 10);
                        data = shuffledData;
                    }
                }
            } else {
                // It's a custom course, query the table directly
                const queryResult = await db
                    .from('custom_quiz_questions')
                    .select('id, sentence, options, correct_answer')
                    .eq('tense_id', tenseId);
                
                if (queryResult.error) {
                    data = null;
                    error = queryResult.error;
                } else {
                    // Randomize and limit in the frontend
                    const shuffledData = queryResult.data ? [...queryResult.data].sort(() => 0.5 - Math.random()).slice(0, 10) : [];
                    data = shuffledData as QuizRpcResponseRow[];
                    error = null;
                }
            }

            if (error) throw error;

            if (data) { // data can be an empty array, which is valid
                const formattedQuestions: QuizQuestion[] = data.map(q => ({
                    id: q.id,
                    sentence: q.sentence,
                    correctAnswer: q.correct_answer,
                    options: [...(q.options as string[])].sort(() => Math.random() - 0.5),
                }));
                setQuizQuestions(formattedQuestions);
                setAnswers(formattedQuestions.map(q => ({ questionId: q.id, selectedAnswer: null, skipped: false })));
            }
        } catch (error: any) {
            console.error('Failed to fetch quiz questions:', error);
            // Let's refine error handling
            if (error.message && (error.message.includes(`relation "public.quiz_`) || error.message.includes('not configured'))) {
                toast.error(`The quiz for this built-in lesson is not available.`);
            } else if (error.message && error.message.includes(`does not exist`)) {
                toast.error('Custom quizzes require the "custom_quiz_questions" table in the database. Please contact an admin.', { duration: 6000 });
            } else {
                toast.error('Could not load the quiz. Please try again.');
            }
            navigate(`/course/${courseId}`);
        } finally {
            setIsLoading(false);
        }
    };

    fetchQuestions();
}, [courseId, tenseId, navigate]);


  const handleAnswerSelect = useCallback((questionId: string, answer: string) => {
    if (submitted || lockedAnswers.includes(questionId)) return;
    setAnswers(prev => prev.map(a => a.questionId === questionId ? { ...a, selectedAnswer: answer } : a));
    setLockedAnswers(prev => [...prev, questionId]);
  }, [submitted, lockedAnswers]);
  
  const getFiftyFiftyOptions = useCallback((question: QuizQuestion) => {
      if (!fiftyFiftyUsed.includes(question.id)) return question.options;
      const wrongOptions = question.options.filter(o => o !== question.correctAnswer);
      return [question.correctAnswer, wrongOptions[0]].sort(() => 0.5 - Math.random());
  }, [fiftyFiftyUsed]);
  
  useEffect(() => {
    if (activeQuestionId === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
        const keyNum = parseInt(e.key);
        if (keyNum >= 1 && keyNum <= 4) {
            e.preventDefault();
            const question = quizQuestions.find(q => q.id === activeQuestionId);
            if (!question) return;
            const options = getFiftyFiftyOptions(question);
            if (options[keyNum - 1]) {
                handleAnswerSelect(activeQuestionId, options[keyNum - 1]);
            }
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeQuestionId, quizQuestions, handleAnswerSelect, getFiftyFiftyOptions]);

  const allAnswered = useMemo(() => answers.length > 0 && answers.every(a => a.selectedAnswer !== null || a.skipped), [answers]);
  
  const usePowerUp = useCallback((type: 'hint' | '5050' | 'skip' | 'second-chance' | 'double-xp', questionId?: string) => {
    if (!userData) return;
    const powerUpKey = type;
    const available = ((userData.purchased_power_ups as Record<string, number>)?.[powerUpKey] || 0) - (usedPowerUps[powerUpKey] || 0);

    if (available <= 0) {
        toast.error(`No more ${powerUpKey.replace('-', ' ')} power-ups!`);
        return;
    }
    setUsedPowerUps(prev => ({ ...prev, [powerUpKey]: (prev[powerUpKey] || 0) + 1 }));

    switch (type) {
        case 'hint':
            if (questionId) setHintUsed(prev => [...prev, questionId]);
            break;
        case '5050':
            if (questionId) setFiftyFiftyUsed(prev => [...prev, questionId]);
            break;
        case 'skip':
            if (questionId) {
                setAnswers(prev => prev.map(a => a.questionId === questionId ? { ...a, skipped: true, selectedAnswer: 'skipped' } : a));
                setLockedAnswers(prev => [...prev, questionId]);
            }
            break;
        case 'second-chance':
             if (questionId) setLockedAnswers(prev => prev.filter(id => id !== questionId));
            break;
        case 'double-xp':
            setActivePowerUps(prev => ({...prev, 'double-xp': true}));
            toast.success('Double XP activated for this quiz!', { icon: '✨' });
            break;
    }
  }, [userData, usedPowerUps]);

  const handleSubmit = async () => {
    if (!userData || !courseId || quizQuestions.length === 0) return;

    let correctCount = 0;
    answers.forEach(ans => {
        if (ans.skipped) {
            correctCount++;
            return;
        }
        const question = quizQuestions.find(q => q.id === ans.questionId);
        if (question && question.correctAnswer === ans.selectedAnswer) {
            correctCount++;
        }
    });

    const calculatedScore = (correctCount / quizQuestions.length) * 100;
    setScore(calculatedScore);
    setSubmitted(true);
    
    let xpGained = Math.round(calculatedScore);
    if(activePowerUps['double-xp']) xpGained *= 2;
    let coinsGained = Math.round(calculatedScore / 2);
    
    const isCompleted = calculatedScore >= 75;
    const updatedProgress = JSON.parse(JSON.stringify(userData.course_progress || {}));
    if (!updatedProgress[courseId]) updatedProgress[courseId] = {};
    
    const existingProgress = updatedProgress[courseId][tenseId!];
    updatedProgress[courseId][tenseId!] = { 
        completed: existingProgress?.completed || isCompleted, 
        score: Math.max(existingProgress?.score || 0, calculatedScore) 
    };
    
    const tempUserDataForAchievementCheck: UserProfile = {
      ...userData,
      total_quizzes_completed: userData.total_quizzes_completed + 1,
      course_progress: updatedProgress,
    };
    
    const { newAchievements, totalXpReward, totalCoinReward } = checkAndAwardAchievements(tempUserDataForAchievementCheck, allCourses, courseId, calculatedScore);

    xpGained += totalXpReward;
    coinsGained += totalCoinReward;

    const finalAchievements = [...new Set([...userData.achievements, ...newAchievements.map(a => a.id)])];
    const newXp = userData.xp + xpGained;
    const newAiCoins = userData.ai_coins + coinsGained;
    
    const updatedPowerUps = { ...(userData.purchased_power_ups as Record<string, number>) };
    Object.keys(usedPowerUps).forEach(key => {
        updatedPowerUps[key] = (updatedPowerUps[key] || 0) - usedPowerUps[key];
    });

    try {
        await updateUserData({
            xp: newXp,
            ai_coins: newAiCoins,
            course_progress: updatedProgress,
            purchased_power_ups: updatedPowerUps,
            achievements: finalAchievements,
            total_quizzes_completed: userData.total_quizzes_completed + 1,
        });

        toast.success(`+${xpGained} XP, +${coinsGained} Coins!`, { duration: 4000, icon: '🎉' });
        newAchievements.forEach((ach, index) => {
            setTimeout(() => {
                showAchievementNotification(ach);
            }, index * 600);
        });

    } catch (error) {
        console.error("Failed to update user progress:", error);
    }
  };
  
  const tenseIndex = course?.tenses.findIndex(t => t.id === tenseId) ?? -1;
  const hasNext = tenseIndex !== -1 && course && tenseIndex < course.tenses.length - 1;

  const handleNextTense = () => {
    if (hasNext && course) {
      const nextTenseId = course.tenses[tenseIndex + 1].id;
      navigate(`/learn/${courseId}/${nextTenseId}`);
    } else {
        toast.success("Congratulations! You've completed all lessons in this course.");
        navigate(`/course/${courseId}`);
    }
  };
  
  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
    );
  }
  
  if (quizQuestions.length === 0 || !course) return <div className="p-4 text-center">Quiz not found or no questions available.</div>;
  
  if (submitted) {
    return (
      <div className="container mx-auto p-4 md:p-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Quiz Results</h1>
        <Card className="max-w-3xl mx-auto">
          <CircularProgress value={score} label="Your Score" />
          <div className="p-6 text-left space-y-4">
            {quizQuestions.map((q) => {
              const userAnswer = answers.find(a => a.questionId === q.id);
              const isCorrect = q.correctAnswer === userAnswer?.selectedAnswer;
              if(userAnswer?.skipped) {
                return <div key={q.id} className="p-4 rounded-lg border border-blue-500/50 bg-blue-500/10"><p className="font-semibold text-blue-400">Question skipped.</p></div>
              }
              return (
                <div key={q.id} className={`p-4 rounded-lg border ${isCorrect ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'}`}>
                  <p className="text-muted-foreground mb-2">{q.sentence.replace('___', `[${userAnswer?.selectedAnswer || 'No Answer'}]`)}</p>
                  <p className={`font-semibold text-${isCorrect ? 'green-400' : 'red-400'}`}>Your answer: {userAnswer?.selectedAnswer || 'N/A'}</p>
                  {!isCorrect && <p className="font-semibold text-green-400">Correct answer: {q.correctAnswer}</p>}
                </div>
              );
            })}
          </div>
          <div className="p-6 flex gap-4 justify-center">
             {score < 75 ? (
              <Button variant="outline" onClick={() => navigate(`/learn/${courseId}/${tenseId}`)}>Re-learn Tense</Button>
            ) : (
                <Button onClick={handleNextTense}>{hasNext ? 'Next Tense' : 'Finish Course'}</Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  const getAvailablePowerUps = (type: string) => {
    if (!userData?.purchased_power_ups) return 0;
    return ((userData.purchased_power_ups as Record<string, number>)?.[type] || 0) - (usedPowerUps[type] || 0);
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-2">Quiz Time!</h1>
      <p className="text-muted-foreground mb-8">Select the correct option for each question. Click a card to use keyboard shortcuts (1-4).</p>
      
      <div className="space-y-6">
        {quizQuestions.map((q, index) => {
            const currentAnswer = answers.find(a => a.questionId === q.id);
            if (currentAnswer?.skipped) {
                return <Card key={q.id}><div className="p-6 text-muted-foreground">Question {index + 1} has been skipped.</div></Card>
            }
            const options = getFiftyFiftyOptions(q);
            const showHint = hintUsed.includes(q.id);
            const isLocked = lockedAnswers.includes(q.id);

            return (
                 <Card 
                    key={q.id} 
                    onClick={() => setActiveQuestionId(q.id)}
                    className={`transition-all ${activeQuestionId === q.id ? 'ring-2 ring-primary' : 'ring-2 ring-transparent'} ${isLocked ? 'border-primary/30' : ''}`}
                    data-interactive
                  >
                    <div className="p-6">
                        <div className="flex justify-between items-start">
                           <p className="text-xl text-foreground mb-4">
                              <span className="font-bold text-primary mr-3">{index + 1}.</span>
                               {q.sentence.split('___')[0]}
                               <span className="inline-block w-24 border-b-2 border-dashed border-muted-foreground mx-2 align-middle"></span>
                               {q.sentence.split('___')[1]}
                          </p>
                          {showHint && <div className="flex items-center gap-1 text-sm text-coin p-1 bg-coin/10 rounded-md"><HelpCircle className="h-4 w-4"/>Hint: {q.correctAnswer.charAt(0)}...</div>}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {options.map(option => (
                                <Button 
                                    key={option}
                                    variant={currentAnswer?.selectedAnswer === option ? 'default' : 'outline'}
                                    onClick={(e) => { e.stopPropagation(); handleAnswerSelect(q.id, option)}}
                                    className={`text-base w-full transition-all ${isLocked && currentAnswer?.selectedAnswer !== option ? 'opacity-50' : ''}`}
                                    disabled={isLocked}
                                >
                                    {option}
                                </Button>
                            ))}
                        </div>
                        <div className="border-t border-border mt-4 pt-3 flex flex-wrap gap-2 justify-center">
                            <Button size="sm" variant="ghost" className="text-xs" onClick={(e) => { e.stopPropagation(); usePowerUp('hint', q.id) }} disabled={hintUsed.includes(q.id) || isLocked}><Lightbulb className="mr-1 h-4 w-4"/> Hint ({getAvailablePowerUps('hint')})</Button>
                            <Button size="sm" variant="ghost" className="text-xs" onClick={(e) => { e.stopPropagation(); usePowerUp('5050', q.id) }} disabled={fiftyFiftyUsed.includes(q.id) || isLocked}><ShieldHalf className="mr-1 h-4 w-4"/> 50/50 ({getAvailablePowerUps('5050')})</Button>
                            <Button size="sm" variant="ghost" className="text-xs" onClick={(e) => { e.stopPropagation(); usePowerUp('second-chance', q.id) }} disabled={!isLocked}><RotateCcw className="mr-1 h-4 w-4"/> 2nd Chance ({getAvailablePowerUps('second-chance')})</Button>
                            <Button size="sm" variant="ghost" className="text-xs" onClick={(e) => { e.stopPropagation(); usePowerUp('skip', q.id) }} disabled={isLocked}><SkipForward className="mr-1 h-4 w-4"/> Skip ({getAvailablePowerUps('skip')})</Button>
                            <Button size="sm" variant="ghost" className="text-xs" onClick={(e) => { e.stopPropagation(); usePowerUp('double-xp') }} disabled={activePowerUps['double-xp']}><Star className="mr-1 h-4 w-4"/> 2x XP ({getAvailablePowerUps('double-xp')})</Button>
                        </div>
                    </div>
                </Card>
            )
        })}
      </div>
       <div className="mt-8 text-center">
          <Button size="lg" onClick={handleSubmit} disabled={!allAnswered}>
            Submit Answers
          </Button>
      </div>
    </div>
  );
};

export default QuizPage;