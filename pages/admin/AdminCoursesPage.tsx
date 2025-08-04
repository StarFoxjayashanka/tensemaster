import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { getAllCoursesMetadata } from '../../data/course-data';
import Button from '../../components/Button';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../../components/Card';
import { Loader2, PlusCircle, Edit, Trash2, ArrowLeft } from 'lucide-react';
import DynamicIcon from '../../components/DynamicIcon';
import { db } from '../../services/firebase';
import toast from 'react-hot-toast';

type CourseMeta = {
    id: string;
    name: string;
    tenseCount: number;
    description: string;
    iconName: string;
    userId: string | null;
    isCustom: boolean;
};

const AdminCoursesPage: React.FC = () => {
    const navigate = ReactRouterDOM.useNavigate();
    const [courses, setCourses] = useState<CourseMeta[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCourses = async () => {
        setLoading(true);
        const allCourses = await getAllCoursesMetadata();
        setCourses(allCourses);
        setLoading(false);
    }

    useEffect(() => {
        fetchCourses();
    }, []);

    const handleDeleteCourse = async (courseId: string) => {
        if (window.confirm("Are you sure you want to permanently delete this course and all its lessons? This action cannot be undone.")) {
            const toastId = toast.loading("Deleting course...");
            try {
                const { error } = await db.from('courses').delete().eq('id', courseId);
                if (error) throw error;
                toast.success("Course deleted successfully.", { id: toastId });
                fetchCourses(); // Refresh the list
            } catch (error: any) {
                toast.error(`Deletion failed: ${error.message}`, { id: toastId });
            }
        }
    };
    
    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="mb-8">
                <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin Dashboard
                </Button>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight">Course Management</h1>
                        <p className="text-muted-foreground mt-2">
                            View, create, and manage all courses in the application.
                        </p>
                    </div>
                    <Button onClick={() => navigate('/admin/courses/new')}>
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Create New Course
                    </Button>
                </div>
            </header>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                </div>
            ) : (
                <Card>
                    <CardContent className="pt-6">
                        <div className="divide-y divide-border">
                            {courses.map(course => (
                                <div key={course.id} className="flex items-center justify-between p-4 hover:bg-secondary/50 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <DynamicIcon name={course.iconName} className="w-8 h-8 text-primary"/>
                                        <div>
                                            <p className="font-bold text-lg">{course.name} {!course.isCustom && <span className="text-xs text-primary bg-primary/20 px-2 py-1 rounded-full ml-2">Built-in</span>}</p>
                                            <p className="text-sm text-muted-foreground">{course.description}</p>
                                        </div>
                                    </div>
                                    {course.isCustom && (
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={() => navigate(`/admin/courses/edit/${course.id}`)}>
                                                <Edit className="w-4 h-4 mr-2" />
                                                Edit
                                            </Button>
                                            <Button variant="destructive" size="sm" onClick={() => handleDeleteCourse(course.id)}>
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Delete
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default AdminCoursesPage;