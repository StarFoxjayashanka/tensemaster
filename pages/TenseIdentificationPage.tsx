import React, { useState, useEffect, useMemo, useCallback } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { TenseIdentificationChallenge } from '../types';
import Button from '../components/Button';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/Card';
import CircularProgress from '../components/CircularProgress';
import { Loader2, ArrowLeft, Zap, ChevronsRight } from 'lucide-react';
import toast from 'react-hot-toast';

const ALL_TENSE_NAMES = [
  'Simple Present', 'Present Continuous', 'Present Perfect', 'Present Perfect Continuous',
  'Simple Past', 'Past Continuous', 'Past Perfect', 'Past Perfect Continuous',
  'Simple Future', 'Future Continuous', 'Future Perfect', 'Future Perfect Continuous',
  'Present Simple Passive', 'Past Simple Passive', 'Future Simple Passive',
  'Reported Statements', 'Reported Questions'
];

const shuffleArray = <T,>(array: T[]): T[] => [...array].sort(() => Math.random() - 0.5);

const TenseIdentificationPage: React.FC = () => {
    const navigate = ReactRouterDOM.useNavigate();
    const { updateUserData, userData } = useAuth();
    const [challenges, setChallenges] = useState<TenseIdentificationChallenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<string[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);

    const fetchChallenges = async () => {
        setLoading(true);
        setSubmitted(false);
        setAnswers([]);
        setScore(0);
        setChallenges([]);
        setCurrentQuestionIndex(0);
        try {
            const { data, error } = await db.from('challenge_tense_identification').select('*');
            if (error) throw error;
            if (data && data.length > 0) {
                const shuffled = shuffleArray(data as TenseIdentificationChallenge[]);
                setChallenges(shuffled.slice(0, 10)); // Take 10 questions per session
                setAnswers(new Array(Math.min(10, shuffled.length)).fill(null));
            } else {
                toast.error("No 'Rapid Identification' challenges found in the database.");
                navigate('/gauntlet');
            }
        } catch (error: any) {
            console.error("Failed to fetch Tense Identification challenges:", error);
            if (error.message.includes('relation "public.challenge_tense_identification" does not exist')) {
                toast.error("Database setup needed: 'Rapid Identification' table not found.", { duration: 6000 });
            } else {
                toast.error("Could not load challenges. Please try again.");
            }
            navigate('/gauntlet');
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchChallenges();
    }, []);

    const currentChallenge = useMemo(() => challenges[currentQuestionIndex], [challenges, currentQuestionIndex]);

    const options = useMemo(() => {
        if (!currentChallenge) return [];
        const wrongOptions = shuffleArray(
            ALL_TENSE_NAMES.filter(name => name !== currentChallenge.correct_tense_name)
        ).slice(0, 3);
        return shuffleArray([currentChallenge.correct_tense_name, ...wrongOptions]);
    }, [currentChallenge]);

    const handleAnswerSelect = (answer: string) => {
        const newAnswers = [...answers];
        newAnswers[currentQuestionIndex] = answer;
        setAnswers(newAnswers);

        // Auto-advance
        setTimeout(() => {
             if (currentQuestionIndex < challenges.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
            } else {
                handleSubmit(newAnswers);
            }
        }, 300);
    };

    const handleSubmit = async (finalAnswers: string[]) => {
        if (!userData) return;
        let correctCount = 0;
        challenges.forEach((challenge, index) => {
            if (finalAnswers[index] === challenge.correct_tense_name) {
                correctCount++;
            }
        });
        const calculatedScore = (correctCount / challenges.length) * 100;
        setScore(calculatedScore);
        setSubmitted(true);

        const xpGained = Math.round(50 + calculatedScore * 0.75);
        const coinsGained = Math.round(25 + calculatedScore * 0.5);

        try {
            await updateUserData({
                xp: userData.xp + xpGained,
                ai_coins: userData.ai_coins + coinsGained,
            });
            toast.success(`Challenge complete! +${xpGained} XP, +${coinsGained} Coins!`, { icon: '🎉' });
        } catch(e) {
            console.error("Failed to update user data", e);
            toast.error("Could not save your rewards.");
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-[calc(100vh-80px)]"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
    }

    if (submitted) {
        return (
            <div className="container mx-auto p-4 md:p-8 text-center">
                <h1 className="text-3xl font-bold mb-4">Challenge Results</h1>
                <Card className="max-w-3xl mx-auto">
                    <CircularProgress value={score} label="Your Score" />
                    <CardHeader>
                       <CardDescription>
                         You got {answers.filter((a, i) => a === challenges[i].correct_tense_name).length} out of {challenges.length} correct.
                       </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-left">
                           {challenges.map((q, index) => {
                                const userAnswer = answers[index];
                                const isCorrect = q.correct_tense_name === userAnswer;
                                return (
                                    <div key={q.id} className={`p-3 rounded-lg border ${isCorrect ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'}`}>
                                        <p className="text-muted-foreground mb-1 text-sm">Sentence: "{q.sentence}"</p>
                                        <p className={`font-semibold text-sm ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>Your answer: {userAnswer || 'N/A'}</p>
                                        {!isCorrect && <p className="font-semibold text-sm text-green-400">Correct answer: {q.correct_tense_name}</p>}
                                    </div>
                                )
                           })}
                        </div>
                    </CardContent>
                    <CardFooter className="gap-2 justify-center">
                        <Button variant="secondary" onClick={fetchChallenges}>Play Again</Button>
                        <Button onClick={() => navigate('/gauntlet')}>Back to Gauntlet</Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    if (!currentChallenge) {
         return <div className="p-4 text-center">No challenges loaded.</div>;
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="mb-6">
                 <Button variant="ghost" onClick={() => navigate('/gauntlet')} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Gauntlet
                </Button>
                <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3"><Zap className="w-10 h-10 text-primary"/>Rapid Identification</h1>
                <p className="text-muted-foreground mt-2">Quickly identify the correct tense for each sentence.</p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Question {currentQuestionIndex + 1} of {challenges.length}</CardTitle>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary mt-2">
                        <div
                            className="h-full w-full flex-1 bg-primary transition-all duration-300"
                            style={{ transform: `translateX(-${100 - ((currentQuestionIndex + 1) / challenges.length) * 100}%)` }}
                        />
                    </div>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-2xl md:text-3xl font-semibold text-foreground my-8">"{currentChallenge.sentence}"</p>
                </CardContent>
            </Card>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {options.map((option, i) => (
                    <Button 
                        key={i} 
                        size="lg"
                        variant="outline"
                        className="text-lg justify-start p-6 h-auto text-left"
                        onClick={() => handleAnswerSelect(option)}
                    >
                        {option}
                    </Button>
                ))}
            </div>
        </div>
    );
};

export default TenseIdentificationPage;