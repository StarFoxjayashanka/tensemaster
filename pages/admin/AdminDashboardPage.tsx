import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/Card';
import Button from '../../components/Button';
import { Users, Library } from 'lucide-react';

const AdminDashboardPage: React.FC = () => {
    const navigate = ReactRouterDOM.useNavigate();

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="mb-8">
                <h1 className="text-4xl font-extrabold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                    Manage application content and users from here.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => navigate('/admin/courses')}>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <Library className="w-10 h-10 text-primary" />
                            <div>
                                <CardTitle className="text-2xl">Manage Courses</CardTitle>
                                <CardDescription>Create, edit, and delete global courses for all users.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Button>Go to Courses</Button>
                    </CardContent>
                </Card>
                 <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => navigate('/admin/users')}>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <Users className="w-10 h-10 text-primary" />
                            <div>
                                <CardTitle className="text-2xl">Manage Users</CardTitle>
                                <CardDescription>View all registered users and their statistics.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Button>Go to Users</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboardPage;