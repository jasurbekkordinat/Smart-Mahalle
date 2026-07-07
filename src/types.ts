export type UserRole = "citizen" | "admin" | "super_admin";

export interface User {
  id: string;
  username: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  patronymic?: string;
  email: string;
  phone: string;
  dob: string;
  region?: string;
  address?: string;
  passportMasked?: string;
  createdAt: string;
}

export type AppealStatus = "new" | "under_review" | "in_progress" | "resolved" | "rejected" | "postponed" | "unresolvable";

export type AppealCategory = string;

export type UrgencyLevel = "low" | "medium" | "high" | "critical";

export type SentimentType = "neutral" | "frustrated" | "angry" | "desperate";

export interface StatusHistoryEntry {
  id: string;
  status: AppealStatus;
  changedBy: string; // User's full name or username
  timestamp: string;
  note?: string;
}

export interface TranslatedFields {
  description: string;
  aiSummary: string;
  category: string;
  publicResponse?: string;
}

export interface MultiLanguageTranslation {
  uz: TranslatedFields;
  kaa: TranslatedFields;
  ru: TranslatedFields;
  en: TranslatedFields;
  [key: string]: TranslatedFields | undefined;
}

export interface Appeal {
  id: string;
  citizenId: string;
  citizenName: string; // Cached for easy joins
  citizenPhone: string;
  citizenRegion?: string;
  citizenPassportMasked?: string;
  description: string;
  address: string;
  imageUrl?: string; // Optional image attachment
  status: AppealStatus;
  category: AppealCategory;
  urgency: UrgencyLevel;
  sentiment: SentimentType;
  aiSummary?: string;
  suggestedDepartment?: string;
  assignedDepartment?: string;
  internalNotes?: string;
  publicResponse?: string;
  translations?: MultiLanguageTranslation;
  createdAt: string;
  updatedAt: string;
  history: StatusHistoryEntry[];
}

export interface Notification {
  id: string;
  userId: string;
  title: Record<string, string>; // Multi-language title
  message: Record<string, string>; // Multi-language body
  read: boolean;
  createdAt: string;
}

export interface Department {
  id: string;
  name: Record<string, string>; // Multi-language name
  manager: string;
  totalAssigned: number;
  totalResolved: number;
}
