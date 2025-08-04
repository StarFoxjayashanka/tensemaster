import React, { useState, useMemo, useEffect, useCallback } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { db, Json } from '../services/firebase';
import Button from '../components/Button';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { QuizQuestion } from '../types';
import { ArrowLeft, Clock, Loader2, Zap, PlayCircle } from 'lucide-react';
import CircularProgress from '../components/CircularProgress';

const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
};

const challengeModeDetails = {
  classic: { name: 'Classic Challenge', icon: PlayCircle, description: "A balanced mix of questions from all courses. Test your overall knowledge." },
  hard: { name: 'Hard Mode', icon: Zap, description: "Face trickier distractors and more complex sentences. A true test of your skills." },
  'time-attack': { name: 'Time Attack', icon: Clock, description: "Answer as many questions as you can in one minute. Speed and accuracy are key!" },
};

const StickyTimerBar: React.FC<{ timeLeft: number; totalTime: number }> = ({ timeLeft, totalTime }) => {
  const percentage = (timeLeft / totalTime) * 100;
  let colorClass = 'bg-primary';
  if (percentage < 50 && percentage >= 25) {
    colorClass = 'bg-yellow-500';
  } else if (percentage < 25) {
    colorClass = 'bg-destructive';
  }

  return (
    <div className="fixed top-0 left-0 right-0 h-2 z-50 bg-secondary md:hidden">
      <div
        className={`h-full ${colorClass} transition-all duration-1000 ease-linear`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};


const DailyChallengePage: React.FC = () => {
  const navigate = ReactRouterDOM.useNavigate();
  const { mode } = ReactRouterDOM.useParams<{ mode: string }>();
  const { userData, updateUserData } = useAuth();
  
  const [dailyQuestions, setDailyQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [lockedAnswers, setLockedAnswers] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState('');
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timer, setTimer] = useState(60); // 1 minute for time attack

  const challengeDetails = mode ? challengeModeDetails[mode as keyof typeof challengeModeDetails] : null;

  const lastCompletedDate = userData ? new Date(userData.last_challenge_completed) : new Date(0);
  const canTakeChallenge = !isSameDay(lastCompletedDate, new Date());
  
  const handleSubmit = useCallback(async () => {
    if (!userData || dailyQuestions.length === 0 || submitted) return;

    setSubmitted(true);

    let correctCount = 0;
    answers.forEach((ans, index) => {
        if (dailyQuestions[index]?.correctAnswer === ans) {
            correctCount++;
        }
    });

    const answeredCount = answers.filter(a => a !== null).length;
    const totalQuestionsForScore = mode === 'time-attack' ? answeredCount : dailyQuestions.length;
    const calculatedScore = totalQuestionsForScore > 0 ? (correctCount / totalQuestionsForScore) * 100 : 0;
    setScore(calculatedScore);

    const xpGained = mode === 'hard' ? 250 : mode === 'time-attack' ? Math.round(50 + (100 * (calculatedScore / 100))) : 150;
    const coinsGained = mode === 'hard' ? 125 : mode === 'time-attack' ? Math.round(25 + (50 * (calculatedScore / 100))) : 75;

    try {
        await updateUserData({
            xp: userData.xp + xpGained,
            ai_coins: userData.ai_coins + coinsGained,
            last_challenge_completed: new Date().toISOString(),
        });
        toast.success(`Challenge complete! +${xpGained} XP, +${coinsGained} Coins!`, { icon: '🎉' });
    } catch (error) {
        console.error("Failed to update user data after challenge:", error);
    }
  }, [userData, dailyQuestions, answers, submitted, updateUserData, mode]);


  useEffect(() => {
    if (submitted) return;

    if(!canTakeChallenge) {
        setIsLoading(false);
        const interval = setInterval(() => {
            const now = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(now.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            const diff = tomorrow.getTime() - now.getTime();
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
        }, 1000);
        return () => clearInterval(interval);
    } else {
       const fetchQuestions = async () => {
            if (!mode) {
                toast.error('Invalid challenge mode.');
                navigate('/');
                return;
            }
            setIsLoading(true);
            try {
                let query;
                const tableName = `challenge_${mode.replace(/-/g, '_')}`;

                switch(tableName) {
                    case 'challenge_classic': query = db.from('challenge_classic').select('id, sentence, options, correct_answer'); break;
                    case 'challenge_hard': query = db.from('challenge_hard').select('id, sentence, options, correct_answer'); break;
                    case 'challenge_time_attack': query = db.from('challenge_time_attack').select('id, sentence, options, correct_answer'); break;
                    default:
                        throw new Error(`Invalid challenge mode: ${mode}`);
                }
                const { data, error } = await query;
                if (error) throw error;

                if (data) {
                    const questionCount = mode === 'time-attack' ? 20 : 10;
                    const allQuestions = data as any[];
                    const shuffledQuestions = [...allQuestions].sort(() => 0.5 - Math.random()).slice(0, questionCount);

                    const formattedQuestions: QuizQuestion[] = shuffledQuestions.map(q => ({
                        id: q.id,
                        sentence: q.sentence,
                        correctAnswer: q.correct_answer,
                        options: [...(q.options as string[])].sort(() => Math.random() - 0.5),
                    }));
                    setDailyQuestions(formattedQuestions);
                    setAnswers(new Array(formattedQuestions.length).fill(null));
                }
            } catch (error: any) {
                console.error('Failed to fetch daily challenge questions:', error.message || error);
                toast.error('Could not load the daily challenge. Please try again.');
                navigate(`/`);
            } finally {
                setIsLoading(false);
            }
        };
        fetchQuestions();
    }
  }, [canTakeChallenge, navigate, mode, submitted]);
  
  useEffect(() => {
    if (mode !== 'time-attack' || submitted || isLoading || !canTakeChallenge) return;
    
    if (timer === 0) {
        if (!submitted) {
            handleSubmit();
        }
        return;
    }
    const intervalId = setInterval(() => {
        setTimer(t => Math.max(0, t - 1));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [mode, timer, submitted, isLoading, canTakeChallenge, handleSubmit]);


  const handleAnswerSelect = useCallback((index: number, answer: string) => {
    if (submitted || lockedAnswers.includes(index)) return;
    setAnswers(prevAnswers => {
      const newAnswers = [...prevAnswers];
      newAnswers[index] = answer;
      return newAnswers;
    });
    setLockedAnswers(prevLocked => [...prevLocked, index]);
  }, [submitted, lockedAnswers]);

  useEffect(() => {
      if (activeQuestionIndex === null || lockedAnswers.includes(activeQuestionIndex)) return;

      const handleKeyDown = (e: KeyboardEvent) => {
          const keyNum = parseInt(e.key);
          if (keyNum >= 1 && keyNum <= 4) {
              e.preventDefault();
              const question = dailyQuestions[activeQuestionIndex];
              if (question && question.options[keyNum - 1]) {
                  handleAnswerSelect(activeQuestionIndex, question.options[keyNum - 1]);
              }
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeQuestionIndex, dailyQuestions, handleAnswerSelect, lockedAnswers]);

  const allAnswered = useMemo(() => answers.length > 0 && answers.every(a => a !== null), [answers]);
  
  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
    );
  }

  // This logic must come *after* loading, but *before* the main content render.
  if (submitted) {
    const answeredCount = answers.filter(a => a !== null).length;
    const correctCount = answers.filter((a,i) => dailyQuestions[i]?.correctAnswer === a).length;
    
    return (
      <div className="container mx-auto p-4 md:p-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Challenge Results</h1>
        <Card className="max-w-3xl mx-auto">
          <CircularProgress value={score} label="Your Score" />
          <CardHeader>
            <CardDescription>
                {mode === 'time-attack' 
                    ? `You answered ${answeredCount} questions and got ${correctCount} correct.` 
                    : `You got ${correctCount} out of ${dailyQuestions.length} correct.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-2 max-h-96 overflow-y-auto pr-2 text-left">
                {dailyQuestions.map((q, index) => {
                    const userAnswer = answers[index];
                    if (mode === 'time-attack' && userAnswer === null) return null; // Don't show unanswered questions
                    const isCorrect = q.correctAnswer === userAnswer;
                    return (
                        <div key={q.id} className={`p-3 rounded-lg border text-left mb-2 ${isCorrect ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'}`}>
                            <p className="text-muted-foreground mb-1 text-sm">{q.sentence.replace('___', `[${userAnswer || 'No Answer'}]`)}</p>
                            <p className={`font-semibold text-sm text-${isCorrect ? 'green-400' : 'red-400'}`}>Your answer: {userAnswer || 'N/A'}</p>
                            {!isCorrect && <p className="font-semibold text-sm text-green-400">Correct answer: {q.correctAnswer}</p>}
                        </div>
                    )
                })}
            </div>
            <Button onClick={() => navigate('/')} className="mt-6">Back to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!canTakeChallenge) {
      return (
         <div className="container mx-auto p-4 md:p-8 text-center">
            <Card className="max-w-xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-3xl">Challenge Completed!</CardTitle>
                    <CardDescription>You've already completed today's challenge. Come back tomorrow for a new one.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center gap-4">
                        <Clock className="w-16 h-16 text-primary"/>
                        <p className="text-lg">Next challenge in:</p>
                        <p className="text-4xl font-bold font-mono tracking-wider">{timeLeft}</p>
                        <Button onClick={() => navigate('/')} className="mt-4">
                            <ArrowLeft className="mr-2 h-4 w-4"/> Back to Home
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      )
  }
  
  if (!challengeDetails) return null;
  const ChallengeIcon = challengeDetails.icon;

  return (
    <div className="container mx-auto p-4 md:p-8 pt-10 md:pt-8">
      {mode === 'time-attack' && <StickyTimerBar timeLeft={timer} totalTime={60} />}
      <div className="flex justify-between items-start mb-2">
        <div>
            <h1 className="text-3xl font-bold flex items-center gap-3"><ChallengeIcon className="w-8 h-8 text-primary"/>{challengeDetails.name}</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">{challengeDetails.description}</p>
        </div>
        {mode === 'time-attack' && (
            <Card className="hidden md:block p-3 text-center bg-card/80 backdrop-blur-sm">
                <p className="text-sm text-muted-foreground">Time Left</p>
                <p className="text-2xl font-bold font-mono text-primary">
                    {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
                </p>
            </Card>
        )}
      </div>
      <p className="text-muted-foreground mb-8">Click a card to use keyboard shortcuts (1-4). Answers lock after selection.</p>
      
      <div className="space-y-6">
        {dailyQuestions.map((q, index) => {
          const isLocked = lockedAnswers.includes(index);
          return (
            <Card 
              key={`${q.id}-${index}`}
              onClick={() => setActiveQuestionIndex(index)}
              className={`transition-all ${activeQuestionIndex === index ? 'ring-2 ring-primary' : 'ring-2 ring-transparent'} ${isLocked ? 'border-primary/30' : ''}`}
              data-interactive
            >
              <div className="p-6">
                  <p className="text-xl text-foreground mb-4">
                      <span className="font-bold text-primary mr-3">{index + 1}.</span>
                      {q.sentence.split('___')[0]}
                      <span className="inline-block w-24 border-b-2 border-dashed border-muted-foreground mx-2 align-middle"></span>
                      {q.sentence.split('___')[1]}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {q.options.map(option => (
                          <Button 
                              key={option}
                              variant={answers[index] === option ? 'default' : 'outline'}
                              onClick={(e) => { e.stopPropagation(); handleAnswerSelect(index, option); }}
                              className={`text-base w-full transition-all ${isLocked && answers[index] !== option ? 'opacity-50' : ''}`}
                              disabled={isLocked}
                          >
                              {option}
                          </Button>
                      ))}
                  </div>
              </div>
            </Card>
        )})}
      </div>
       <div className="mt-8 text-center">
          <Button size="lg" onClick={handleSubmit} disabled={mode !== 'time-attack' && !allAnswered}>
            {mode === 'time-attack' ? 'Finish Early & Submit' : (allAnswered ? 'Submit Challenge' : 'Answer all questions to submit')}
          </Button>
      </div>
    </div>
  );
};

export default DailyChallengePage;