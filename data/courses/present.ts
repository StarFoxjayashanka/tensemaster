import { Course } from '../../types';

export const presentCourse: Course = {
    id: 'present',
    name: 'Present Tenses',
    description: 'Master habits, truths, and ongoing actions in the now.',
    iconName: 'BookOpen',
    tenses: [
      {
        id: 'simple-present',
        name: 'Simple Present',
        explanation: {
          mode: 'simple',
          usage: 'Used for habits, unchanging situations, general truths, and fixed arrangements.',
          structure: {
            positive: 'Subject + V1 (+s/es)',
            negative: 'Subject + do/does + not + V1',
            interrogative: 'Do/Does + subject + V1?',
            negativeInterrogative: "Don't/Doesn't + subject + V1?",
          },
          examples: {
            positive: ['I work in London.', 'She plays the guitar.'],
            negative: ['I do not work in London.', 'She does not play the guitar.'],
            interrogative: ['Do you work in London?', 'Does she play the guitar?'],
            negativeInterrogative: ["Don't you work in London?", "Doesn't she play the guitar?"],
          },
        },
      },
      {
        id: 'present-continuous',
        name: 'Present Continuous',
        explanation: {
          mode: 'simple',
          usage: 'Used for actions happening at the moment of speaking, for temporary actions, and for definite future plans.',
          structure: {
            positive: 'Subject + is/am/are + V1 + ing',
            negative: 'Subject + is/am/are + not + V1 + ing',
            interrogative: 'Is/Am/Are + subject + V1 + ing?',
            negativeInterrogative: "Isn't/Aren't + subject + V1 + ing?",
          },
          examples: {
            positive: ['I am working right now.', 'They are coming to the party tonight.'],
            negative: ['I am not working right now.', 'They are not coming to the party.'],
            interrogative: ['Are you working right now?', 'Are they coming to the party?'],
            negativeInterrogative: ["Aren't you working right now?", "Isn't he coming to the party?"],
          },
        },
      },
      {
        id: 'present-perfect',
        name: 'Present Perfect',
        explanation: {
          mode: 'simple',
          usage: 'Used for actions that started in the past and continue to the present or for past actions that have a result in the present. The exact time is not important.',
          structure: {
            positive: 'Subject + have/has + V3 (Past Participle)',
            negative: 'Subject + have/has + not + V3',
            interrogative: 'Have/Has + subject + V3?',
            negativeInterrogative: "Haven't/Hasn't + subject + V3?",
          },
          examples: {
            positive: ['I have seen that movie.', 'She has lived here for three years.'],
            negative: ['I have not seen that movie.', 'She has not lived here for three years.'],
            interrogative: ['Have you seen that movie?', 'Has she lived here for three years?'],
            negativeInterrogative: ["Haven't you seen that movie?", "Hasn't she lived here for three years?"],
          },
        },
      },
      {
        id: 'present-perfect-continuous',
        name: 'Present Perfect Continuous',
        explanation: {
          mode: 'simple',
          usage: 'Used to show that an action started in the past and has continued up to the present moment. It emphasizes the duration of the action.',
          structure: {
            positive: 'Subject + have/has + been + V1 + ing',
            negative: 'Subject + have/has + not + been + V1 + ing',
            interrogative: 'Have/Has + subject + been + V1 + ing?',
            negativeInterrogative: "Haven't/Hasn't + subject + been + V1 + ing?",
          },
          examples: {
            positive: ['I have been waiting for hours.', 'She has been studying all day.'],
            negative: ['I have not been waiting for hours.', 'She has not been studying all day.'],
            interrogative: ['Have you been waiting for hours?', 'Has she been studying all day?'],
            negativeInterrogative: ["Haven't you been waiting long?", "Hasn't she been studying all day?"],
          },
        },
      },
    ],
};