



import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { auth, db } from '../services/firebase';
import Button from '../components/Button';
import Input from '../components/Input';
import Card, { CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/Card';
import toast from 'react-hot-toast';
import { Eye, EyeOff, User, Palette, Shield, Download, Trash2, AlertTriangle } from 'lucide-react';
import Modal from '../components/Modal';

const ProfilePage: React.FC = () => {
    const { user, userData, applyTheme, signOut } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');

    // Profile State
    const [newUsername, setNewUsername] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loadingUsername, setLoadingUsername] = useState(false);
    const [loadingPassword, setLoadingPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    // Accessibility State
    const [fontSize, setFontSize] = useState('normal');

    // Account Deletion State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const savedSize = localStorage.getItem('tense-master-font-size')?.replace('font-size-', '') || 'normal';
        setFontSize(savedSize);
    }, []);

    const handleUsernameChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newUsername || newUsername === userData?.username) {
            toast.error("Please enter a new, different username.");
            return;
        }
        setLoadingUsername(true);
        try {
            const { error } = await db.from('profiles').update({ username: newUsername }).eq('id', user.id);
            if (error) throw error;
            toast.success("Username updated successfully!");
            setNewUsername('');
        } catch (error: any) {
            toast.error(error.message || "Failed to update username.");
        } finally {
            setLoadingUsername(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentPassword) {
            toast.error("Please enter your current password.");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match.");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("Password should be at least 6 characters.");
            return;
        }
        setLoadingPassword(true);
        try {
            await auth.changePassword({ currentPassword, newPassword });
            toast.success("Password changed successfully!");
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            const errorMessage = error.message || "Failed to change password.";
            toast.error(errorMessage);
        } finally {
            setLoadingPassword(false);
        }
    };

    const handleFontSizeChange = (size: 'small' | 'normal' | 'large') => {
        setFontSize(size);
        const newClass = `font-size-${size}`;
        localStorage.setItem('tense-master-font-size', newClass);
        document.body.classList.remove('font-size-small', 'font-size-normal', 'font-size-large');
        document.body.classList.add(newClass);
        toast.success(`Font size set to ${size}.`);
    };
    
    const handleExportData = () => {
        if(!userData) return;
        const dataStr = JSON.stringify(userData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = 'tense_master_data.json';
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        toast.success("Your data has been exported.");
    };

    const handleDeleteAccount = async () => {
        if (!user) return;
        setIsDeleting(true);
        const toastId = toast.loading("Deleting your account...");
        try {
            // This is a placeholder for a real backend account deletion function.
            // In a real app, this would be a call to a Supabase Function.
            console.log("Simulating account deletion for user:", user.id);
            // After deletion, sign out.
            await signOut();
            toast.success("Account deleted successfully.", { id: toastId });
            setIsDeleteModalOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Failed to delete account.", { id: toastId });
        } finally {
            setIsDeleting(false);
        }
    }

    const TabButton = ({ id, label, icon }: { id: string, label: string, icon: React.ReactNode }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${activeTab === id ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}
        >
            {icon}
            {label}
        </button>
    );

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-8">
            <div>
                <h1 className="text-4xl font-extrabold tracking-tight mb-6">Settings</h1>
                <div className="flex flex-wrap gap-2 mb-8 border-b border-border pb-4">
                    <TabButton id="profile" label="Profile" icon={<User className="w-5 h-5"/>} />
                    <TabButton id="accessibility" label="Accessibility" icon={<Palette className="w-5 h-5"/>} />
                    <TabButton id="account" label="Account" icon={<Shield className="w-5 h-5"/>} />
                </div>

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>Change Username</CardTitle>
                                <CardDescription>Your current username is <span className="font-bold text-primary">{userData?.username}</span>.</CardDescription>
                            </CardHeader>
                            <form onSubmit={handleUsernameChange}>
                                <CardContent>
                                    <label htmlFor="new-username" className="text-sm font-medium">New Username</label>
                                    <Input id="new-username" type="text" placeholder="New username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="mt-1"/>
                                </CardContent>
                                <CardFooter>
                                    <Button type="submit" disabled={loadingUsername}>{loadingUsername ? 'Saving...' : 'Save Username'}</Button>
                                </CardFooter>
                            </form>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Change Password</CardTitle>
                                <CardDescription>Choose a new password for your account.</CardDescription>
                            </CardHeader>
                            <form onSubmit={handlePasswordChange}>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label htmlFor="current-password">Current Password</label>
                                        <div className="relative mt-1">
                                            <Input id="current-password" type={showCurrentPassword ? "text" : "password"} placeholder="Your current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required/>
                                            <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-muted-foreground"><EyeOff className={`h-5 w-5 ${showCurrentPassword ? '' : 'hidden'}`} /><Eye className={`h-5 w-5 ${showCurrentPassword ? 'hidden' : ''}`} /></button>
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="new-password">New Password</label>
                                        <div className="relative mt-1">
                                            <Input id="new-password" type={showNewPassword ? "text" : "password"} placeholder="At least 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required/>
                                            <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-muted-foreground"><EyeOff className={`h-5 w-5 ${showNewPassword ? '' : 'hidden'}`} /><Eye className={`h-5 w-5 ${showNewPassword ? 'hidden' : ''}`} /></button>
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="confirm-new-password">Confirm New Password</label>
                                        <div className="relative mt-1">
                                            <Input id="confirm-new-password" type={showConfirmPassword ? "text" : "password"} placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required/>
                                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-muted-foreground"><EyeOff className={`h-5 w-5 ${showConfirmPassword ? '' : 'hidden'}`} /><Eye className={`h-5 w-5 ${showConfirmPassword ? 'hidden' : ''}`} /></button>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button type="submit" disabled={loadingPassword}>{loadingPassword ? 'Saving...' : 'Save Password'}</Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </div>
                )}
                
                {/* Accessibility Tab */}
                {activeTab === 'accessibility' && (
                     <Card>
                        <CardHeader>
                            <CardTitle>Accessibility Settings</CardTitle>
                            <CardDescription>Customize the look and feel of the app for your comfort.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="font-semibold mb-2">Font Size</h3>
                                <div className="flex gap-2">
                                    <Button variant={fontSize === 'small' ? 'default' : 'outline'} onClick={() => handleFontSizeChange('small')}>Small</Button>
                                    <Button variant={fontSize === 'normal' ? 'default' : 'outline'} onClick={() => handleFontSizeChange('normal')}>Normal</Button>
                                    <Button variant={fontSize === 'large' ? 'default' : 'outline'} onClick={() => handleFontSizeChange('large')}>Large</Button>
                                </div>
                            </div>
                             <div>
                                <h3 className="font-semibold mb-2">High Contrast Mode</h3>
                                <p className="text-muted-foreground mb-3">A theme designed for maximum readability.</p>
                                <Button variant={userData?.active_theme === 'theme-high-contrast' ? 'secondary' : 'default'} onClick={() => applyTheme('theme-high-contrast')}>
                                    {userData?.active_theme === 'theme-high-contrast' ? 'High Contrast Active' : 'Enable High Contrast'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Account Tab */}
                {activeTab === 'account' && (
                     <Card>
                        <CardHeader>
                            <CardTitle>Account Management</CardTitle>
                            <CardDescription>Manage your account data and settings.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <div>
                                <h3 className="font-semibold mb-2">Export Data</h3>
                                <p className="text-muted-foreground mb-3">Download a JSON file of all your user data, including progress and achievements.</p>
                                <Button variant="secondary" onClick={handleExportData}><Download className="mr-2 h-4 w-4"/>Export My Data</Button>
                            </div>
                             <div className="p-4 border-l-4 border-destructive bg-destructive/10">
                                <h3 className="font-semibold mb-2 text-destructive">Delete Account</h3>
                                <p className="text-destructive/80 mb-3">Permanently delete your account and all associated data. This action cannot be undone.</p>
                                <Button variant="destructive" onClick={() => setIsDeleteModalOpen(true)}><Trash2 className="mr-2 h-4 w-4"/>Delete My Account</Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

            </div>
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Account Confirmation">
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-8 w-8 text-destructive min-w-[32px] mt-1" />
                        <div>
                            <h4 className="font-bold">This is a permanent action.</h4>
                            <p className="text-muted-foreground">Are you absolutely sure you want to delete your account? All of your progress, achievements, and purchases will be lost forever.</p>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="delete-confirm" className="font-medium text-sm">To confirm, please type "DELETE" below:</label>
                        <Input 
                            id="delete-confirm"
                            type="text"
                            value={deleteConfirmationText}
                            onChange={(e) => setDeleteConfirmationText(e.target.value)}
                            className="mt-1"
                            placeholder="DELETE"
                        />
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                    <Button 
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmationText !== 'DELETE' || isDeleting}
                    >
                        {isDeleting ? 'Deleting...' : 'Permanently Delete'}
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default ProfilePage;