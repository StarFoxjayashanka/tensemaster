import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import * as ReactRouterDOM from 'react-router-dom';
import { getAllCoursesData } from '../data/course-data';
import { Course } from '../types';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import Button from '../components/Button';
import { ArrowLeft, BarChart2, Award, Brain, TrendingDown, BarChartHorizontal, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const StatCard: React.FC<{icon: React.ReactNode, label: string, value: string | number}> = ({ icon, label, value }) => (
    <Card className="p-4 bg-secondary/50">
        <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/20 rounded-lg text-primary">{icon}</div>
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold">{value}{label === 'Average Score' && '%'}</p>
            </div>
        </div>
    </Card>
);


const ProgressDetailsPage: React.FC = () => {
    const { userData } = useAuth();
    const navigate = ReactRouterDOM.useNavigate();

    const [coursesData, setCoursesData] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            const data = await getAllCoursesData();
            setCoursesData(data);
            setLoading(false);
        }
        fetchAll();
    }, []);

    const performanceMetrics = useMemo(() => {
        if (!userData || !userData.course_progress || coursesData.length === 0) {
            return {
                averageScore: 0,
                quizzesTaken: userData?.total_quizzes_completed || 0,
                bestCourse: 'N/A',
                areaToImprove: 'N/A',
            };
        }

        const allScores: number[] = [];
        let scoresByCourse: { [courseName: string]: number[] } = {};
        let scoresByTense: { name: string, score: number, course: string }[] = [];

        Object.entries(userData.course_progress).forEach(([courseId, tenses]) => {
            const courseInfo = coursesData.find(c => c.id === courseId);
            if (!courseInfo) return;

            scoresByCourse[courseInfo.name] = [];

            Object.entries(tenses).forEach(([tenseId, progress]) => {
                if (progress.score !== undefined) {
                    const tenseInfo = courseInfo.tenses.find(t => t.id === tenseId);
                    allScores.push(progress.score);
                    scoresByCourse[courseInfo.name].push(progress.score);
                    if (tenseInfo) {
                       scoresByTense.push({ name: tenseInfo.name, score: progress.score, course: courseInfo.name });
                    }
                }
            });
        });

        const averageScore = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;
        
        let bestCourse = 'N/A';
        let maxAvgScore = 0;
        Object.entries(scoresByCourse).forEach(([courseName, scores]) => {
            if (scores.length > 0) {
                const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
                if (avg > maxAvgScore) {
                    maxAvgScore = avg;
                    bestCourse = courseName;
                }
            }
        });

        let areaToImprove = 'N/A';
        const sortedScores = scoresByTense.filter(t => t.score < 100).sort((a, b) => a.score - b.score);
        if (sortedScores.length > 0) {
            areaToImprove = `${sortedScores[0].name} (${sortedScores[0].course})`;
        } else if (scoresByTense.length > 0) {
            areaToImprove = 'Mastered all!';
        }

        return {
            averageScore: Math.round(averageScore),
            quizzesTaken: userData.total_quizzes_completed,
            bestCourse,
            areaToImprove,
        };
    }, [userData, coursesData]);

    const courseCompletionData = useMemo(() => {
        if (!userData || coursesData.length === 0) return [];
        return coursesData.map(course => {
            if (course.tenses.length === 0) return { name: course.name, Completion: 0 };
            
            const courseProgress = userData.course_progress?.[course.id] || {};
            const completedInCourse = course.tenses.filter(t => courseProgress[t.id]?.completed).length;
            const completion = (completedInCourse / course.tenses.length) * 100;
            return { name: course.name, Completion: Math.round(completion) };
        });
    }, [userData, coursesData]);

    const scoresByCourse = useMemo(() => {
        if (!userData || coursesData.length === 0) return {};
        const groupedScores: { [key: string]: { name: string; scores: ({ name: string; Score: number | null })[] } } = {};

        coursesData.forEach(course => {
            const courseProgress = userData.course_progress?.[course.id];
            if (courseProgress && Object.keys(courseProgress).length > 0) {
                const courseScores = course.tenses.map(tense => {
                    const progress = courseProgress[tense.id];
                    const score = progress?.score !== undefined ? Math.round(progress.score) : null;
                    return { name: tense.name, Score: score };
                });
                
                groupedScores[course.id] = { name: course.name, scores: courseScores };
            }
        });
        return groupedScores;
    }, [userData, coursesData]);


    if (loading) {
      return (
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      );
    }

    const hasProgress = Object.keys(scoresByCourse).length > 0;

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-12">
            <header>
                <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Button>
                <h1 className="text-4xl font-extrabold tracking-tight">Progress Details</h1>
                <p className="text-muted-foreground mt-2">
                    A detailed breakdown of your performance across all courses.
                </p>
            </header>

            {hasProgress ? (
                <div className="space-y-12">
                    <section>
                        <h2 className="text-3xl font-bold mb-6">Performance Snapshot</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                            <StatCard icon={<BarChartHorizontal className="w-7 h-7"/>} label="Average Score" value={performanceMetrics.averageScore} />
                            <StatCard icon={<Brain className="w-7 h-7"/>} label="Quizzes Taken" value={performanceMetrics.quizzesTaken} />
                            <StatCard icon={<Award className="w-7 h-7"/>} label="Best Course" value={performanceMetrics.bestCourse} />
                            <StatCard icon={<TrendingDown className="w-7 h-7"/>} label="Area to Improve" value={performanceMetrics.areaToImprove} />
                        </div>
                    </section>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>Course Completion</CardTitle>
                            <CardDescription>Your overall completion percentage for each course.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={courseCompletionData} margin={{ top: 20, right: 30, left: 30, bottom: 120 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis 
                                        dataKey="name" 
                                        stroke="hsl(var(--muted-foreground))" 
                                        angle={-45} 
                                        textAnchor="end" 
                                        interval={0} 
                                        height={120}
                                        tick={{ dy: 5 }}
                                    />
                                    <YAxis 
                                        stroke="hsl(var(--muted-foreground))" 
                                        domain={[0, 100]} 
                                        tickFormatter={(tick) => `${tick}%`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'hsl(var(--secondary))' }}
                                        contentStyle={{
                                            background: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '0.5rem',
                                        }}
                                    />
                                    <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '20px' }}/>
                                    <Bar dataKey="Completion" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <section>
                        <h2 className="text-3xl font-bold mb-6">Quiz Performance by Course</h2>
                        <div className="space-y-6">
                            {Object.values(scoresByCourse).map(courseData => (
                                <Card key={courseData.name}>
                                    <CardHeader>
                                    <CardTitle>{courseData.name}</CardTitle>
                                    <CardDescription>Your best scores for each tense quiz in this course.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                    <ResponsiveContainer width="100%" height={400}>
                                        <LineChart data={courseData.scores} margin={{ top: 20, right: 30, left: 30, bottom: 120 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" angle={-45} textAnchor="end" interval={0} height={120} tick={{ dy: 5 }} padding={{ left: 20, right: 20 }} />
                                            <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" tickFormatter={(tick) => `${tick}%`} />
                                            <Tooltip
                                                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }}
                                                contentStyle={{
                                                    background: 'hsl(var(--card))',
                                                    border: '1px solid hsl(var(--border))',
                                                    borderRadius: '0.5rem',
                                                }}
                                            />
                                            <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '20px' }} />
                                            <Line type="linear" dataKey="Score" name="Best Score" stroke="hsl(var(--accent))" strokeWidth={2} activeDot={{ r: 8 }} dot={{ r: 4 }} connectNulls={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>
                </div>
            ) : (
                <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground flex flex-col items-center justify-center h-64 gap-4">
                        <BarChart2 className="w-16 h-16 text-muted-foreground" />
                        <h3 className="text-xl font-semibold">No Progress Data Yet</h3>
                        <p>Complete a few quizzes to see your detailed progress here.</p>
                        <Button onClick={() => navigate('/dashboard')}>Explore Courses</Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default ProgressDetailsPage;