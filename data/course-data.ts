import { Course, Tense } from '../types';
import { db } from '../services/firebase';
import toast from 'react-hot-toast';

export const COURSES_METADATA = [
  { id: 'present', name: 'Present Tenses', tenseCount: 4, description: 'Master habits, truths, and ongoing actions in the now.', iconName: 'BookOpen' },
  { id: 'past', name: 'Past Tenses', tenseCount: 4, description: 'Explore actions that have already happened.', iconName: 'History' },
  { id: 'future', name: 'Future Tenses', tenseCount: 4, description: 'Learn to speak about events yet to come.', iconName: 'Rocket' },
  { id: 'passive', name: 'Passive Voice', tenseCount: 3, description: 'Focus on the action, not the actor.', iconName: 'BookCopy' },
  { id: 'reported-speech', name: 'Reported Speech', tenseCount: 2, description: 'Understand how to report what others have said.', iconName: 'MessageSquareQuote' },
];

export async function getAllCoursesMetadata() {
  // 1. Get static courses
  const staticCourses = COURSES_METADATA.map(c => ({...c, userId: null, isCustom: false}));
  
  // 2. Get all custom courses from DB (now public due to RLS)
  try {
    const { data: customCourses, error } = await db.from('courses').select('*');
    if (error) { 
      console.error("Failed to fetch custom courses:", error.message || error);
      // Provide a specific, non-intrusive toast for schema errors
      if (error.message.includes('relation "public.courses" does not exist')) {
        if (!sessionStorage.getItem('db_schema_error_shown')) {
            toast.error("Could not load custom courses. The database schema appears to be incomplete.", { id: 'db-schema-error', duration: 6000 });
            sessionStorage.setItem('db_schema_error_shown', 'true');
        }
      } else {
         toast.error(`Could not load custom courses: ${error.message}`);
      }
      return staticCourses; // Return only static courses on failure
    }

    const formattedCustom = customCourses.map(c => ({
        id: c.id,
        name: c.name,
        tenseCount: c.tense_count,
        description: c.description,
        iconName: c.icon_name,
        userId: c.user_id, // Keep for "author" information
        isCustom: true
    }));
    
    // 4. Merge and return
    return [...staticCourses, ...formattedCustom];
  } catch (error: any) {
    console.error("Exception fetching custom courses:", error.message || error);
    return staticCourses;
  }
}

export async function getCourseData(courseId: string): Promise<Course | undefined> {
  const staticCourseMeta = COURSES_METADATA.find(c => c.id === courseId);

  try {
    if (staticCourseMeta) {
      let course: Course | undefined;
      switch (courseId) {
        case 'present':
          course = (await import('@/data/courses/present')).presentCourse;
          break;
        case 'past':
          course = (await import('@/data/courses/past')).pastCourse;
          break;
        case 'future':
          course = (await import('@/data/courses/future')).futureCourse;
          break;
        case 'passive':
          course = (await import('@/data/courses/passive')).passiveCourse;
          break;
        case 'reported-speech':
          course = (await import('@/data/courses/reported-speech')).reportedSpeechCourse;
          break;
        default:
          return undefined;
      }
      // Augment with metadata
      if (course) {
        course.description = staticCourseMeta.description;
        course.iconName = staticCourseMeta.iconName;
        course.userId = null;
      }
      return course;

    } else {
      // It's a custom course, fetch from DB. RLS now makes this public.
      const { data: courseMeta, error: courseError } = await db.from('courses').select('*').eq('id', courseId).single();
      if (courseError || !courseMeta) {
        console.error(`Custom course "${courseId}" not found`, courseError);
        return undefined;
      }

      const { data: tenses, error: tensesError } = await db.from('course_tenses').select('*').eq('course_id', courseId).order('order', { ascending: true });
      if (tensesError) {
        console.error(`Tenses for custom course ${courseId} not found`, tensesError);
        return undefined;
      }

      return {
        id: courseMeta.id,
        name: courseMeta.name,
        description: courseMeta.description,
        iconName: courseMeta.icon_name,
        userId: courseMeta.user_id,
        tenses: tenses.map(t => ({
          id: t.id,
          name: t.name,
          explanation: t.explanation as Tense['explanation'],
          course_id: t.course_id,
          order: t.order,
          user_id: t.user_id,
        }))
      };
    }
  } catch (error) {
    console.error(`Failed to load course data for ${courseId}`, error);
    return undefined;
  }
}

export async function getAllCoursesData(): Promise<Course[]> {
    // 1. Fetch all static courses via dynamic imports in parallel
    const staticCourseIds = COURSES_METADATA.map(c => c.id);
    const staticCoursePromises = staticCourseIds.map(id => getCourseData(id)); // getCourseData handles dynamic import

    // 2. Fetch all custom courses and tenses in two large queries
    const customCoursesPromise = db.from('courses').select('*');
    const customTensesPromise = db.from('course_tenses').select('*').order('order', { ascending: true });

    // 3. Await all promises in parallel
    // We add error handling for DB queries so one failure doesn't kill the whole page.
    const [staticCoursesResult, customCoursesResponse, customTensesResponse] = await Promise.all([
        Promise.all(staticCoursePromises),
        Promise.resolve(customCoursesPromise).then(res => ({ data: res.data, error: res.error })).catch(error => ({ data: null, error })),
        Promise.resolve(customTensesPromise).then(res => ({ data: res.data, error: res.error })).catch(error => ({ data: null, error })),
    ]);
    
    const { data: customCourses, error: courseError } = customCoursesResponse;
    const { data: customTenses, error: tensesError } = customTensesResponse;

    if (courseError) {
        console.error("Failed to fetch custom courses:", courseError);
        // Only toast for schema errors once to avoid spamming
        if (courseError.message && courseError.message.includes('relation "public.courses" does not exist')) {
            if (!sessionStorage.getItem('db_schema_error_shown')) {
                toast.error("Could not load custom courses. The database schema appears to be incomplete.", { id: 'db-schema-error', duration: 6000 });
                sessionStorage.setItem('db_schema_error_shown', 'true');
            }
        } else {
            toast.error(`Could not load custom courses: ${courseError.message}`);
        }
    }
    if (tensesError) {
        console.error("Failed to fetch custom tenses:", tensesError);
        toast.error(`Could not load custom tenses: ${tensesError.message}`);
    }

    // 4. Process custom courses
    const formattedCustomCourses: Course[] = [];
    if (customCourses && customTenses) {
        const tensesByCourseId = customTenses.reduce((acc, tense) => {
            if (!acc[tense.course_id]) {
                acc[tense.course_id] = [];
            }
            acc[tense.course_id].push({
                ...tense,
                explanation: tense.explanation as Tense['explanation']
            });
            return acc;
        }, {} as Record<string, Tense[]>);

        for (const courseMeta of customCourses) {
            formattedCustomCourses.push({
                id: courseMeta.id,
                name: courseMeta.name,
                description: courseMeta.description,
                iconName: courseMeta.icon_name,
                userId: courseMeta.user_id,
                tenses: tensesByCourseId[courseMeta.id] || []
            });
        }
    }

    // 5. Merge static and custom
    const allCourses = [
        ...staticCoursesResult.filter((c): c is Course => c !== undefined),
        ...formattedCustomCourses
    ];

    return allCourses;
}