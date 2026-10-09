export const samples = {
  english: `Meeting date: Friday, October 9, 2026

Maya: I'll send the revised launch brief to the team by Friday.
Leo: I can own the pricing comparison, but I don't have a date yet.
Priya: Let's revisit the onboarding flow next week.
Maya: Leo, please book the customer interviews for October 14.
Leo: Got it, I'll book them for October 14.`,
  hinglish: `Meeting date: Friday, October 9, 2026

Anika: Main onboarding email ka first draft Monday, October 12 tak bhej dungi.
Rohan: Great, uske baad main Hindi copy review kar lunga.
Sam: I'll check the signup numbers, but let's not put a date on it yet.
Anika: Rohan, can you share the final copy with the design team by Friday?
Rohan: Haan, Friday tak share kar dunga.`,
} as const;

export type SampleKey = keyof typeof samples;
