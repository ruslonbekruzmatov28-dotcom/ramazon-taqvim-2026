
export interface PrayerTimes {
  date: string;
  day: number;
  fajr: string;
  maghrib: string;
  hijriDate?: string;
}

export interface Region {
  id: number;
  name: string;
  nameLatin: string;
  offset: number; // minutes relative to Tashkent
}

export enum AppState {
  TODAY = 'today',
  TOMORROW = 'tomorrow',
  MONTH = 'month',
  REGION = 'region',
  DUA = 'dua',
  CHAT = 'chat'
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}
