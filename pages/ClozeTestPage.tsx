import React, { useState, useEffect, useMemo } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { ClozeTestChallenge } from '../types';
import Button from '../components/Button';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/Card';
import { Loader2, ArrowLeft, Puzzle } from 'lucide-react';
import toast from 'react-hot-toast';

const ClozeTestPage: React.FC = () => {
    const navigate = ReactRouterDOM.useNavigate();
    const { updateUserData, userData } = useAuth();
    const [challenge, setChallenge] = useState<ClozeTestChallenge | null>(null);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);

    const fetchChallenge = async () => {
        setLoading(true);
        setSubmitted(false);
        setAnswers({});
        setScore(0);
        setChallenge(null);
        try {
            const { data, error } = await db.from('challenge_cloze_test').select('*');
            if (error) throw error;
            if (data && data.length > 0) {
                const randomChallenge = data[Math.floor(Math.random() * data.length)];
                setChallenge(randomChallenge as ClozeTestChallenge);
            } else {
                toast.error("No 'Context is King' challenges found in the database.");
                navigate('/gauntlet');
            }
        } catch (error: any) {
            console.error("Failed to fetch Cloze Test challenge:", error);
            if (error.message.includes('relation "public.challenge_cloze_test" does not exist')) {
                toast.error("Database setup needed: 'Context is King' table not found.", { duration: 6000 });
            } else {
                toast.error("Could not load challenge. Please try again.");
            }
            navigate('/gauntlet');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChallenge();
    }, []);

    const handleAnswerChange = (blankId: number, value: string) => {
        setAnswers(prev => ({ ...prev, [blankId]: value }));
    };

    const renderedStory = useMemo(() => {
        if (!challenge) return null;
        
        const parts = challenge.story_template.split(/(___\d+___)/g);

        return parts.map((part, index) => {
            const match = part.match(/___(\d+)___/);
            if (match) {
                const blankId = parseInt(match[1], 10);
                const blankData = challenge.blanks.find(b => b.id === blankId);
                if (!blankData) return <span key={index} className="font-bold text-red-500">[Error: Blank {blankId}]</span>;

                if (submitted) {
                    const userAnswer = answers[blankId];
                    const isCorrect = userAnswer === blankData.correct_answer;
                    const color = isCorrect ? 'text-green-400 border-green-500' : 'text-red-400 border-red-500';
                    return <strong key={index} className={`font-bold border-b-2 ${color} mx-1`}>{userAnswer || '(unanswered)'}</strong>
                }

                return (
                    <select
                        key={index}
                        value={answers[blankId] || ''}
                        onChange={(e) => handleAnswerChange(blankId, e.target.value)}
                        className="inline-block mx-1 p-1 rounded-md bg-secondary border border-border text-foreground focus:ring-2 focus:ring-primary"
                    >
                        <option value="" disabled>Select...</option>
                        {blankData.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                );
            }
            return <span key={index}>{part}</span>;
        });
    }, [challenge, answers, submitted]);

    const handleSubmit = async () => {
        if (!challenge || !userData) return;
        
        let correctCount = 0;
        challenge.blanks.forEach(blank => {
            if (answers[blank.id] === blank.correct_answer) {
                correctCount++;
            }
        });

        const calculatedScore = (correctCount / challenge.blanks.length) * 100;
        setScore(calculatedScore);
        setSubmitted(true);

        const xpGained = Math.round(50 + calculatedScore * 0.5);
        const coinsGained = Math.round(25 + calculatedScore * 0.25);
        
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

    const allAnswered = challenge ? Object.keys(answers).length === challenge.blanks.length : false;

    if (loading) {
        return <div className="flex items-center justify-center h-[calc(100vh-80px)]"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
    }

    if (!challenge) return null;

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="mb-6">
                <Button variant="ghost" onClick={() => navigate('/gauntlet')} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Gauntlet
                </Button>
                <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3"><Puzzle className="w-10 h-10 text-primary"/>Context is King</h1>
                <p className="text-muted-foreground mt-2">Read the story and fill in the blanks with the correct verb forms.</p>
            </header>

            <Card>
                <CardContent className="pt-6">
                    <div className="text-xl leading-loose">
                        {renderedStory}
                    </div>
                </CardContent>
            </Card>

            {submitted && (
                <Card className="mt-6 border-accent">
                    <CardHeader>
                        <CardTitle>Results</CardTitle>
                        <CardDescription>You scored {Math.round(score)}%.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc list-inside space-y-2">
                           {challenge.blanks.map(blank => {
                               const userAnswer = answers[blank.id];
                               const isCorrect = userAnswer === blank.correct_answer;
                               return (
                                   <li key={blank.id} className={isCorrect ? 'text-green-400' : 'text-red-400'}>
                                       Blank {blank.id}: Your answer "{userAnswer || 'N/A'}" was {isCorrect ? 'correct' : `incorrect. Correct was "${blank.correct_answer}"`}.
                                   </li>
                               );
                           })}
                        </ul>
                    </CardContent>
                     <CardFooter className="gap-2">
                        <Button variant="secondary" onClick={fetchChallenge}>Try Another Story</Button>
                        <Button onClick={() => navigate('/gauntlet')}>Back to Gauntlet</Button>
                    </CardFooter>
                </Card>
            )}

            {!submitted && (
                <div className="mt-6 flex justify-center">
                    <Button size="lg" onClick={handleSubmit} disabled={!allAnswered}>
                        {!allAnswered ? 'Complete all blanks to submit' : 'Submit Answers'}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default ClozeTestPage;