


import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { getCourseData } from '../data/course-data';
import Button from '../components/Button';
import Card, { CardHeader, CardContent, CardTitle, CardDescription } from '../components/Card';
import { useAuth } from '../hooks/useAuth';
import { Course } from '../types';
import { ArrowLeft, ChevronRight, BookOpenCheck, CheckCircle, Trophy, Loader2 } from 'lucide-react';

const CourseOverviewPage: React.FC = () => {
  const { courseId } = ReactRouterDOM.useParams<{ courseId: string }>();
  const navigate = ReactRouterDOM.useNavigate();
  const { userData } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      if (courseId) {
        setLoading(true);
        const data = await getCourseData(courseId);
        if (data) {
          setCourse(data);
        }
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold">Course not found</h1>
        <Button onClick={() => navigate('/dashboard')} className="mt-4">Back to Dashboard</Button>
      </div>
    );
  }

  const courseProgress = userData?.course_progress?.[courseId!] || {};
  const firstUncompletedTense = course.tenses.find(tense => !courseProgress[tense.id]?.completed);
  let startOrContinueTenseId = firstUncompletedTense ? firstUncompletedTense.id : course.tenses[0]?.id;
  
  const hasProgress = Object.keys(courseProgress).length > 0;
  if(hasProgress && !firstUncompletedTense) {
    const lastAttempted = Object.keys(courseProgress).pop();
    startOrContinueTenseId = lastAttempted || course.tenses[0]?.id;
  }

  const handleStartOrContinue = () => {
    if (startOrContinueTenseId) {
      navigate(`/learn/${courseId}/${startOrContinueTenseId}`);
    }
  };

  const isCompleted = course.tenses.length > 0 && course.tenses.every(t => courseProgress[t.id]?.completed);
  const isInProgress = Object.keys(courseProgress).length > 0 && !isCompleted;
  let buttonText = "Start Course";
  if(isCompleted) buttonText = "Review Course";
  else if (isInProgress) buttonText = "Continue Course";

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{course.name}</h1>
        <p className="text-muted-foreground mt-2">
          {course.description}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Tenses in this Course</h2>
              <div className="space-y-4">
                {course.tenses.map((tense, index) => {
                  const isTenseCompleted = courseProgress[tense.id]?.completed;
                  return (
                    <div key={tense.id}>
                      <div className="p-4 rounded-lg border border-border bg-secondary/50 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className="text-primary font-bold text-lg">{String(index + 1).padStart(2, '0')}</div>
                          <span className="font-semibold text-lg">{tense.name}</span>
                          {isTenseCompleted && <CheckCircle className="h-5 w-5 text-green-400" />}
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  )
                })}
              </div>

              {isCompleted && (
                <Card className="mt-8 border-accent/50 hover:border-accent transition-colors duration-300">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <Trophy className="w-8 h-8 text-accent"/>
                            <CardTitle className="text-2xl text-accent">Mastery Challenge</CardTitle>
                        </div>
                        <CardDescription>You've completed all tenses in this course. Test your combined knowledge!</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="secondary" className="w-full bg-accent/20 text-accent hover:bg-accent/30" onClick={() => navigate(`/review/${course.id}`)}>
                            Start Review Quiz
                        </Button>
                    </CardContent>
                </Card>
              )}
            </div>
        </div>

        <div className="md:col-span-1">
          <Card className="sticky top-24">
            <div className="p-6 text-center">
                <BookOpenCheck className="mx-auto h-16 w-16 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Ready to go?</h3>
                <p className="text-muted-foreground mb-6">
                  {isCompleted ? "You've mastered this course!" : isInProgress ? "Continue where you left off." : "Begin with the first lesson."}
                </p>
                <Button onClick={handleStartOrContinue} className="w-full" size="lg" disabled={course.tenses.length === 0}>
                    {buttonText}
                </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CourseOverviewPage;