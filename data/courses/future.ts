import { Course } from '../../types';

export const futureCourse: Course = {
    id: 'future',
    name: 'Future Tenses',
    description: 'Learn to speak about events yet to come.',
    iconName: 'Rocket',
    tenses: [
        {
            id: 'simple-future',
            name: 'Simple Future',
            explanation: {
                mode: 'simple',
                usage: 'Used for predictions, promises, spontaneous decisions (will), and future plans or intentions (be going to).',
                structure: {
                    positive: 'Subject + will/shall + V1  OR  Subject + am/is/are + going to + V1',
                    negative: 'Subject + will not (won\'t) + V1  OR  Subject + am/is/are + not + going to + V1',
                    interrogative: 'Will + subject + V1?  OR  Am/Is/Are + subject + going to + V1?',
                    negativeInterrogative: "Won't + subject + V1? OR Isn't/Aren't + subject + going to + V1?",
                },
                examples: {
                    positive: ['I think it will rain tomorrow.', 'I am going to visit my cousin next week.'],
                    negative: ['He won\'t be happy with the news.', 'We aren\'t going to watch that movie.'],
                    interrogative: ['Will you help me with this?', 'Are you going to the party?'],
                    negativeInterrogative: ["Won't you help me?", "Aren't you going to the party?"],
                },
            },
        },
        {
            id: 'future-continuous',
            name: 'Future Continuous',
            explanation: {
                mode: 'simple',
                usage: 'Describes an action that will be in progress at a specific time in the future.',
                structure: {
                    positive: 'Subject + will be + V1 + ing',
                    negative: 'Subject + will not be + V1 + ing',
                    interrogative: 'Will + subject + be + V1 + ing?',
                    negativeInterrogative: "Won't + subject + be + V1 + ing?",
                },
                examples: {
                    positive: ['This time tomorrow, I will be flying to Japan.', 'Don\'t call at 8, I will be having dinner.'],
                    negative: ['He won\'t be working when you arrive.', 'They will not be sleeping.'],
                    interrogative: ['Will you be using the car this evening?', 'What will you be doing?'],
                    negativeInterrogative: ["Won't you be using the car this evening?", "Won't they be sleeping?"],
                },
            },
        },
        {
            id: 'future-perfect',
            name: 'Future Perfect',
            explanation: {
                mode: 'simple',
                usage: 'Describes an action that will be completed before a specific point in the future.',
                structure: {
                    positive: 'Subject + will have + V3 (Past Participle)',
                    negative: 'Subject + will not have + V3',
                    interrogative: 'Will + subject + have + V3?',
                    negativeInterrogative: "Won't + subject + have + V3?",
                },
                examples: {
                    positive: ['By 2030, I will have finished my studies.', 'She will have cooked dinner by the time we get home.'],
                    negative: ['They will not have completed the project by Friday.', 'I won\'t have saved enough money.'],
                    interrogative: ['Will you have graduated by next year?', 'Will she have left?'],
                    negativeInterrogative: ["Won't you have graduated by next year?", "Won't she have left already?"],
                },
            },
        },
        {
            id: 'future-perfect-continuous',
            name: 'Future Perfect Continuous',
            explanation: {
                mode: 'simple',
                usage: 'Emphasizes the duration of an action up to a certain point in the future.',
                structure: {
                    positive: 'Subject + will have been + V1 + ing',
                    negative: 'Subject + will not have been + V1 + ing',
                    interrogative: 'Will + subject + have been + V1 + ing?',
                    negativeInterrogative: "Won't + subject + have been + V1 + ing?",
                },
                examples: {
                    positive: ['By next month, I will have been working here for five years.', 'He will have been traveling for a year.'],
                    negative: ['She won\'t have been studying long enough to pass.', 'We will not have been living here for long.'],
                    interrogative: ['How long will you have been living here?', 'Will he have been waiting for a long time?'],
                    negativeInterrogative: ["Won't you have been living here for long?", "Won't he have been waiting for a long time?"],
                },
            },
        }
    ]
};