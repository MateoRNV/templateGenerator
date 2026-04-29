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
  isNew: boolean;
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

export interface ContentPlanConfig {
  durationDays: number;
  contentsPerDay: number;
}

export interface EducationalContentItem {
  order: number;
  name: string;
  code: string;
  isOptional: boolean;
}
