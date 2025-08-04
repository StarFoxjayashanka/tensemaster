import { Course } from '../../types';

export const pastCourse: Course = {
    id: 'past',
    name: 'Past Tenses',
    description: 'Explore actions that have already happened.',
    iconName: 'History',
    tenses: [
        {
            id: 'simple-past',
            name: 'Simple Past',
            explanation: {
                mode: 'simple',
                usage: 'Used to talk about a completed action in a time before now. The time of the action can be in the recent past or the distant past.',
                structure: {
                    positive: 'Subject + V2 (Past Simple)',
                    negative: 'Subject + did + not + V1',
                    interrogative: 'Did + subject + V1?',
                    negativeInterrogative: "Didn't + subject + V1?",
                },
                examples: {
                    positive: ['I visited Paris last year.', 'He played soccer yesterday.'],
                    negative: ['I did not visit Paris last year.', 'He did not play soccer yesterday.'],
                    interrogative: ['Did you visit Paris last year?', 'Did he play soccer yesterday?'],
                    negativeInterrogative: ["Didn't you visit Paris last year?", "Didn't he play soccer yesterday?"],
                },
            },
        },
        {
            id: 'past-continuous',
            name: 'Past Continuous',
            explanation: {
                mode: 'simple',
                usage: 'Used to describe an action that was in progress at a specific time in the past. It often sets the scene for another action.',
                structure: {
                    positive: 'Subject + was/were + V1 + ing',
                    negative: 'Subject + was/were + not + V1 + ing',
                    interrogative: 'Was/Were + subject + V1 + ing?',
                    negativeInterrogative: "Wasn't/Weren't + subject + V1 + ing?",
                },
                examples: {
                    positive: ['I was watching TV when you called.', 'They were playing in the park.'],
                    negative: ['I was not watching TV when you called.', 'They were not playing in the park.'],
                    interrogative: ['Were you watching TV when I called?', 'Were they playing in the park?'],
                    negativeInterrogative: ["Weren't you watching TV when I called?", "Wasn't he playing in the park?"],
                },
            },
        },
        {
            id: 'past-perfect',
            name: 'Past Perfect',
            explanation: {
                mode: 'simple',
                usage: 'Used to show that one action in the past happened before another action in the past (the "past in the past").',
                structure: {
                    positive: 'Subject + had + V3 (Past Participle)',
                    negative: 'Subject + had + not + V3',
                    interrogative: 'Had + subject + V3?',
                    negativeInterrogative: "Hadn't + subject + V3?",
                },
                examples: {
                    positive: ['The train had left when I arrived at the station.', 'She had finished her homework before she went to bed.'],
                    negative: ['The train had not left when I arrived.', 'She had not finished her homework.'],
                    interrogative: ['Had the train left when you arrived?', 'Had she finished her homework?'],
                    negativeInterrogative: ["Hadn't the train left when you arrived?", "Hadn't she finished her homework?"],
                },
            },
        },
        {
            id: 'past-perfect-continuous',
            name: 'Past Perfect Continuous',
            explanation: {
                mode: 'simple',
                usage: 'Similar to the Past Perfect, but it emphasizes the duration of an activity that was in progress before another event in the past.',
                structure: {
                    positive: 'Subject + had + been + V1 + ing',
                    negative: 'Subject + had + not + been + V1 + ing',
                    interrogative: 'Had + subject + been + V1 + ing?',
                    negativeInterrogative: "Hadn't + subject + been + V1 + ing?",
                },
                examples: {
                    positive: ['He had been waiting for an hour before the bus came.', 'They had been talking for a long time.'],
                    negative: ['He had not been waiting for long.', 'They had not been talking.'],
                    interrogative: ['Had he been waiting for a long time?', 'Had they been talking?'],
                    negativeInterrogative: ["Hadn't he been waiting for a long time?", "Hadn't they been talking?"],
                },
            },
        }
    ]
};