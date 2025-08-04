


import React, { useState } from 'react';
import { auth } from '../services/firebase';
import Button from '../components/Button';
import Input from '../components/Input';
import Card, { CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/Card';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password Reset State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const loadingToast = toast.loading('Please wait...');
    try {
      if (isLogin) {
        await auth.signInWithEmailAndPassword(email, password);
        toast.success('Logged in successfully!', { id: loadingToast });
      } else {
        if (!username) {
            throw new Error("Username is required for sign up.");
        }
        if (password !== confirmPassword) {
            throw new Error("Passwords do not match.");
        }
        await auth.signUp(email, password, username);
        // The user profile is created by a database trigger in Supabase.
        toast.success('Account created successfully! Please check your email to verify.', { id: loadingToast, duration: 6000 });
      }
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.message || `Failed to ${isLogin ? 'log in' : 'sign up'}.`;
      toast.error(errorMessage, { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
        toast.error('Please enter your email address.');
        return;
    }
    setIsResetting(true);
    const toastId = toast.loading('Sending recovery link...');
    try {
        await auth.sendPasswordResetEmail(resetEmail);
        toast.success('If an account exists, a recovery link has been sent.', { id: toastId, duration: 6000 });
        setIsResetModalOpen(false);
        setResetEmail('');
    } catch (error: any) {
        toast.error(error.message || 'Failed to send recovery link.', { id: toastId });
    } finally {
        setIsResetting(false);
    }
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setUsername('');
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-background overflow-hidden p-4">
       <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-secondary/50 via-background to-background"></div>
       <div className="absolute inset-0 -z-20 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">{isLogin ? 'Login' : 'Sign Up'}</CardTitle>
          <CardDescription>
            {isLogin ? 'Enter your credentials to access your account.' : 'Create an account to begin your journey.'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleAuth}>
          <CardContent className="grid gap-4">
            {!isLogin && (
              <div className="grid gap-2">
                <label htmlFor="username">Username</label>
                <Input id="username" type="text" placeholder="YourUsername" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
            )}
            <div className="grid gap-2">
              <label htmlFor="email">Email</label>
              <Input id="email" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password">Password</label>
                {isLogin && (
                    <button type="button" onClick={() => setIsResetModalOpen(true)} className="text-sm font-medium text-primary/80 hover:text-primary hover:underline">
                        Forgot password?
                    </button>
                )}
              </div>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-muted-foreground hover:text-foreground transition-colors" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
             {!isLogin && (
              <div className="grid gap-2">
                <label htmlFor="confirm-password">Confirm Password</label>
                <div className="relative">
                    <Input id="confirm-password" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-muted-foreground hover:text-foreground transition-colors" aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading} size="lg">
              {loading ? (isLogin ? 'Logging in...' : 'Signing up...') : (isLogin ? 'Login' : 'Sign Up')}
            </Button>
            <div className="mt-4 text-center text-sm">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <button type="button" onClick={toggleForm} className="underline text-primary/80 hover:text-primary ml-1">
                {isLogin ? 'Sign up' : 'Login'}
              </button>
            </div>
          </CardFooter>
        </form>
      </Card>

      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset Your Password"
      >
        <div className="grid gap-4">
            <p className="text-muted-foreground text-sm">
                Enter the email address associated with your account, and we'll send you a link to reset your password.
            </p>
            <div className="grid gap-2">
                <label htmlFor="reset-email">Email</label>
                <Input
                    id="reset-email"
                    type="email"
                    placeholder="m@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    disabled={isResetting}
                />
            </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsResetModalOpen(false)} disabled={isResetting}>
                Cancel
            </Button>
            <Button onClick={handlePasswordReset} disabled={isResetting}>
                {isResetting ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : null}
                Send Recovery Link
            </Button>
        </div>
      </Modal>

    </div>
  );
};

export default AuthPage;