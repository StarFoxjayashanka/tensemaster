import React, { useState, useEffect, useMemo } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { GrammarDetectiveChallenge } from '../types';
import Button from '../components/Button';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/Card';
import { Loader2, ArrowLeft, Search, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const GrammarDetectivePage: React.FC = () => {
    const navigate = ReactRouterDOM.useNavigate();
    const { updateUserData, userData } = useAuth();
    const [challenge, setChallenge] = useState<GrammarDetectiveChallenge | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
    const [submitted, setSubmitted] = useState(false);
    const [results, setResults] = useState<{ correct: Set<string>; incorrect: Set<string>; missed: Set<string> } | null>(null);
    const [paragraphKey, setParagraphKey] = useState(Date.now());


    const fetchChallenge = async () => {
        setLoading(true);
        setSubmitted(false);
        setSelectedWords(new Set());
        setResults(null);
        setChallenge(null);
        setParagraphKey(Date.now());

        try {
            const { data, error } = await db.from('challenge_grammar_detective').select('*');
            if (error) throw error;
            if (data && data.length > 0) {
                const randomChallenge = data[Math.floor(Math.random() * data.length)];
                setChallenge(randomChallenge as GrammarDetectiveChallenge);
            } else {
                toast.error("No 'Grammar Detective' challenges found in the database.");
                navigate('/gauntlet');
            }
        } catch (error: any) {
            console.error("Failed to fetch Grammar Detective challenge:", error);
            if (error.message.includes('relation "public.challenge_grammar_detective" does not exist')) {
                toast.error("Database setup needed: 'Grammar Detective' table not found.", { duration: 6000 });
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

    const words = useMemo(() => {
        if (!challenge) return [];
        // Regex to split by space while keeping punctuation attached to words
        return challenge.paragraph.split(/(\s+)/).filter(w => w.trim().length > 0);
    }, [challenge]);

    const handleWordClick = (word: string) => {
        if (submitted) return;
        const cleanedWord = word.replace(/[.,!?]/g, '');
        setSelectedWords(prev => {
            const newSet = new Set(prev);
            if (newSet.has(cleanedWord)) {
                newSet.delete(cleanedWord);
            } else {
                newSet.add(cleanedWord);
            }
            return newSet;
        });
    };

    const handleSubmit = async () => {
        if (!challenge || !userData) return;
        setSubmitted(true);
        const errorSet = new Set(challenge.errors.map(e => e.incorrect));
        
        const correctSelections = new Set([...selectedWords].filter(word => errorSet.has(word)));
        const incorrectSelections = new Set([...selectedWords].filter(word => !errorSet.has(word)));
        const missedSelections = new Set([...errorSet].filter(error => !selectedWords.has(error)));

        setResults({ correct: correctSelections, incorrect: incorrectSelections, missed: missedSelections });
        
        const score = correctSelections.size - incorrectSelections.size;
        const xpGained = Math.max(0, 50 + score * 10);
        const coinsGained = Math.max(0, 25 + score * 5);

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

    const renderWord = (word: string, index: number) => {
        const cleanedWord = word.replace(/[.,!?]/g, '');
        let className = "transition-all duration-200 rounded p-1 -m-1";
        let title = '';
        const interactiveProps = submitted ? {} : { 'data-interactive': true };
        
        if (submitted && results && challenge) {
            className = "rounded p-1 -m-1"; // Not clickable after submit
            const errorInfo = challenge.errors.find(e => e.incorrect === cleanedWord);

            if (results.correct.has(cleanedWord) && errorInfo) {
                className += ' bg-green-500/30 text-green-300 underline decoration-dotted';
                title = `Correction: ${errorInfo.correct}`;
            } else if (results.incorrect.has(cleanedWord)) {
                className += ' bg-red-500/30 text-red-300 line-through';
            } else if (results.missed.has(cleanedWord) && errorInfo) {
                className += ' bg-yellow-500/30 text-yellow-300 underline decoration-wavy';
                title = `Missed! Correction: ${errorInfo.correct}`;
            }
        } else {
             if (selectedWords.has(cleanedWord)) {
                className += ' bg-primary/30 text-primary-foreground';
            } else {
                className += ' hover:bg-secondary';
            }
        }
       
        return <span key={`${paragraphKey}-${index}`} className={className} onClick={() => handleWordClick(word)} title={title} {...interactiveProps}>{word} </span>;
    };

    if (loading) {
        return <div className="flex items-center justify-center h-[calc(100vh-80px)]"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="mb-6">
                <Button variant="ghost" onClick={() => navigate('/gauntlet')} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Gauntlet
                </Button>
                <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3"><Search className="w-10 h-10 text-primary"/>Grammar Detective</h1>
                <p className="text-muted-foreground mt-2">Find and click on all the grammatical errors in the paragraph below.</p>
            </header>

            <Card>
                <CardContent className="pt-6">
                    <p className="text-xl leading-relaxed">
                        {words.map(renderWord)}
                    </p>
                </CardContent>
            </Card>

            {submitted && results && challenge && (
                <Card className="mt-6 border-accent">
                    <CardHeader>
                        <CardTitle>Results</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-green-500/10">
                                <h3 className="font-bold text-lg text-green-400 flex items-center gap-2"><CheckCircle/>Correctly Found</h3>
                                <p className="text-2xl font-bold">{results.correct.size}</p>
                            </div>
                             <div className="p-4 rounded-lg bg-red-500/10">
                                <h3 className="font-bold text-lg text-red-400 flex items-center gap-2"><XCircle/>Incorrectly Selected</h3>
                                <p className="text-2xl font-bold">{results.incorrect.size}</p>
                            </div>
                             <div className="p-4 rounded-lg bg-yellow-500/10">
                                <h3 className="font-bold text-lg text-yellow-400 flex items-center gap-2"><Search/>Errors Missed</h3>
                                <p className="text-2xl font-bold">{results.missed.size}</p>
                            </div>
                        </div>
                        <div className="p-4 rounded-lg bg-secondary/50">
                             <h3 className="font-bold text-lg text-foreground mb-2">Corrections</h3>
                             {challenge.errors.length > 0 ? (
                                <ul className="list-disc list-inside space-y-1">
                                    {challenge.errors.map(error => (
                                        <li key={error.incorrect}>
                                            <span className="text-red-400 line-through">{error.incorrect}</span> → <span className="text-green-400">{error.correct}</span>
                                        </li>
                                    ))}
                                </ul>
                             ) : (
                                <p className="text-muted-foreground">There were no errors in this paragraph.</p>
                             )}
                        </div>
                    </CardContent>
                     <CardFooter className="gap-2">
                        <Button variant="secondary" onClick={fetchChallenge}>Try Another</Button>
                        <Button onClick={() => navigate('/gauntlet')}>Back to Gauntlet</Button>
                    </CardFooter>
                </Card>
            )}

            {!submitted && (
                <div className="mt-6 flex justify-center">
                    <Button size="lg" onClick={handleSubmit} disabled={selectedWords.size === 0}>
                        Submit Selections ({selectedWords.size})
                    </Button>
                </div>
            )}
        </div>
    );
};

export default GrammarDetectivePage;