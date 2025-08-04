

import React, { useRef, useState, useEffect, useCallback } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import Button from '../components/Button';
import Card, { CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/Card';
import { COURSES_METADATA } from '../data/course-data';
import Footer from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import DynamicIcon from '../components/DynamicIcon';
import { 
  ArrowDown, 
  PlayCircle, 
  CheckCircle2, 
  Zap, 
  Clock,
  Trophy,
  BarChart2,
  Github,
  Twitter,
  Linkedin,
  Loader2,
  Edit,
  Sparkles,
  Search,
  Puzzle
} from 'lucide-react';
import { db } from '../services/firebase';
import toast from 'react-hot-toast';
import { UserProfile } from '../types';


const challengeModes = [
  { id: 'classic', name: 'Classic Challenge', description: 'A balanced mix of questions from all courses.', icon: PlayCircle },
  { id: 'hard', name: 'Hard Mode', description: 'Face trickier distractors and more complex sentences.', icon: Zap },
  { id: 'time-attack', name: 'Time Attack', description: 'Race against the clock to answer as many questions as you can.', icon: Clock },
];

const gauntletModes = [
    { id: 'detective', name: 'Grammar Detective', description: 'Find the mistake in the text.', icon: Search, path: '/gauntlet/detective' },
    { id: 'cloze', name: 'Context is King', description: 'Fill in the blanks in a story.', icon: Puzzle, path: '/gauntlet/cloze' },
    { id: 'identification', name: 'Rapid Identification', description: 'Identify the tense, fast!', icon: Zap, path: '/gauntlet/identification' },
];

const getDailyChallengeMode = () => {
    const today = new Date();
    // Use the date as a seed for a simple pseudo-random number generator
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const pseudoRandom = (s: number) => {
        let x = Math.sin(s) * 10000;
        return x - Math.floor(x);
    };
    const randomIndex = Math.floor(pseudoRandom(seed) * challengeModes.length);
    return challengeModes[randomIndex];
};

interface FloatingElement {
  id: number;
  content: string | React.ReactNode;
  left: string;
  top: string;
  size: number;
  animationName: string;
  animationDuration: string;
  colorClass: string;
}

const bgImages = [
  'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2728&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=2920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1552152370-fb05b25ff17d?q=80&w=2940&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1525373692137-502010153147?q=80&w=2835&auto=format&fit=crop',
];

type CourseMeta = {
    id: string;
    name: string;
    tenseCount: number;
    description: string;
    iconName: string;
    userId: string | null;
    isCustom: boolean;
};

// --- Memoized Course Card Component ---
// To prevent re-renders on scroll, the course card is extracted and memoized.
interface CourseCardProps {
    course: CourseMeta;
    userData: UserProfile | null;
    isAdmin: boolean;
    onCardClick: (courseId: string) => void;
    onEditClick: (courseId: string) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, userData, isAdmin, onCardClick, onEditClick }) => {
    const courseProgress = userData?.course_progress?.[course.id] || {};
    const attemptedTensesCount = Object.keys(courseProgress).length;
    const completedTensesCount = Object.values(courseProgress).filter((t: any) => t.completed).length;

    const isCompleted = completedTensesCount === course.tenseCount && course.tenseCount > 0;
    const isInProgress = attemptedTensesCount > 0 && !isCompleted;

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEditClick(course.id);
    };

    return (
        <Card
          className="course-card relative overflow-hidden cursor-pointer group"
          onClick={() => onCardClick(course.id)}
          data-interactive
        >
          {course.isCustom && isAdmin && (
            <Button 
              variant="secondary" 
              size="sm" 
              className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleEditClick}
              aria-label={`Edit ${course.name} course`}
              >
                  <Edit className="w-4 h-4 mr-2" /> Edit
            </Button>
          )}
          <DynamicIcon name={course.iconName} className="absolute -right-4 -bottom-4 w-28 h-28 text-foreground/5 opacity-50 group-hover:opacity-10 transition-all duration-300 z-0 group-hover:scale-110" />
          <div className="relative z-10 card-content-wrapper">
              <CardHeader>
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                      <DynamicIcon name={course.iconName} className="w-8 h-8 text-primary transition-transform duration-300 group-hover:scale-125"/>
                      <CardTitle className="group-hover:text-primary transition-colors">{course.name}</CardTitle>
                  </div>
                  {isCompleted && <span title="Course Completed"><CheckCircle2 className="w-6 h-6 text-green-400" /></span>}
                  {isInProgress && <span title="Course in Progress"><PlayCircle className="w-6 h-6 text-yellow-400" /></span>}
                  </div>
              </CardHeader>
              <CardContent>
              <p className="text-muted-foreground">{course.description}</p>
              </CardContent>
          </div>
        </Card>
    );
};
const MemoizedCourseCard = React.memo(CourseCard);


