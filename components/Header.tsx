


import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from './Button';
import { Coins, Star, Menu, X, Shield } from 'lucide-react';

const Header: React.FC = () => {
  const { user, userData, isAdmin, signOut } = useAuth();
  const location = ReactRouterDOM.useLocation();
  const navigate = ReactRouterDOM.useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Dashboard', path: '/dashboard', auth: true },
    { name: 'Profile', path: '/profile', auth: true },
    { name: 'Admin', path: '/admin', admin: true }
  ];

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);
  
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMenuOpen]);

  const handleAuthAction = () => {
    if (user) {
      signOut();
    } else {
      navigate('/auth');
    }
    setIsMenuOpen(false);
  };
  
  const guestStats = { aiCoins: '-', xp: '-' };
  const userStats = { aiCoins: userData?.ai_coins, xp: userData?.xp };
  const displayStats = user ? userStats : guestStats;
  
  const renderLinks = (isMobile: boolean) => {
    return navLinks.map(link => {
      if (link.admin && !isAdmin) return null;
      if (link.auth && !user) return null;

      const className = isMobile
        ? `text-2xl font-bold transition-colors hover:text-primary ${location.pathname === link.path || (link.path === '/admin' && location.pathname.startsWith('/admin')) ? 'text-primary' : 'text-foreground'}`
        : `flex items-center text-lg font-medium transition-colors hover:text-foreground/80 sm:text-sm ${location.pathname === link.path || (link.path === '/admin' && location.pathname.startsWith('/admin')) ? 'text-foreground' : 'text-foreground/60'}`;

      return (
        <ReactRouterDOM.Link
          key={`${isMobile ? 'mobile-' : 'desktop-'}${link.name}`}
          to={link.path}
          className={className}
        >
          {link.admin && <Shield className={`mr-2 h-4 w-4 ${isMobile ? 'inline' : ''}`} />}
          {link.name}
        </ReactRouterDOM.Link>
      );
    });
  }


  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/70 backdrop-blur-lg px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <ReactRouterDOM.Link to="/" className="flex items-center space-x-2">
            <svg role="img" viewBox="0 0 24 24" className="h-8 w-8 text-primary">
              <path fill="currentColor" d="M12 0L6.5 3.33v6.67L12 13.33l5.5-3.33V3.33zM17.5 14l-5.5 3.33L6.5 14v6.67L12 24l5.5-3.33z"></path>
            </svg>
            <span className="hidden sm:inline-block font-bold text-lg">Tense Master AI</span>
          </ReactRouterDOM.Link>
          
          {/* Right-side Group for Desktop */}
          <div className="hidden md:flex items-center space-x-6">
            <nav className="flex gap-6">
              {renderLinks(false)}
            </nav>
            
            <div className="h-6 w-px bg-border"></div>
            
            <div className="flex items-center space-x-4">
                <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-coin" />
                    <span className="font-bold text-coin text-sm">{displayStats.aiCoins}</span>
                </div>
                 <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-primary" />
                    <span className="font-bold text-primary text-sm">{displayStats.xp} {user && <span className="hidden lg:inline">XP</span>}</span>
                </div>
                <Button onClick={handleAuthAction} variant="outline" size="sm">
                  {user ? 'Logout' : 'Login'}
                </Button>
            </div>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
              <Button onClick={() => setIsMenuOpen(true)} variant="ghost" size="icon">
                  <Menu className="h-6 w-6"/>
              </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-50 bg-background/95 backdrop-blur-lg transition-transform duration-300 ease-in-out md:hidden ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex flex-col h-full px-4 sm:px-6 lg:px-8">
             <div className="flex items-center justify-between h-20 border-b border-border">
                 <ReactRouterDOM.Link to="/" className="flex items-center space-x-2">
                    <svg role="img" viewBox="0 0 24 24" className="h-8 w-8 text-primary">
                        <path fill="currentColor" d="M12 0L6.5 3.33v6.67L12 13.33l5.5-3.33V3.33zM17.5 14l-5.5 3.33L6.5 14v6.67L12 24l5.5-3.33z"></path>
                    </svg>
                    <span className="font-bold text-lg">Tense Master AI</span>
                 </ReactRouterDOM.Link>
                 <Button onClick={() => setIsMenuOpen(false)} variant="ghost" size="icon">
                     <X className="h-6 w-6"/>
                 </Button>
             </div>
             <nav className="flex flex-col items-center justify-center flex-1 gap-8">
                 {renderLinks(true)}
             </nav>
              <div className="py-8 border-t border-border space-y-4">
                 <div className="flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2">
                        <Coins className="w-6 h-6 text-coin" />
                        <span className="font-bold text-coin text-lg">{displayStats.aiCoins}</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <Star className="w-6 h-6 text-primary" />
                        <span className="font-bold text-primary text-lg">{displayStats.xp} {user && 'XP'}</span>
                    </div>
                 </div>
                 <Button onClick={handleAuthAction} variant="outline" size="lg" className="w-full">
                    {user ? 'Logout' : 'Login'}
                </Button>
              </div>
          </div>
      </div>
    </>
  );
};

export default Header;