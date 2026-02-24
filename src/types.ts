/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum AppState {
  WELCOME = 'welcome',
  TODAY = 'today',
  MONTH = 'month',
  DUA = 'dua',
  CHAT = 'chat',
  REGION = 'region',
  TASBIH = 'tasbih'
}

export interface NotificationSettings {
  enabled: boolean;
  saharReminder: boolean;
  iftorReminder: boolean;
  reminderMinutes: number;
  telegramEnabled: boolean;
  telegramChatId: string;
  telegramBotToken: string;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}

export interface CalendarDay {
  day: number;
  date: string;
  fajr: string;
  maghrib: string;
}

export interface DistrictOffset {
  name: string;
  sahar: number;
  iftor: number;
}

export interface Dua {
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
}
