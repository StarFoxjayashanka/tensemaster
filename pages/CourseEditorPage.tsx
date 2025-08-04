


import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { Course, Tense, SimpleExplanation, AdvancedExplanation, ContentBlock } from '../types';
import Button from '../components/Button';
import Input from '../components/Input';
import Card, { CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/Card';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2, Save, PlusCircle, Trash2, Edit2, Check, X, BookOpen, AlertTriangle, Wand2, SlidersHorizontal, Settings2, Brain } from 'lucide-react';
import DynamicIcon from '../components/DynamicIcon';
import IconPicker from '../components/IconPicker';
import Modal from '../components/Modal';
import BlockBuilder from '../components/BlockBuilder';

const slugify = (text: string) =>
  text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');

type CustomQuestion = {
    id: string;
    tense_id: string;
    sentence: string;
    options: string[];
    correct_answer: string;
};

interface QuestionEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<CustomQuestion, 'id' | 'tense_id'>) => Promise<void>;
    question: CustomQuestion | null;
}

const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({ isOpen, onClose, onSave, question }) => {
    const [sentence, setSentence] = useState('');
    const [optionsStr, setOptionsStr] = useState('');
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (question) {
            setSentence(question.sentence);
            setOptionsStr(question.options.join(', '));
            setCorrectAnswer(question.correct_answer);
        } else {
            setSentence('');
            setOptionsStr('');
            setCorrectAnswer('');
        }
    }, [question]);

    const handleSubmit = async () => {
        const options = optionsStr.split(',').map(s => s.trim()).filter(Boolean);
        if (!sentence.trim() || options.length < 2 || !correctAnswer.trim()) {
            toast.error("Sentence, correct answer, and at least 2 options are required.");
            return;
        }
        if (!options.includes(correctAnswer)) {
            toast.error("The correct answer must be one of the options.");
            return;
        }

        setIsSaving(true);
        await onSave({ sentence, options, correct_answer: correctAnswer });
        setIsSaving(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={question ? "Edit Question" : "Add New Question"}>
            <div className="space-y-4">
                <div>
                    <label className="font-semibold text-sm">Sentence</label>
                    <textarea value={sentence} onChange={e => setSentence(e.target.value)} placeholder="She ___ to the store. (Use ___ for the blank)" className="w-full mt-1 p-2 bg-background border border-input rounded-md"/>
                </div>
                <div>
                    <label className="font-semibold text-sm">Options (comma-separated)</label>
                    <Input value={optionsStr} onChange={e => setOptionsStr(e.target.value)} placeholder="goes, go, is going" className="mt-1"/>
                </div>
                <div>
                    <label className="font-semibold text-sm">Correct Answer</label>
                    <Input value={correctAnswer} onChange={e => setCorrectAnswer(e.target.value)} placeholder="goes" className="mt-1"/>
                </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={isSaving}>
                    {isSaving ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2 h-4 w-4"/>}
                    Save Question
                </Button>
            </div>
        </Modal>
    );
}

const TenseEditor: React.FC<{
    tense: Tense;
    onUpdate: (updatedTense: Tense) => void;
    onDelete: () => void;
    onCancelNew: () => void;
    isSaving: boolean;
}> = ({ tense, onUpdate, onDelete, onCancelNew, isSaving }) => {
    const { user } = useAuth();
    const [localTense, setLocalTense] = useState<Tense>(tense);
    const [isEditing, setIsEditing] = useState(tense.name === ''); // Auto-open if new
    const [mode, setMode] = useState<'simple' | 'advanced'>(tense.explanation.mode);

    const [quizQuestions, setQuizQuestions] = useState<CustomQuestion[]>([]);
    const [loadingQuiz, setLoadingQuiz] = useState(false);
    const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<CustomQuestion | null>(null);
    
    const isLessonSaved = !tense.id.startsWith('new-');

    const fetchQuizQuestions = React.useCallback(async () => {
        if (!isLessonSaved) return;
        setLoadingQuiz(true);
        try {
            const { data, error } = await db
                .from('custom_quiz_questions')
                .select('*')
                .eq('tense_id', tense.id);
            if (error) throw error;
            setQuizQuestions((data as CustomQuestion[]) || []);
        } catch (error: any) {
            toast.error(`Failed to load quiz questions: ${error.message}`);
        } finally {
            setLoadingQuiz(false);
        }
    }, [tense.id, isLessonSaved]);

    useEffect(() => {
        setMode(tense.explanation.mode);
        setLocalTense(tense);
        if(!tense.id.startsWith('new-')) {
            fetchQuizQuestions();
        }
    }, [tense, fetchQuizQuestions]);

    const handleSave = () => {
        if (!localTense.name.trim()) {
            toast.error("Lesson name cannot be empty.");
            return;
        }
        onUpdate(localTense);
        setIsEditing(false);
    };

    const handleCancel = () => {
        if (tense.id.startsWith('new-')) {
            onCancelNew();
        } else {
            setLocalTense(tense);
            setIsEditing(false);
        }
    };
    
    const handleToggleMode = () => {
        if (mode === 'simple') {
            const currentExplanation = localTense.explanation as { mode: 'simple' } & SimpleExplanation;
            const newBlocks: ContentBlock[] = [];
            newBlocks.push({ id: `p-${Date.now()}`, type: 'paragraph', text: currentExplanation.usage });
            
            const structureItems = Object.entries(currentExplanation.structure)
                .filter(([_, value]) => value)
                .map(([key, value]) => ({ id: `s-${key}-${Date.now()}`, type: key as any, content: value!}));
            if(structureItems.length > 0) newBlocks.push({ id: `struct-${Date.now()}`, type: 'structure', items: structureItems });

            const exampleItems = Object.entries(currentExplanation.examples)
                .filter(([_, value]) => value && value.length > 0 && value[0])
                .map(([key, value]) => ({ id: `e-${key}-${Date.now()}`, type: key as any, examples: value!}));
            if(exampleItems.length > 0) newBlocks.push({ id: `ex-${Date.now()}`, type: 'examples', items: exampleItems });

            setLocalTense(prev => ({ ...prev, explanation: { mode: 'advanced', content: newBlocks }}));
            setMode('advanced');
        } else {
             if(window.confirm("Switching to simple mode may lose complex formatting. Are you sure?")) {
                const newSimpleExplanation: { mode: 'simple' } & SimpleExplanation = {
                    mode: 'simple', usage: '',
                    structure: { positive: '', negative: '', interrogative: '', negativeInterrogative: '' },
                    examples: { positive: [], negative: [], interrogative: [], negativeInterrogative: [] }
                };
                setLocalTense(prev => ({ ...prev, explanation: newSimpleExplanation }));
                setMode('simple');
             }
        }
    };

    const handleOpenQuizModal = (question: CustomQuestion | null) => {
        setEditingQuestion(question);
        setIsQuizModalOpen(true);
    };

    const handleCloseQuizModal = () => {
        setEditingQuestion(null);
        setIsQuizModalOpen(false);
    };

    const handleSaveQuestion = async (questionData: Omit<CustomQuestion, 'id' | 'tense_id'>) => {
        if (!user) return;
        const toastId = toast.loading("Saving question...");
        try {
            if (editingQuestion) {
                const { error } = await db.from('custom_quiz_questions').update(questionData).eq('id', editingQuestion.id);
                if (error) throw error;
            } else {
                const { error } = await db.from('custom_quiz_questions').insert({ ...questionData, tense_id: tense.id, user_id: user.id });
                if (error) throw error;
            }
            toast.success("Question saved!", { id: toastId });
            fetchQuizQuestions();
            handleCloseQuizModal();
        } catch (error: any) {
            toast.error(`Failed to save question: ${error.message}`, { id: toastId });
        }
    };
    
    const handleDeleteQuestion = async (questionId: string) => {
        if (!window.confirm("Are you sure you want to delete this question?")) return;
        const toastId = toast.loading("Deleting question...");
        try {
            const { error } = await db.from('custom_quiz_questions').delete().eq('id', questionId);
            if (error) throw error;
            toast.success("Question deleted.", { id: toastId });
            fetchQuizQuestions();
        } catch (error: any) {
            toast.error(`Failed to delete question: ${error.message}`, { id: toastId });
        }
    };


    if (!isEditing) {
        return (
            <Card className="bg-secondary/50">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-xl">{tense.name || "New Lesson"}</CardTitle>
                        <div className="flex gap-2">
                           <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}><Edit2 className="w-5 h-5"/></Button>
                           <Button variant="ghost" size="icon" onClick={onDelete}><Trash2 className="w-5 h-5 text-destructive"/></Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>
        );
    }
    
    const explanation = localTense.explanation;

    return (
        <Card className="ring-2 ring-primary">
            <CardContent className="pt-6 space-y-4">
                <div>
                    <label className="font-semibold">Lesson Name</label>
                    <Input value={localTense.name} onChange={e => setLocalTense({...localTense, name: e.target.value})} placeholder="e.g., Simple Present" className="mt-1"/>
                </div>
                <div className="border-t border-border pt-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-lg">Lesson Content</h3>
                        <Button variant="outline" size="sm" onClick={handleToggleMode}>
                            {mode === 'simple' ? <><Wand2 className="w-4 h-4 mr-2"/> Switch to Advanced</> : <><Settings2 className="w-4 h-4 mr-2"/> Switch to Simple</>}
                        </Button>
                    </div>

                    {mode === 'simple' && explanation.mode === 'simple' && (
                        <div className="space-y-4">
                            <div>
                                <label className="font-semibold">When to Use</label>
                                <textarea value={explanation.usage} onChange={e => setLocalTense({...localTense, explanation: {...explanation, usage: e.target.value}})} placeholder="Explain the main usage of this tense..." className="w-full mt-1 p-2 bg-background border border-input rounded-md"/>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {Object.keys(explanation.structure).map(key => (
                                <div key={key}>
                                    <label className="font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                                    <Input value={(explanation.structure as any)[key] || ''} onChange={e => setLocalTense({...localTense, explanation: {...explanation, structure: {...explanation.structure, [key]: e.target.value }}})} placeholder="Subject + verb..." className="mt-1 font-mono"/>
                                </div>
                              ))}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {Object.keys(explanation.examples).map(key => (
                                <div key={key}>
                                    <label className="font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                                    <textarea value={(explanation.examples as any)[key]?.join('\n') || ''} onChange={e => setLocalTense({...localTense, explanation: {...explanation, examples: {...explanation.examples, [key]: e.target.value.split('\n') }}})} placeholder="One example per line..." className="w-full mt-1 p-2 bg-background border border-input rounded-md h-24"/>
                                </div>
                              ))}
                            </div>
                        </div>
                    )}
                    {mode === 'advanced' && explanation.mode === 'advanced' && (
                        <BlockBuilder blocks={explanation.content} setBlocks={(newBlocks) => setLocalTense(prev => ({...prev, explanation: {...prev.explanation, mode: 'advanced', content: typeof newBlocks === 'function' ? newBlocks(prev.explanation.mode === 'advanced' ? prev.explanation.content : []) : newBlocks}}))} />
                    )}
                </div>

                <div className={`border-t border-border pt-4 mt-4 ${!isLessonSaved ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2"><Brain className="w-5 h-5"/> Quiz Management</h3>
                        <Button variant="outline" size="sm" onClick={() => handleOpenQuizModal(null)} disabled={!isLessonSaved}>
                            <PlusCircle className="mr-2 w-4 h-4"/> Add Question
                        </Button>
                    </div>
                    {!isLessonSaved && <p className="text-sm text-muted-foreground">Save the lesson to manage its quiz.</p>}
                    {isLessonSaved && loadingQuiz && <div className="flex justify-center"><Loader2 className="animate-spin" /></div>}
                    {isLessonSaved && !loadingQuiz && (
                        quizQuestions.length > 0 ? (
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                {quizQuestions.map(q => (
                                    <div key={q.id} className="flex justify-between items-center p-3 bg-secondary rounded-md">
                                        <p className="truncate text-sm pr-4">{q.sentence}</p>
                                        <div className="flex gap-1 flex-shrink-0">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenQuizModal(q)}><Edit2 className="w-4 h-4"/></Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteQuestion(q.id)}><Trash2 className="w-4 h-4 text-destructive"/></Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-center text-muted-foreground py-4">No quiz questions yet.</p>
                        )
                    )}
                </div>
            </CardContent>
            <CardFooter className="justify-end gap-2">
                <Button variant="outline" onClick={handleCancel}><X className="mr-2 h-4 w-4"/> Cancel</Button>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="animate-spin mr-2"/> : <Check className="mr-2 h-4 w-4"/>}
                    Save Lesson
                </Button>
            </CardFooter>
            {isQuizModalOpen && (
                <QuestionEditorModal
                    isOpen={isQuizModalOpen}
                    onClose={handleCloseQuizModal}
                    onSave={handleSaveQuestion}
                    question={editingQuestion}
                />
            )}
        </Card>
    )
}


const CourseEditorPage: React.FC = () => {
    const { courseId: paramCourseId } = ReactRouterDOM.useParams();
    const navigate = ReactRouterDOM.useNavigate();
    const { user } = useAuth();
    
    const [mode, setMode] = useState<'new' | 'edit'>('new');
    const [courseId, setCourseId] = useState<string | null>(paramCourseId || null);
    const [course, setCourse] = useState<Course | null>(null);
    const [tenses, setTenses] = useState<Tense[]>([]);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [iconName, setIconName] = useState('BookOpen');

    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    useEffect(() => {
        if (paramCourseId) {
            setMode('edit');
            setLoading(true);
            const fetchCourse = async () => {
                const { data: courseData, error: courseError } = await db.from('courses').select().eq('id', paramCourseId).single();
                if (courseError || !courseData) {
                    toast.error("Course not found or you don't have permission to edit it.");
                    navigate('/admin/courses');
                    return;
                }
                setCourse(courseData as any);
                setName(courseData.name);
                setDescription(courseData.description);
                setIconName(courseData.icon_name);
                setCourseId(courseData.id);

                const { data: tensesData, error: tensesError } = await db.from('course_tenses').select('*').eq('course_id', paramCourseId).order('order');
                if (tensesError) {
                    toast.error("Could not load course lessons.");
                } else {
                    setTenses(tensesData.map(t => ({...t, explanation: t.explanation as any})));
                }
                setLoading(false);
            };
            fetchCourse();
        } else {
            setMode('new');
            setLoading(false);
        }
    }, [paramCourseId, navigate]);

    const handleSaveMetadata = async () => {
        if (!user) return;
        if (!name.trim() || !description.trim()) {
            toast.error("Course Name and Description cannot be empty.");
            return;
        }

        setIsSaving(true);
        if (mode === 'new') {
            const newCourseId = slugify(name);
            const { data: existing, error: checkError } = await db.from('courses').select('id').eq('id', newCourseId).single();
            
            if (checkError && checkError.code !== 'PGRST116') { // Note: PGRST116 is the error for "exactly one row was expected, but 0 were found" which is what we want.
                if (checkError.message.includes('relation "public.courses" does not exist')) {
                     toast.error("Database setup is incomplete: The 'courses' table is missing. Please ensure your database schema is up to date.", { duration: 8000 });
                } else {
                     toast.error(`Error checking for existing course: ${checkError.message}`);
                }
                setIsSaving(false);
                return;
            }
            if (existing) {
                toast.error("A course with this name already exists. Please choose a different name.");
                setIsSaving(false);
                return;
            }

            const { data, error } = await db.from('courses').insert({
                id: newCourseId,
                user_id: user.id,
                name,
                description,
                icon_name: iconName,
                tense_count: 0
            }).select();

            if (error) {
                toast.error(error.message);
            } else if(data && data.length > 0) {
                const newCourse = data[0];
                toast.success("Course created! Now add some lessons.");
                setCourseId(newCourse.id);
                navigate(`/admin/courses/edit/${newCourse.id}`, { replace: true });
            } else {
                 toast.error("Course creation failed. The new course data could not be retrieved. Please try again.");
            }
        } else { // Edit mode
            if (!courseId) return;
            const { error } = await db.from('courses').update({ name, description, icon_name: iconName }).eq('id', courseId);
            if (error) {
                toast.error(error.message);
            } else {
                toast.success("Course details updated.");
            }
        }
        setIsSaving(false);
    };
    
    const handleAddTense = () => {
        const newTense: Tense = {
            id: `new-${Date.now()}`,
            name: '',
            course_id: courseId!,
            user_id: user!.id,
            order: tenses.length,
            explanation: {
                mode: 'simple',
                usage: '',
                structure: { positive: '', negative: '', interrogative: '', negativeInterrogative: '' },
                examples: { positive: [], negative: [], interrogative: [], negativeInterrogative: [] }
            }
        };
        setTenses([...tenses, newTense]);
    };

    const handleUpdateTense = async (updatedTense: Tense) => {
        if (!courseId || !user) return;
        setIsSaving(true);
        const isNew = updatedTense.id.startsWith('new-');
        
        const tensePayload = {
            course_id: courseId,
            user_id: user.id,
            name: updatedTense.name,
            order: updatedTense.order!,
            explanation: updatedTense.explanation
        };

        if (isNew) {
            const { data, error } = await db.from('course_tenses').insert(tensePayload).select().single();
            if (error) toast.error(error.message);
            else {
                setTenses(tenses.map(t => t.id === updatedTense.id ? { ...(data as Tense), explanation: data.explanation as any } : t));
                toast.success("Lesson saved!");
            }
        } else {
            // Only include fields that can be updated.
            const updatePayload = {
                name: updatedTense.name,
                order: updatedTense.order!,
                explanation: updatedTense.explanation,
            };
            const { data, error } = await db.from('course_tenses').update(updatePayload).eq('id', updatedTense.id).select().single();
             if (error) toast.error(error.message);
             else {
                setTenses(tenses.map(t => t.id === updatedTense.id ? { ...(data as Tense), explanation: data.explanation as any } : t));
                toast.success("Lesson updated!");
            }
        }

        await db.from('courses').update({ tense_count: tenses.length }).eq('id', courseId);
        setIsSaving(false);
    };
    
    const handleDeleteTense = async (tenseId: string) => {
        if (window.confirm("Are you sure you want to delete this lesson?")) {
            const toastId = toast.loading("Deleting lesson...");
            const isNew = tenseId.startsWith('new-');
            if (isNew) {
                setTenses(tenses.filter(t => t.id !== tenseId));
                toast.success("Lesson removed.", { id: toastId });
            } else {
                try {
                    if (!courseId) throw new Error("Course ID is missing.");
                    
                    const { error } = await db.from('course_tenses').delete().eq('id', tenseId);
                    if (error) throw error;
                    
                    const newTenses = tenses.filter(t => t.id !== tenseId);
                    setTenses(newTenses);

                    const { error: countError } = await db.from('courses').update({ tense_count: newTenses.length }).eq('id', courseId);
                    if (countError) throw countError;

                    toast.success("Lesson deleted successfully.", { id: toastId });
                } catch (error: any) {
                    console.error("Deletion failed:", error);
                    toast.error(`Deletion failed: ${error.message}`, { id: toastId });
                }
            }
        }
    };

    const handleDeleteCourse = async () => {
        if (!courseId) return;
        setIsSaving(true);
        const { error } = await db.from('courses').delete().eq('id', courseId);
        if (error) {
            toast.error(error.message);
            setIsSaving(false);
        } else {
            toast.success("Course deleted successfully.");
            navigate('/admin/courses');
        }
    }


    if (loading) return <div className="flex items-center justify-center h-[calc(100vh-80px)]"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;

    return (
        <div className="container mx-auto p-4 md:p-8">
             <header className="mb-8">
                <Button variant="ghost" onClick={() => navigate('/admin/courses')} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Course Management
                </Button>
                <h1 className="text-4xl font-extrabold tracking-tight">
                    {mode === 'new' ? 'Create a New Course' : 'Edit Course'}
                </h1>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <Card className="sticky top-24">
                        <CardHeader>
                            <CardTitle>Course Details</CardTitle>
                            <CardDescription>Set up the name, description, and icon for your course.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label htmlFor="course-name" className="font-semibold">Course Name</label>
                                <Input id="course-name" value={name} onChange={e => setName(e.target.value)} disabled={mode==='edit'}/>
                                {mode==='edit' && <p className="text-xs text-muted-foreground mt-1">Course name cannot be changed after creation.</p>}
                            </div>
                             <div>
                                <label htmlFor="course-desc" className="font-semibold">Description</label>
                                <textarea id="course-desc" value={description} onChange={e => setDescription(e.target.value)} className="w-full mt-1 p-2 bg-background border border-input rounded-md"/>
                            </div>
                            <div>
                                <label className="font-semibold block mb-2">Icon</label>
                                <Button variant="outline" onClick={() => setIsIconPickerOpen(true)} className="flex items-center gap-2">
                                    <DynamicIcon name={iconName} className="w-5 h-5"/>
                                    <span>{iconName}</span>
                                </Button>
                            </div>
                        </CardContent>
                        <CardFooter className="flex-col gap-4 items-stretch">
                            <Button onClick={handleSaveMetadata} disabled={isSaving}>
                                {isSaving ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2 h-4 w-4"/>}
                                {mode === 'new' ? 'Create & Continue' : 'Save Details'}
                            </Button>
                            {mode === 'edit' && (
                                 <Button variant="destructive" onClick={() => setIsDeleteModalOpen(true)}>
                                    <Trash2 className="mr-2 h-4 w-4"/> Delete Course
                                 </Button>
                            )}
                        </CardFooter>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Card className={!courseId ? 'opacity-50 pointer-events-none' : ''}>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Course Content</CardTitle>
                                    <CardDescription>Add and edit the lessons for this course.</CardDescription>
                                </div>
                                <Button onClick={handleAddTense} disabled={!courseId}>
                                    <PlusCircle className="mr-2 h-4 w-4"/> Add Lesson
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!courseId && (
                                <div className="text-center py-10 text-muted-foreground">
                                    <p>Please create the course first to add lessons.</p>
                                </div>
                            )}
                            {tenses.map(tense => (
                                <TenseEditor 
                                    key={tense.id}
                                    tense={tense}
                                    isSaving={isSaving}
                                    onUpdate={handleUpdateTense}
                                    onDelete={() => handleDeleteTense(tense.id)}
                                    onCancelNew={() => {
                                        setTenses(currentTenses => currentTenses.filter(t => t.id !== tense.id));
                                    }}
                                />
                            ))}
                             {courseId && tenses.length === 0 && (
                                <div className="text-center py-10 text-muted-foreground">
                                    <p>This course has no lessons yet.</p>
                                    <p>Click "Add Lesson" to get started!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <IconPicker
                isOpen={isIconPickerOpen}
                onClose={() => setIsIconPickerOpen(false)}
                currentIcon={iconName}
                onSelectIcon={setIconName}
            />

            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Course">
                 <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-8 w-8 text-destructive min-w-[32px] mt-1" />
                        <div>
                            <h4 className="font-bold">This will delete the entire course.</h4>
                            <p className="text-muted-foreground">Are you sure you want to delete "{name}"? All of its lessons will be lost forever. This action cannot be undone.</p>
                        </div>
                    </div>
                </div>
                 <div className="mt-6 flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDeleteCourse} disabled={isSaving}>
                        {isSaving ? 'Deleting...' : 'Yes, Delete Course'}
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default CourseEditorPage;