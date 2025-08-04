import { Course } from '../../types';

export const reportedSpeechCourse: Course = {
    id: 'reported-speech',
    name: 'Reported Speech',
    description: 'Understand how to report what others have said.',
    iconName: 'MessageSquareQuote',
    tenses: [
        {
            id: 'reported-statements',
            name: 'Reported Statements',
            explanation: {
                mode: 'simple',
                usage: 'Used to report what someone else has said. Tenses usually shift back (e.g., present simple becomes past simple).',
                structure: {
                    positive: 'Reporting verb (said, told) + that + subject + shifted verb',
                    negative: 'Reporting verb + that + subject + not + shifted verb',
                    interrogative: 'N/A (Questions are handled differently)',
                    negativeInterrogative: 'N/A',
                },
                examples: {
                    positive: [
                        'Direct: "I am happy." -> Reported: He said that he was happy.',
                        'Direct: "We will go." -> Reported: They said they would go.'
                    ],
                    negative: [
                        'Direct: "She doesn\'t like fish." -> Reported: He told me she didn\'t like fish.',
                        'Direct: "I have not seen it." -> Reported: She said she had not seen it.'
                    ],
                    interrogative: [
                        'Tense shifts are a key concept here.',
                        'Pronouns and time expressions often change as well.'
                    ],
                    negativeInterrogative: [
                        'Reporting negative questions follows question rules.',
                        'e.g., "Why aren\'t you coming?" -> He asked why I wasn\'t coming.'
                    ],
                },
            },
        },
        {
            id: 'reported-questions',
            name: 'Reported Questions',
            explanation: {
                mode: 'simple',
                usage: 'Used to report questions. The word order changes to a normal statement, and the question mark is removed.',
                structure: {
                    positive: 'Reporting verb (asked) + if/whether/question word + subject + verb',
                    negative: 'N/A',
                    interrogative: 'N/A',
                    negativeInterrogative: 'N/A',
                },
                examples: {
                    positive: [
                        'Direct: "Are you coming?" -> Reported: She asked if I was coming.',
                        'Direct: "Where do you live?" -> Reported: He asked me where I lived.'
                    ],
                    negative: [
                        'Reported questions do not have a negative form in the same way statements do.'
                    ],
                    interrogative: [
                        'The main verb tense shifts back, similar to reported statements.'
                    ],
                    negativeInterrogative: [
                        'Direct: "Why isn\'t he here?" -> She asked why he wasn\'t there.'
                    ],
                },
            },
        },
    ],
};