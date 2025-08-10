import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import Button from '../components/Button';
import { Search, Puzzle, Zap, ArrowLeft, Sparkles } from 'lucide-react';

const gauntletModes = [
    { id: 'detective', name: 'Grammar Detective', description: 'Read a paragraph and identify all the grammatical errors by clicking on the incorrect words. A true test of your proofreading skills.', icon: Search, path: '/gauntlet/detective' },
    { id: 'cloze', name: 'Context is King', description: 'Fill in the blanks in a short story. You must choose the correct tense of the verb to make the narrative flow correctly.', icon: Puzzle, path: '/gauntlet/cloze' },
    { id: 'identification', name: 'Rapid Identification', description: 'Sentences will appear one after another. Your job is to quickly identify which tense is being used. Speed and accuracy are key!', icon: Zap, path: '/gauntlet/identification' },
];


const GauntletPage: React.FC = () => {
    const navigate = ReactRouterDOM.useNavigate();

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="mb-8">
                <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
                </Button>
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight">The Grammar Gauntlet</h1>
                        <p className="text-muted-foreground mt-2">
                            Go beyond quizzes. Put your grammar knowledge to the test with these practical challenges.
                        </p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {gauntletModes.map((mode) => {
                    const Icon = mode.icon;
                    return (
                        <Card 
                            key={mode.id} 
                            className="hover:border-primary transition-colors flex flex-col"
                        >
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                    <Icon className="w-10 h-10 text-primary" />
                                    <div>
                                        <CardTitle className="text-2xl">{mode.name}</CardTitle>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <CardDescription>{mode.description}</CardDescription>
                            </CardContent>
                            <div className="p-6 pt-0">
                               <Button className="w-full" variant="secondary" onClick={() => navigate(mode.path)}>Start Challenge</Button>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default GauntletPage;