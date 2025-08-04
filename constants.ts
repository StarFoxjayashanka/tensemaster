import { Achievement, ShopItem } from './types';

// Mock Achievements
export const ACHIEVEMENTS_DATA: Achievement[] = [
    { id: 'first-quiz', name: 'First Step', description: 'Complete your first quiz.', reward: { xp: 50, aiCoins: 10 } },
    { id: 'perfect-score', name: 'Perfectionist', description: 'Get a perfect score (100%) on any quiz.', reward: { xp: 100, aiCoins: 50 } },
    { id: 'present-master', name: 'Present Pro', description: 'Complete all Present Tenses quizzes.', reward: { xp: 200, aiCoins: 100 } },
    { id: 'past-master', name: 'Past Pro', description: 'Complete all Past Tenses quizzes.', reward: { xp: 200, aiCoins: 100 } },
    { id: 'future-master', name: 'Future Pro', description: 'Complete all Future Tenses quizzes.', reward: { xp: 200, aiCoins: 100 } },
    { id: 'passive-master', name: 'Passive Pro', description: 'Complete all Passive Voice quizzes.', reward: { xp: 150, aiCoins: 75 } },
    { id: 'reported-speech-master', name: 'Reported Pro', description: 'Complete all Reported Speech quizzes.', reward: { xp: 150, aiCoins: 75 } },
    { id: 'first-custom-master', name: 'Community Scholar', description: 'Master your first user-created course.', reward: { xp: 250, aiCoins: 125 } },
    { id: 'grammar-guru', name: 'Grammar Guru', description: 'Complete all available courses.', reward: { xp: 1000, aiCoins: 500 } },
    { id: 'streak-starter', name: 'Warming Up', description: 'Maintain a 3-day streak.', reward: { xp: 75, aiCoins: 25 } },
    { id: 'streak-master', name: 'On Fire!', description: 'Maintain a 7-day streak.', reward: { xp: 250, aiCoins: 150 } },
    { id: 'quiz-master', name: 'Dedicated Learner', description: 'Complete 25 quizzes in total.', reward: { xp: 300, aiCoins: 200 } },
    { id: 'high-roller', name: 'Big Spender', description: 'Spend 1000 AI Coins in the shop.', reward: { xp: 100, aiCoins: 0 } },
];

// Mock Shop Items
export const SHOP_ITEMS_DATA: ShopItem[] = [
    // Default Theme
    { id: 'deep-space', name: 'Deep Space', description: 'The sleek, default look for Tense Master AI.', type: 'theme', cost: 0 },
    
    // Accessibility Theme
    { id: 'theme-high-contrast', name: 'High Contrast', description: 'Maximum readability for focused learning.', type: 'theme', cost: 0 },

    // Normal Themes
    { id: 'theme-ocean', name: 'Ocean Depths', description: 'A calm and cool blue theme.', type: 'theme', cost: 250 },
    { id: 'theme-mint', name: 'Minty Fresh', description: 'A clean and refreshing light green theme.', type: 'theme', cost: 250 },
    { id: 'theme-emerald', name: 'Emerald Forest', description: 'A rich and vibrant green theme.', type: 'theme', cost: 300 },
    { id: 'theme-violet', name: 'Violet Dream', description: 'A deep and mysterious purple theme.', type: 'theme', cost: 300 },
    { id: 'theme-desert', name: 'Desert Mirage', description: 'A warm, sandy theme for adventurers.', type: 'theme', cost: 350 },
    { id: 'theme-nordic', name: 'Nordic Twilight', description: 'A cool, minimalist theme inspired by northern skies.', type: 'theme', cost: 350 },
    { id: 'theme-sakura', name: 'Sakura Blossom', description: 'A light and elegant pink theme.', type: 'theme', cost: 400 },
    { id: 'theme-lavender', name: 'Lavender Field', description: 'A calming and beautiful light purple theme.', type: 'theme', cost: 400 },

    // Premium Themes
    { id: 'theme-synthwave', name: 'Synthwave Sunset', description: 'A vibrant retro theme.', type: 'theme', cost: 500, premium: true },
    { id: 'theme-solar', name: 'Solar Flare', description: 'A warm and energetic orange theme.', type: 'theme', cost: 500, premium: true },
    { id: 'theme-cyberpunk', name: 'Cyberpunk Night', description: 'High-tech neons in a futuristic city.', type: 'theme', cost: 600, premium: true },
    { id: 'theme-crimson', name: 'Crimson Peak', description: 'A bold theme with striking red accents.', type: 'theme', cost: 600, premium: true },
    { id: 'theme-aurora', name: 'Northern Lights', description: 'Celestial greens and purples.', type: 'theme', cost: 700, premium: true },
    { id: 'theme-gilded', name: 'Gilded Onyx', description: 'Opulent gold on pure black.', type: 'theme', cost: 750, premium: true },
    { id: 'theme-velvet', name: 'Crimson Velvet', description: 'Luxurious and rich deep reds.', type: 'theme', cost: 700, premium: true },
    { id: 'theme-diamond', name: 'Diamond Brilliance', description: 'The ultimate luxury experience. Features an animated background, subtle card glows, button glints, a cursor sparkle trail, and a custom scrollbar.', type: 'theme', cost: 1000, premium: true },
    
    // Power-ups
    { id: 'powerup-hint', name: 'Hint', description: 'Reveals the correct answer for one question.', type: 'power-up', cost: 50 },
    { id: 'powerup-5050', name: '50/50', description: 'Removes two incorrect answers.', type: 'power-up', cost: 75 },
    { id: 'powerup-skip', name: 'Skip Question', description: 'Skips one question (counts as correct).', type: 'power-up', cost: 100 },
    { id: 'powerup-double-xp', name: 'Double XP', description: 'Doubles the XP earned from a quiz.', type: 'power-up', cost: 150 },
    { id: 'powerup-second-chance', name: 'Second Chance', description: 'Lets you change your answer for one question.', type: 'power-up', cost: 125 },
];