import React, { useState, useMemo, useCallback, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { getCourseData } from '../data/course-data';
import Button from '../components/Button';
import Card from '../components/Card';
import CircularProgress from '../components/CircularProgress';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { QuizQuestion, Course } from '../types';
import { Loader2 } from 'lucide-react';

const ReviewQuizPage: React.FC = () => {
  const { courseId } = ReactRouterDOM.useParams<{ courseId: string }>();
  const navigate = ReactRouterDOM.useNavigate();
  const { userData, updateUserData } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);

  const [reviewQuestions, setReviewQuestions] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!courseId) return;
      setIsLoading(true);
      const tableName = `review_${courseId.replace(/-/g, '_')}`;

      try {
        const courseData = await getCourseData(courseId);
        setCourse(courseData || null);

        let query;
        switch (tableName) {
            case 'review_present': query = db.from('review_present').select('id, sentence, options, correct_answer'); break;
            case 'review_past': query = db.from('review_past').select('id, sentence, options, correct_answer'); break;
            case 'review_future': query = db.from('review_future').select('id, sentence, options, correct_answer'); break;
            case 'review_passive': query = db.from('review_passive').select('id, sentence, options, correct_answer'); break;
            case 'review_reported_speech': query = db.from('review_reported_speech').select('id, sentence, options, correct_answer'); break;
            default:
                throw new Error(`Review quiz table "${tableName}" is not configured in the frontend.`);
        }

        const { data, error } = await query;
        
        if (error) throw error;
        if (data) {
          // Take 15 random questions for review
          const allQuestions = data as any[];
          const shuffledQuestions = [...allQuestions].sort(() => 0.5 - Math.random()).slice(0, 15);

          const formattedQuestions: QuizQuestion[] = shuffledQuestions.map(q => ({
            id: q.id,
            sentence: q.sentence,
            correctAnswer: q.correct_answer,
            options: [...(q.options as string[])].sort(() => Math.random() - 0.5),
          }));
          setReviewQuestions(formattedQuestions);
          setAnswers(new Array(formattedQuestions.length).fill(null));
        }
      } catch (error) {
        console.error('Failed to fetch review questions:', error);
        toast.error('Could not load the review quiz. Please try again.');
        navigate(`/course/${courseId}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, [courseId, navigate]);


  const handleAnswerSelect = useCallback((index: number, answer: string) => {
    if (submitted) return;
    const newAnswers = [...answers];
    newAnswers[index] = answer;
    setAnswers(newAnswers);
  }, [submitted]);

  useEffect(() => {
    if (activeQuestionIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
        const keyNum = parseInt(e.key);
        if (keyNum >= 1 && keyNum <= 4) {
            e.preventDefault();
            const question = reviewQuestions[activeQuestionIndex];
            if (question && question.options[keyNum - 1]) {
                handleAnswerSelect(activeQuestionIndex, question.options[keyNum - 1]);
            }
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeQuestionIndex, reviewQuestions, handleAnswerSelect]);

  
  const allAnswered = useMemo(() => answers.length > 0 && answers.every(a => a !== null), [answers]);

  const handleSubmit = async () => {
    if (!userData || reviewQuestions.length === 0) return;

    let correctCount = 0;
    reviewQuestions.forEach((q, index) => {
        if(q.correctAnswer === answers[index]) {
            correctCount++;
        }
    });

    const calculatedScore = (correctCount / reviewQuestions.length) * 100;
    setScore(calculatedScore);
    setSubmitted(true);
    
    // Flat reward for review quizzes
    const xpGained = 200; 
    const coinsGained = 100;

    try {
        await updateUserData({
            xp: userData.xp + xpGained,
            ai_coins: userData.ai_coins + coinsGained,
        });
        toast.success(`Review complete! +${xpGained} XP, +${coinsGained} Coins!`, { icon: '🧠' });
    } catch (error) {
        console.error("Failed to update user data after review:", error);
    }
  };
  
  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
    );
  }
  if (!course || reviewQuestions.length === 0) return <div className="p-4 text-center">Review Quiz not found or no questions available.</div>;
  
  if (submitted) {
    return (
      <div className="container mx-auto p-4 md:p-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Review Results</h1>
        <Card className="max-w-3xl mx-auto">
          <CircularProgress value={score} label="Your Score" />
          <div className="p-6">
            <Button onClick={() => navigate(`/course/${courseId}`)}>Back to Course</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-2">{course.name} - Mixed Review</h1>
      <p className="text-muted-foreground mb-8">Test your combined knowledge. Click a card to use keyboard shortcuts (1-4).</p>
      
      <div className="space-y-6">
        {reviewQuestions.map((q, index) => (
          <Card 
            key={`${q.id}-${index}`}
            onClick={() => setActiveQuestionIndex(index)}
            className={`transition-all ${activeQuestionIndex === index ? 'ring-2 ring-primary' : 'ring-2 ring-transparent'}`}
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
                            className="text-base w-full"
                        >
                            {option}
                        </Button>
                    ))}
                </div>
            </div>
          </Card>
        ))}
      </div>
       <div className="mt-8 text-center">
          <Button size="lg" onClick={handleSubmit} disabled={!allAnswered}>
            Submit Review
          </Button>
      </div>
    </div>
  );
};

export default ReviewQuizPage;