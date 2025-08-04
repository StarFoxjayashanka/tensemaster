import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { db } from '../../services/firebase';
import { UserProfile } from '../../types';
import Button from '../../components/Button';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../../components/Card';
import { Loader2, ArrowLeft, Star, Coins } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminUsersPage: React.FC = () => {
    const navigate = ReactRouterDOM.useNavigate();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const { data, error } = await db.from('profiles').select('*').order('username', { ascending: true });
                if (error) throw error;
                setUsers(data as UserProfile[]);
            } catch (error: any) {
                toast.error(`Failed to fetch users: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="mb-8">
                <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin Dashboard
                </Button>
                <h1 className="text-4xl font-extrabold tracking-tight">User Management</h1>
                <p className="text-muted-foreground mt-2">
                    A list of all registered users in the application.
                </p>
            </header>
            
            {loading ? (
                 <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                </div>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-secondary/50">
                                    <tr>
                                        <th className="p-4 font-semibold">Username</th>
                                        <th className="p-4 font-semibold">Email</th>
                                        <th className="p-4 font-semibold text-center">Role</th>
                                        <th className="p-4 font-semibold text-center">XP</th>
                                        <th className="p-4 font-semibold text-center">Coins</th>
                                        <th className="p-4 font-semibold">Last Login</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.id} className="border-b border-border last:border-b-0">
                                            <td className="p-4 font-medium">{user.username}</td>
                                            <td className="p-4 text-muted-foreground">{user.email}</td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-1 text-xs font-bold rounded-full ${user.role === 'admin' ? 'bg-accent/20 text-accent' : 'bg-secondary text-secondary-foreground'}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="p-4 font-mono text-center flex items-center justify-center gap-1">
                                                <Star className="w-4 h-4 text-primary"/>
                                                {user.xp.toLocaleString()}
                                            </td>
                                            <td className="p-4 font-mono text-center flex items-center justify-center gap-1">
                                                <Coins className="w-4 h-4 text-coin"/>
                                                {user.ai_coins.toLocaleString()}
                                            </td>
                                            <td className="p-4 text-muted-foreground">{new Date(user.last_login).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                         {users.length === 0 && (
                            <p className="text-center text-muted-foreground py-16">No users found.</p>
                        )}
                    </CardContent>
                </Card>
            )}

        </div>
    );
};

export default AdminUsersPage;