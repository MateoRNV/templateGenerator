export interface ProgramData {
  name: string;
  isShareable: boolean;
  code: string;
}

export interface TemplateParameter {
  order: number;
  name: string;
  code: string;
  measurementMode: string;
  deviceName: string;
  deviceCode: string;
  durationDays: number;
  isRecurring: boolean;
}

export interface WeekDaySchedule {
  dayNumber: number;
  times: string[];
}

export interface BiometricSchedule {
  code: string;
  periodCode: string;
  weekDays: WeekDaySchedule[];
}

export interface NewParameter {
  name: string;
  code: string;
  shortDescription: string;
  category: string;
  categoryCode: string;
  decimalPrecision: number | null;
  minValue: number | null;
  maxValue: number | null;
  increment: number | null;
  measurementUnit: string;
  chartIncrement: number | null;
}

export interface NewExercise {
  order: number;
  code: string;
  description: string;
  shortDescription: string;
  objective: string;
  instructions: string;
}

export interface NewContent {
  order: number;
  title: string;
  code: string;
  category: string;
  categoryCode: string;
  description: string;
  objective: string;
}

export interface ContentPlan {
  description: string;
  durationDays: number;
  contentsPerDay: number;
  periodCode: string;
  activeDays: number[];
}

export interface ExercisePlan {
  description: string;
  durationDays: number;
  periodCode: string;
  weekDays: WeekDaySchedule[];
}

export interface QuestionnaireSchedule {
  description: string;
  durationDays: number;
  periodCode: string;
  weekDays: WeekDaySchedule[];
}

export interface EducationalContentItem {
  order: number;
  name: string;
  code: string;
  planDescription: string;
  isActive: boolean;
}

export interface ItemParameter {
  code: string;
  value: number;
}

export interface TemplateExerciseItem {
  order: number;
  name: string;
  code: string;
  instructions: string;
  planDescription: string;
  parameters: ItemParameter[];
}

export interface AnswerKey {
  value: number;
  description: string;
  code: string;
}

export interface PredefinedQuestion {
  title: string;
  description: string;
  code: string;
  order: number | null;
  instructions: string;
  questionNumber: string;
  responseKeyType: string;
  minValue: number | null;
  maxValue: number | null;
  useInCustomQuestionnaire: number;
  answerKeys: AnswerKey[];
  newAnswerKeys: boolean;
}

export interface PredefinedQuestionnaire {
  description: string;
  code: string;
  instructions: string;
  questions: PredefinedQuestion[];
}