const HomePage: React.FC = () => {
  const navigate = ReactRouterDOM.useNavigate();
  const { user, userData, isAdmin } = useAuth();
  const [courses, setCourses] = useState<CourseMeta[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [dailyChallenge, setDailyChallenge] = useState(getDailyChallengeMode());
  const [floatingElements, setFloatingElements] = useState<FloatingElement[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState(new Set([0]));
  const floatingElementsRef = useRef<(HTMLDivElement | null)[]>([]);
  
  const pageRef = useRef<HTMLDivElement>(null);
  const heroSectionRef = useRef<HTMLElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroSubtitleRef = useRef<HTMLParagraphElement>(null);
  const heroButtonRef = useRef<HTMLDivElement>(null);
  const challengeRef = useRef<HTMLDivElement>(null);
  const coursesGridRef = useRef<HTMLDivElement>(null);
  const featuresGridRef = useRef<HTMLDivElement>(null);
  const whyTenseMasterTitleRef = useRef<HTMLDivElement>(null);
  const missionRef = useRef<HTMLDivElement>(null);
  const missionTextRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const fetchCourses = async () => {
        setCoursesLoading(true);

        // Step 1: Set static courses immediately for faster perceived load
        const staticCourses: CourseMeta[] = COURSES_METADATA.map(c => ({
            ...c, 
            userId: null, 
            isCustom: false
        }));
        setCourses(staticCourses);
        setCoursesLoading(false);

        // Step 2: Fetch custom courses from DB and append them
        try {
            const { data: customCourses, error } = await db.from('courses').select('*');
            
            if (error) {
                if (error.message.includes('relation "public.courses" does not exist')) {
                    if (!sessionStorage.getItem('db_schema_error_shown')) {
                        toast.error("Could not load custom courses. The database schema appears to be incomplete.", { id: 'db-schema-error', duration: 6000 });
                        sessionStorage.setItem('db_schema_error_shown', 'true');
                    }
                } else {
                    toast.error(`Could not load custom courses: ${error.message}`);
                }
                return;
            }

            const formattedCustom: CourseMeta[] = customCourses.map(c => ({
                id: c.id,
                name: c.name,
                tenseCount: c.tense_count,
                description: c.description,
                iconName: c.icon_name,
                userId: c.user_id,
                isCustom: true
            }));

            setCourses(prevCourses => [...prevCourses, ...formattedCustom]);
        } catch (e: any) {
             console.error("Exception fetching custom courses:", e.message || e);
        }
    }
    fetchCourses();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % bgImages.length;
        // Preload the next slide
        setLoadedImages(prevLoaded => new Set(prevLoaded).add(nextIndex));
        return nextIndex;
      });
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Generate floating elements
    const elements: FloatingElement[] = [];
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const isMobile = window.innerWidth < 768;
    const numElements = Math.min(100, Math.floor((window.innerWidth * window.innerHeight) / (isMobile ? 20000 : 20000)));

    for (let i = 0; i < numElements; i++) {
        const isChar = Math.random() > 0.3;
        const color = ['bg-primary', 'bg-accent', 'bg-muted'][i % 3];
        let shapeNode: React.ReactNode;
        if (!isChar) {
          const shapeType = i % 3;
          if (shapeType === 0) shapeNode = <div className={`w-full h-full ${color} rounded-full`}></div>; // Circle
          else if (shapeType === 1) shapeNode = <div className={`w-full h-full ${color} rounded-[30%]`}></div>; // Squircle
          else shapeNode = <div className={`w-full h-full ${color}`} style={{clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}}></div>; // Triangle
        }

        elements.push({
            id: i,
            content: isChar ? chars[Math.floor(Math.random() * chars.length)] : shapeNode,
            left: `${Math.random() * 95}%`,
            top: `${Math.random() * 95}%`,
            size: Math.random() * 30 + 20, // 20px to 50px
            animationName: `float${(i % 3) + 1}`,
            animationDuration: `${Math.random() * 10 + 15}s`, // 15s to 25s
            colorClass: isChar ? `text-${color.replace('bg-', '')}-foreground ${color}` : '',
        });
    }
    setFloatingElements(elements);
    floatingElementsRef.current = new Array(elements.length);
    
    // Animate hero text on load
    setTimeout(() => {
        if(heroTitleRef.current) {
            // Target only character spans to avoid animating the wrapper
            heroTitleRef.current.querySelectorAll<HTMLElement>('.hero-title-char').forEach((span, index) => {
                span.style.transitionDelay = `${index * 50}ms`;
                span.style.opacity = '1';
                span.style.transform = 'translateY(0)';
            });
        }
        if(heroSubtitleRef.current) {
            heroSubtitleRef.current.style.opacity = '1';
            heroSubtitleRef.current.style.transform = 'translateY(0)';
        }
        if(heroButtonRef.current) {
            heroButtonRef.current.style.opacity = '1';
            heroButtonRef.current.style.transform = 'translateY(0)';
        }
    }, 200);

  }, []);

  useEffect(() => {
    const hero = heroSectionRef.current;
    if (!hero || floatingElements.length === 0) return;

    const handleMouseMove = (e: MouseEvent) => {
      requestAnimationFrame(() => {
        const { clientX, clientY } = e;
        floatingElementsRef.current.forEach(el => {
          if (!el) return;
          const rect = el.getBoundingClientRect();
          const elCenterX = rect.left + rect.width / 2;
          const elCenterY = rect.top + rect.height / 2;
          
          const distance = Math.sqrt((elCenterX - clientX) ** 2 + (elCenterY - clientY) ** 2);
          const repelRadius = 150;

          if (distance < repelRadius) {
            const force = 1 - distance / repelRadius;
            const dx = (elCenterX - clientX) / distance;
            const dy = (elCenterY - clientY) / distance;
            const moveX = dx * force * 60; // Repel strength
            const moveY = dy * force * 60;
            el.style.transform = `translate(${moveX}px, ${moveY}px)`;
          } else {
            el.style.transform = `translate(0, 0)`;
          }
        });
      });
    };

    const handleMouseLeave = () => {
      floatingElementsRef.current.forEach(el => {
        if (el) el.style.transform = `translate(0, 0)`;
      });
    };
    
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    if (isFinePointer) {
      hero.addEventListener('mousemove', handleMouseMove);
      hero.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (isFinePointer) {
        hero.removeEventListener('mousemove', handleMouseMove);
        hero.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [floatingElements]);


  const handleScroll = useCallback(() => {
    requestAnimationFrame(() => {
        if (!pageRef.current) return;
        const scrollY = window.scrollY;
        const wh = window.innerHeight;

        document.documentElement.style.setProperty('--scroll-y', `${scrollY}`);

        if (heroSectionRef.current) {
            const fadeOutDistance = 500;
            const opacity = Math.max(0, 1 - scrollY / fadeOutDistance);
            heroSectionRef.current.style.opacity = `${opacity}`;
            heroSectionRef.current.style.pointerEvents = opacity > 0 ? 'auto' : 'none';
        }

        if (challengeRef.current) {
            const { top } = challengeRef.current.getBoundingClientRect();
            const startAnimationPos = wh;
            const endAnimationPos = wh * 0.4;
            let progress = (startAnimationPos - top) / (startAnimationPos - endAnimationPos);
            progress = Math.max(0, Math.min(1, progress));

            const scale = 0.8 + 0.2 * progress;
            const opacity = progress;

            challengeRef.current.style.transform = `scale(${scale})`;
            challengeRef.current.style.opacity = `${opacity}`;
        }
        
        if (coursesGridRef.current) {
            const cards = coursesGridRef.current.children;
            for (let i = 0; i < cards.length; i++) {
                const card = cards[i] as HTMLElement;
                const cardTop = card.getBoundingClientRect().top;
                const cardHeight = card.offsetHeight;
                const delay = i * 100;
                card.style.transition = `transform 0.6s ${delay}ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.5s ${delay}ms ease-out`;

                if (cardTop < wh && cardTop > -cardHeight / 2) {
                    card.style.opacity = '1';
                    card.style.transform = `translateY(0) rotateX(0) rotateY(0) scale(1)`;
                } else {
                    card.style.opacity = '0';
                    card.style.transform = `translateY(80px) rotateX(-15deg) rotateY(10deg) scale(0.95)`;
                }
            }
        }

        if (whyTenseMasterTitleRef.current) {
            const titleTop = whyTenseMasterTitleRef.current.getBoundingClientRect().top;
            const STICKY_THRESHOLD = 96; // Corresponds to top-24 (24 * 4px)
            if (titleTop <= STICKY_THRESHOLD + 2 && titleTop >= STICKY_THRESHOLD - 2) {
                whyTenseMasterTitleRef.current.classList.add('is-stuck');
            } else {
                whyTenseMasterTitleRef.current.classList.remove('is-stuck');
            }
        }
        
        if (featuresGridRef.current) {
            const featureCards = featuresGridRef.current.children;
            for (let i = 0; i < featureCards.length; i++) {
                const card = featureCards[i] as HTMLElement;
                const cardTop = card.getBoundingClientRect().top;
                const cardHeight = card.offsetHeight;
                card.style.transition = `transform 0.8s ${i * 150}ms cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ${i * 150}ms cubic-bezier(0.16, 1, 0.3, 1)`;

                if (cardTop < wh && cardTop > -cardHeight / 2) {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0) rotate(0) scale(1)';
                } else {
                    card.style.opacity = '0';
                    card.style.transform = `translateY(50px) rotate(${i === 0 ? -4 : i === 2 ? 4 : 0}deg) scale(0.9)`;
                }
            }
        }
        
        if (missionTextRef.current) {
            const { top } = missionTextRef.current.getBoundingClientRect();
            const start = wh;
            const end = wh * 0.4;
            let progress = (start - top) / (start - end);
            progress = Math.max(0, Math.min(1, progress));

            const words = missionTextRef.current.querySelectorAll('span');
            const wordsToShow = Math.floor(progress * words.length);
            words.forEach((word, i) => {
                word.classList.toggle('visible', i < wordsToShow);
            });
        }
    });
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call to set states
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);
  
  const scrollToChallenge = () => {
    challengeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  
  const triggerConfetti = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const numPieces = 30;
    const colors = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--foreground))'];
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < numPieces; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        
        const xOffset = (Math.random() - 0.5) * 300;
        const yOffset = (Math.random() - 0.5) * 300;
        const rotate = Math.random() * 720 - 360;

        piece.style.left = `${clientX}px`;
        piece.style.top = `${clientY}px`;
        piece.style.backgroundColor = colors[i % colors.length];
        piece.style.setProperty('--translate-x', `${xOffset}px`);
        piece.style.setProperty('--translate-y', `${yOffset}px`);
        piece.style.setProperty('--rotate', `${rotate}deg`);
        
        fragment.appendChild(piece);

        setTimeout(() => piece.remove(), 1000);
    }
    document.body.appendChild(fragment);
  };

  const handleGetStartedClick = (e: React.MouseEvent) => {
    triggerConfetti(e);
    scrollToChallenge();
  };

  const handleCourseCardClick = useCallback((courseId: string) => {
      if (user) {
          navigate(`/course/${courseId}`);
      } else {
          navigate('/auth');
      }
  }, [user, navigate]);
  
  const handleEditCardClick = useCallback((courseId: string) => {
      navigate(`/admin/courses/edit/${courseId}`);
  }, [navigate]);

  const DailyChallengeIcon = dailyChallenge.icon;

  return (
    <div ref={pageRef} className="w-full">
      {/* Hero Section */}
      <section ref={heroSectionRef} className="relative h-screen w-full flex items-center justify-center overflow-hidden transition-opacity duration-300">
        <div className="hero-bg-slider">
            {bgImages.map((src, index) => (
                <div
                    key={src}
                    className={`hero-bg-slide ${index === currentImageIndex ? 'active' : ''}`}
                    style={{ backgroundImage: loadedImages.has(index) ? `url(${src})` : 'none' }}
                />
            ))}
        </div>
        <div className="hero-bg-overlay"></div>
        <div className="floating-elements-container">
            {floatingElements.map((el, i) => (
                <div 
                    key={el.id}
                    ref={(node) => { floatingElementsRef.current[i] = node; }}
                    className="floating-element"
                    style={{
                        left: el.left,
                        top: el.top,
                        width: `${el.size}px`,
                        height: `${el.size}px`,
                    }}
                >
                    <div
                      className={`floating-element-inner ${el.colorClass}`}
                      style={{
                          fontSize: `${el.size * 0.7}px`,
                          animationName: el.animationName,
                          animationDuration: el.animationDuration,
                      }}
                    >
                      {el.content}
                    </div>
                </div>
            ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent z-10"></div>
        <div className="relative z-30 text-center text-foreground p-4">
          <h1 ref={heroTitleRef} className="text-5xl md:text-7xl font-extrabold tracking-tighter hero-title hero-parallax-deep text-foreground">
            {'Tense Master '.split('').map((char, index) => (
              <span key={`master-${index}`} className="hero-title-char" style={{ whiteSpace: 'pre' }} data-interactive>
                {char}
              </span>
            ))}
            <span className="hero-title-ai">
              {'AI'.split('').map((char, index) => (
                <span key={`ai-${index}`} className="hero-title-char" style={{ whiteSpace: 'pre' }} data-interactive>
                  {char}
                </span>
              ))}
            </span>
          </h1>
          <p ref={heroSubtitleRef} className="mt-4 text-lg md:text-xl max-w-2xl mx-auto drop-shadow-md text-foreground/80 transition-all duration-1000 hero-subtitle hero-parallax-medium" style={{opacity: 0, transform: 'translateY(20px)'}}>
            The modern way to conquer English grammar.
          </p>
          <div ref={heroButtonRef} className="transition-all duration-1000 hero-parallax-shallow" style={{opacity: 0, transform: 'translateY(20px)'}}>
            <Button size="lg" className="mt-8 hero-action-button" onClick={handleGetStartedClick} data-interactive>
                Get Started
                <ArrowDown className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Daily Challenge & Gauntlet Section */}
      <section className="py-20 md:py-28 bg-background relative overflow-hidden">
        <div className="dynamic-shape shape1 top-0 left-0"></div>
        <div className="dynamic-shape shape2 bottom-0 right-0"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div ref={challengeRef} className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
             {/* Daily Challenge Card */}
            <Card className="text-center border-primary/30 hover:border-primary transition-colors duration-300 flex flex-col" data-interactive>
                <CardHeader>
                  <CardTitle className="text-3xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      Today's Launchpad
                  </CardTitle>
                  <CardDescription>A new challenge is available every 24 hours. Stay sharp!</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col items-center justify-center">
                  <div className="p-4 bg-primary/10 rounded-full mb-4 ring-4 ring-primary/5">
                    <DailyChallengeIcon className="w-10 h-10 text-primary"/>
                  </div>
                  <h3 className="text-2xl font-bold">{dailyChallenge.name}</h3>
                  <p className="mb-6 text-muted-foreground mt-1">{dailyChallenge.description}</p>
                </CardContent>
                <CardFooter className="justify-center">
                  <Button size="lg" onClick={() => navigate(`/challenge/${dailyChallenge.id}`)} data-interactive>
                      Start Daily Challenge
                  </Button>
                </CardFooter>
            </Card>
            {/* Grammar Gauntlet Card */}
             <Card className="text-center border-accent/30 hover:border-accent transition-colors duration-300 flex flex-col" data-interactive>
                <CardHeader>
                  <CardTitle className="text-3xl bg-gradient-to-r from-accent to-purple-500 bg-clip-text text-transparent">
                      The Grammar Gauntlet
                  </CardTitle>
                  <CardDescription>Test your practical skills with new, dynamic challenges.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col items-center justify-center">
                    <div className="space-y-4 text-left w-full mx-auto">
                        {gauntletModes.map(mode => {
                            const Icon = mode.icon;
                            return (
                                <div key={mode.id} className="flex items-center justify-center gap-4 p-3 bg-secondary/50 rounded-lg">
                                    <Icon className="w-6 h-6 text-accent flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-foreground">{mode.name}</p>
                                        <p className="text-xs text-muted-foreground">{mode.description}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
                <CardFooter className="justify-center">
                  <Button variant="secondary" size="lg" onClick={() => navigate(`/gauntlet`)} data-interactive className="bg-accent/20 hover:bg-accent/30 text-accent-foreground">
                      <Sparkles className="mr-2 h-5 w-5"/> Enter the Gauntlet
                  </Button>
                </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="py-20 md:py-28 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Our Courses</h2>
          {coursesLoading ? (
            <div className="flex justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
          ) : (
          <div ref={coursesGridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 perspective-container">
            {courses.map(course => (
              <MemoizedCourseCard 
                key={course.id}
                course={course}
                userData={userData}
                isAdmin={isAdmin}
                onCardClick={handleCourseCardClick}
                onEditClick={handleEditCardClick}
              />
            ))}
          </div>
          )}
        </div>
      </section>

      {/* Why Tense Master Section */}
      <section className="py-20 md:py-28 bg-background relative">
        <div className="container mx-auto px-4">
            <div ref={whyTenseMasterTitleRef} className="sticky top-24 z-10 mb-16 why-tense-master-sticky-title">
              <h2 className="text-3xl md:text-4xl font-bold text-center transition-transform duration-300">Why Tense Master?</h2>
              <div className="w-24 h-1 bg-primary mx-auto mt-4 transition-transform duration-300 scale-x-0 origin-center title-underline"></div>
            </div>
            <div className="perspective-container">
              <div ref={featuresGridRef} className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center relative z-0">
                  {[
                  { icon: Trophy, title: 'Gamified Learning', text: 'Earn XP, AI Coins, and unlock achievements as you master new skills. Learning has never been this rewarding.' },
                  { icon: Zap, title: 'Targeted Quizzes', text: 'Test your knowledge with quizzes designed for each specific tense, helping you pinpoint areas for improvement.' },
                  { icon: BarChart2, title: 'Detailed Analytics', text: 'Track your progress with detailed charts and stats, visualizing your journey to grammar mastery.' },
                  ].map((feature, i) => {
                  const FeatureIcon = feature.icon;
                  return (
                      <div key={i} className="flex flex-col items-center feature-card">
                      <div className="p-4 bg-primary/10 rounded-full mb-4 ring-4 ring-primary/5 feature-icon-wrapper">
                          <FeatureIcon className="w-8 h-8 text-primary"/>
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.text}</p>
                      </div>
                  );
                  })}
              </div>
            </div>
        </div>
      </section>

      {/* Mission Section */}
      <section ref={missionRef} className="py-20 md:py-28 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Mission</h2>
            <p ref={missionTextRef} className="text-xl leading-relaxed word-reveal">
              {'We believe that mastering English grammar shouldn\'t be a chore. Our mission is to make learning interactive, accessible, and genuinely fun. Tense Master AI combines proven educational techniques with cutting-edge technology to create a personalized path to fluency for every learner.'.split(' ').map((word, i) => (
                <span key={i}>{word} </span>
              ))}
            </p>
          </div>
        </div>
      </section>

      {/* Get In Touch Section */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold">Get In Touch</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              Have questions, feedback, or suggestions? We'd love to hear from you.
            </p>
            <a href="mailto:contact@tensemasterai.com">
                <Button size="lg" className="mt-8" data-interactive>Contact Us</Button>
            </a>
            <div className="mt-8 flex justify-center gap-6">
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" data-interactive><Github className="h-7 w-7" /></a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" data-interactive><Twitter className="h-7 w-7" /></a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" data-interactive><Linkedin className="h-7 w-7" /></a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;