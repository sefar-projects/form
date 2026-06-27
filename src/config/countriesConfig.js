export const countriesConfig = {
  italy: {
    name: 'Italy',
    requiredMinimumGpa: 10,
    weighting: {
      base: 28,
      markBonus: 36,
      languageBonus: 20,
      degreeBonus: 8,
      gpaPenalty: 10,
    },
    dynamicFields: [
      {
        id: 'italy_language_prep',
        label: 'Do you already have a level in Italian, or are you interested in studying a Preparatory Language Year?',
        type: 'select',
        options: ['I have a level in Italian', 'I want a Preparatory Year', 'I want to study in English only'],
      },
    ],
  },
  poland: {
    name: 'Poland',
    requiredMinimumGpa: 9.5,
    weighting: {
      base: 30,
      markBonus: 34,
      languageBonus: 18,
      degreeBonus: 7,
      gpaPenalty: 8,
    },
    dynamicFields: [
      {
        id: 'poland_language_prep',
        label: 'Do you have a level in Polish, or are you interested in a Preparatory Language Year?',
        type: 'select',
        options: ['I have a level in Polish', 'I want a Preparatory Year', 'I want to study in English only'],
      },
    ],
  },
  hungary: {
    name: 'Hungary',
    requiredMinimumGpa: 10.5,
    weighting: {
      base: 27,
      markBonus: 35,
      languageBonus: 19,
      degreeBonus: 8,
      gpaPenalty: 10,
    },
    dynamicFields: [
      {
        id: 'hungary_entrance_exam',
        label: 'Are you comfortable taking a basic online entrance exam (usually Math and English) if the university requires it?',
        type: 'select',
        options: ['Yes, I am comfortable', 'No, I prefer universities without entrance exams'],
      },
      {
        id: 'hungary_health',
        label: 'Do you suffer from any chronic or contagious diseases? (Required for health fitness clearance)',
        type: 'select',
        options: ['No, I am healthy', 'Yes'],
      },
    ],
  },
  china: {
    name: 'China',
    requiredMinimumGpa: 11,
    weighting: {
      base: 26,
      markBonus: 38,
      languageBonus: 19,
      degreeBonus: 9,
      gpaPenalty: 11,
    },
    dynamicFields: [
      {
        id: 'china_language_prep',
        label: 'Do you have a level in Chinese (HSK), or are you interested in a Preparatory Language Year?',
        type: 'select',
        options: ['I have a level in Chinese', 'I want a Preparatory Year', 'I want to study in English only'],
      },
      {
        id: 'china_health',
        label: 'Do you suffer from any contagious diseases? (Mandatory for the Foreigner Physical Examination)',
        type: 'select',
        options: ['No, I am completely healthy', 'Yes'],
      },
    ],
  },
  romania: {
    name: 'Romania',
    requiredMinimumGpa: 9,
    weighting: {
      base: 31,
      markBonus: 33,
      languageBonus: 18,
      degreeBonus: 7,
      gpaPenalty: 7,
    },
    dynamicFields: [
      {
        id: 'romania_language_prep',
        label: 'Do you have a level in Romanian/French, or are you interested in a Preparatory Year?',
        type: 'select',
        options: ['I have a level in Romanian/French', 'I want a Preparatory Year', 'I want to study in English only'],
      },
      {
        id: 'romania_health',
        label: 'Do you suffer from any contagious diseases? (Required for the medical certificate)',
        type: 'select',
        options: ['No, I am healthy', 'Yes'],
      },
    ],
  },
  uk: {
    name: 'England (UK)',
    requiredMinimumGpa: 12,
    weighting: {
      base: 24,
      markBonus: 40,
      languageBonus: 22,
      degreeBonus: 10,
      gpaPenalty: 12,
    },
    dynamicFields: [
      {
        id: 'uk_strict_funds',
        label: 'The UK has a strict visa rule: Can you keep your entire tuition and living budget completely untouched in a bank account for 28 consecutive days?',
        type: 'select',
        options: ['Yes, I can do that', 'No, I cannot'],
      },
      {
        id: 'uk_tb_test',
        label: 'Are you willing to undergo a Tuberculosis (TB) test at a UK-approved clinic?',
        type: 'select',
        options: ['Yes', 'No'],
      },
    ],
  },
}
