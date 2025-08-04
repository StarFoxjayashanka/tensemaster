import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { getCourseData } from '../data/course-data';
import Button from '../components/Button';
import Card from '../components/Card';
import { Course, Tense, ContentBlock, SimpleExplanation } from '../types';
import { useAuth } from '../hooks/useAuth';
import {
  ArrowLeft,
  Info,
  Construction,
  PlusCircle,
  MinusCircle,
  HelpCircle,
  Quote,
  BrainCircuit,
  MessageCircleQuestion,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Hash,
  Pilcrow
} from 'lucide-react';

const BlockRenderer: React.FC<{ block: ContentBlock }> = ({ block }) => {
  switch (block.type) {
    case 'heading':
      const Tag = `h${block.level}` as keyof JSX.IntrinsicElements;
      return <Tag className="text-3xl font-bold mt-8 mb-4 flex items-center gap-3"><Hash className="w-7 h-7 text-primary"/>{block.text}</Tag>;
    case 'paragraph':
      return <p className="text-muted-foreground leading-relaxed text-lg mb-4 flex items-start gap-3"><Pilcrow className="w-7 h-7 text-primary mt-1 min-w-7"/><span>{block.text}</span></p>;
    case 'structure':
      return (
        <Card>
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3"><Construction className="w-7 h-7 text-primary"/>Structure</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {block.items.map(item => (
                <div key={item.id} className="p-4 bg-secondary rounded-lg border border-border">
                  <h3 className={`font-semibold text-lg mb-2 flex items-center gap-2 ${
                    item.type === 'positive' ? 'text-green-400' : 
                    item.type === 'negative' ? 'text-red-400' : 
                    item.type === 'interrogative' ? 'text-blue-400' : 'text-purple-400'
                  }`}>
                    {item.type === 'positive' && <PlusCircle/>}
                    {item.type === 'negative' && <MinusCircle/>}
                    {item.type === 'interrogative' && <HelpCircle/>}
                    {item.type === 'negativeInterrogative' && <MessageCircleQuestion/>}
                    {item.type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </h3>
                  <p className="font-mono text-base text-foreground/80">{item.content}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      );
    case 'examples':
        return (
            <Card>
                <div className="p-6">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-3"><Quote className="w-7 h-7 text-primary"/>Examples</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {block.items.map(item => (
                            <div key={item.id}>
                                <h3 className={`font-semibold text-lg mb-2 ${
                                    item.type === 'positive' ? 'text-green-400' : 
                                    item.type === 'negative' ? 'text-red-400' : 
                                    item.type === 'interrogative' ? 'text-blue-400' : 'text-purple-400'
                                }`}>
                                    {item.type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} Examples
                                </h3>
                                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                                    {item.examples.map((ex, i) => <li key={i}>{ex}</li>)}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
        )
    case 'alert':
      const styleClasses = {
        info: 'bg-blue-500/10 border-blue-500/50 text-blue-300',
        warning: 'bg-yellow-500/10 border-yellow-500/50 text-yellow-300',
        success: 'bg-green-500/10 border-green-500/50 text-green-300',
      };
       const Icon = {
        info: Info,
        warning: AlertTriangle,
        success: CheckCircle,
      }[block.style];
      return (
        <div className={`p-4 rounded-lg border flex items-start gap-3 ${styleClasses[block.style]}`}>
          <Icon className="w-5 h-5 mt-1 min-w-5" />
          <p>{block.text}</p>
        </div>
      )
    default:
      return null;
  }
};


const LearningAreaPage: React.FC = () => {
  const { courseId, tenseId } = ReactRouterDOM.useParams<{ courseId: string; tenseId: string }>();
  const navigate = ReactRouterDOM.useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      if (courseId) {
        setLoading(true);
        const data = await getCourseData(courseId);
        
        // This handles legacy static courses that don't have the `mode` property in their data files.
        // It wraps their explanation in the new structure on the fly.
        if (data && data.tenses) {
            data.tenses = data.tenses.map(t => {
                if ('mode' in t.explanation) {
                    return t;
                }
                return {
                    ...t,
                    explanation: {
                        mode: 'simple',
                        ...(t.explanation as any),
                    },
                };
            }) as Tense[];
        }

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

  const tense = course?.tenses.find(t => t.id === tenseId);

  if (!course || !tense) {
    return <div className="p-4 text-center">Content not found.</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <Button variant="ghost" onClick={() => navigate(`/course/${courseId}`)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {course.name}
        </Button>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{tense.name}</h1>
      </header>

      <div className="space-y-8">
        {tense.explanation.mode === 'simple' ? (
          <>
            <Card>
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-3"><Info className="w-7 h-7 text-primary"/>When to Use</h2>
                <p className="text-muted-foreground leading-relaxed text-lg">{tense.explanation.usage}</p>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-3"><Construction className="w-7 h-7 text-primary"/>Structure</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="p-4 bg-secondary rounded-lg border border-border">
                    <h3 className="font-semibold text-lg mb-2 text-green-400 flex items-center gap-2"><PlusCircle/>Positive</h3>
                    <p className="font-mono text-base text-foreground/80">{tense.explanation.structure.positive}</p>
                  </div>
                  <div className="p-4 bg-secondary rounded-lg border border-border">
                    <h3 className="font-semibold text-lg mb-2 text-red-400 flex items-center gap-2"><MinusCircle/>Negative</h3>
                    <p className="font-mono text-base text-foreground/80">{tense.explanation.structure.negative}</p>
                  </div>
                  <div className="p-4 bg-secondary rounded-lg border border-border">
                    <h3 className="font-semibold text-lg mb-2 text-blue-400 flex items-center gap-2"><HelpCircle/>Interrogative</h3>
                    <p className="font-mono text-base text-foreground/80">{tense.explanation.structure.interrogative}</p>
                  </div>
                  {tense.explanation.structure.negativeInterrogative && (
                    <div className="p-4 bg-secondary rounded-lg border border-border">
                        <h3 className="font-semibold text-lg mb-2 text-purple-400 flex items-center gap-2"><MessageCircleQuestion/>Negative Interrogative</h3>
                        <p className="font-mono text-base text-foreground/80">{tense.explanation.structure.negativeInterrogative}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-3"><Quote className="w-7 h-7 text-primary"/>Examples</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                        <h3 className="font-semibold text-lg mb-2 text-green-400">Positive Examples</h3>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2">
                            {tense.explanation.examples.positive.map((ex, i) => <li key={`pos-${i}`}>{ex}</li>)}
                        </ul>
                    </div>
                     <div>
                        <h3 className="font-semibold text-lg mb-2 text-red-400">Negative Examples</h3>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2">
                            {tense.explanation.examples.negative.map((ex, i) => <li key={`neg-${i}`}>{ex}</li>)}
                        </ul>
                    </div>
                     <div>
                        <h3 className="font-semibold text-lg mb-2 text-blue-400">Interrogative Examples</h3>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2">
                            {tense.explanation.examples.interrogative.map((ex, i) => <li key={`int-${i}`}>{ex}</li>)}
                        </ul>
                    </div>
                    {tense.explanation.examples.negativeInterrogative && (
                        <div>
                            <h3 className="font-semibold text-lg mb-2 text-purple-400">Negative Interrogative Examples</h3>
                            <ul className="list-disc list-inside text-muted-foreground space-y-2">
                                {tense.explanation.examples.negativeInterrogative.map((ex, i) => <li key={`neg-int-${i}`}>{ex}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
              </div>
            </Card>
          </>
        ) : (
          tense.explanation.content.map(block => <BlockRenderer key={block.id} block={block} />)
        )}
      </div>

      <div className="mt-12 flex justify-center items-center gap-4">
        <Button size="lg" onClick={() => navigate(`/quiz/${courseId}/${tenseId}`)}>
            Test Your Knowledge <BrainCircuit className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default LearningAreaPage;