/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { KHOREZM_2026_CALENDAR, KHOREZM_DISTRICTS, DUAS } from './constants';
import { AppState, Message, DistrictOffset, CalendarDay, NotificationSettings } from './types';
import { getGeminiChatResponse } from './services/geminiService';
import {
  Calendar,
  Clock,
  BookOpen,
  MessageSquare,
  Send,
  Sun,
  Moon,
  MapPin,
  ChevronRight,
  Info,
  Timer,
  Settings,
  Bell,
  BellOff,
  Smartphone,
  CheckCircle2,
  SendHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<AppState>(() => {
    const saved = localStorage.getItem('app_started');
    return saved ? AppState.TODAY : AppState.WELCOME;
  });
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictOffset>(() => {
    const saved = localStorage.getItem('selected_district');
    return saved ? JSON.parse(saved) : KHOREZM_DISTRICTS[0];
  });
  const [notifications, setNotifications] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('notifications');
    return saved ? JSON.parse(saved) : {
      enabled: false,
      saharReminder: true,
      iftorReminder: true,
      reminderMinutes: 15
    };
  });
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tasbihCount, setTasbihCount] = useState(0);
  const [tasbihText, setTasbihText] = useState('Subhanallah');

  const tasbihOptions = ['Subhanallah', 'Alhamdulillah', 'Allahu Akbar', 'La ilaha illallah'];

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-detect current Ramazon day
  const currentRamazonDay = useMemo(() => {
    const now = currentTime;
    const year = now.getFullYear();
    
    // Find the day in calendar that matches current date
    const foundDay = KHOREZM_2026_CALENDAR.find(day => {
      const [d, mStr] = day.date.split('-');
      const month = mStr === 'Fevral' ? 1 : 2; // 0-indexed: 1 is Feb, 2 is March
      const dayDate = new Date(year, month, parseInt(d));
      return dayDate.toDateString() === now.toDateString();
    });

    return foundDay || KHOREZM_2026_CALENDAR[0]; // Default to Day 1 if not found
  }, [currentTime]);

  const adjustedCalendar = useMemo(() => {
    const adjustTime = (timeStr: string, minutes: number) => {
      const [h, m] = timeStr.split(':').map(Number);
      const date = new Date();
      date.setHours(h, m + minutes, 0);
      return date.toTimeString().slice(0, 5);
    };

    return KHOREZM_2026_CALENDAR.map(day => ({
      ...day,
      fajr: adjustTime(day.fajr, selectedDistrict.sahar),
      maghrib: adjustTime(day.maghrib, selectedDistrict.iftor)
    }));
  }, [selectedDistrict]);

  const todayData = useMemo(() => {
    const found = adjustedCalendar.find(d => d.day === currentRamazonDay.day);
    return found || adjustedCalendar[0];
  }, [adjustedCalendar, currentRamazonDay]);

  const statusInfo = useMemo(() => {
    const nowStr = currentTime.toTimeString().slice(0, 5);

    if (nowStr < todayData.fajr) {
      return { 
        label: 'Saharlikgacha', 
        targetTime: todayData.fajr, 
        color: 'from-indigo-600 via-blue-700 to-indigo-900',
        icon: <Sun className="animate-pulse" />
      };
    } else if (nowStr < todayData.maghrib) {
      return { 
        label: 'Iftorgacha', 
        targetTime: todayData.maghrib, 
        color: 'from-emerald-500 via-teal-600 to-emerald-800',
        icon: <Moon className="animate-pulse" />
      };
    } else {
      const tomorrowIdx = adjustedCalendar.findIndex(d => d.day === todayData.day) + 1;
      const tomorrow = adjustedCalendar[tomorrowIdx] || todayData;
      return { 
        label: 'Saharlikgacha (Ertaga)', 
        targetTime: tomorrow.fajr, 
        color: 'from-slate-800 via-gray-900 to-black',
        icon: <Sun className="opacity-50" />
      };
    }
  }, [currentTime, todayData, adjustedCalendar]);

  const timeLeft = useMemo(() => {
    const [h, m] = statusInfo.targetTime.split(':').map(Number);
    const target = new Date(currentTime);
    
    if (statusInfo.label.includes('Ertaga')) {
      target.setDate(target.getDate() + 1);
    }
    
    target.setHours(h, m, 0);
    
    const diff = target.getTime() - currentTime.getTime();
    if (diff <= 0) return "00:00:00";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [currentTime, statusInfo]);

  const fastProgress = useMemo(() => {
    if (statusInfo.label !== 'Iftorgacha') return 0;
    
    const [sh, sm] = todayData.fajr.split(':').map(Number);
    const [ih, im] = todayData.maghrib.split(':').map(Number);
    
    const start = new Date(currentTime);
    start.setHours(sh, sm, 0);
    
    const end = new Date(currentTime);
    end.setHours(ih, im, 0);
    
    const total = end.getTime() - start.getTime();
    const elapsed = currentTime.getTime() - start.getTime();
    
    return Math.min(Math.max((elapsed / total) * 100, 0), 100);
  }, [currentTime, todayData, statusInfo]);

  const handleShare = () => {
    const text = `🌙 Ramazon 2026 - ${selectedDistrict.name}\n📅 ${todayData.date}\n🌅 Saharlik: ${todayData.fajr}\n🌇 Iftorlik: ${todayData.maghrib}\n\nIlova orqali ko'proq ma'lumot oling!`;
    navigator.clipboard.writeText(text);
    alert('Ma\'lumot nusxalandi!');
  };

  // Persistence
  useEffect(() => {
    localStorage.setItem('selected_district', JSON.stringify(selectedDistrict));
  }, [selectedDistrict]);

  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotifications(prev => ({ ...prev, enabled: true }));
    }
  };

  // Notification Check Loop
  useEffect(() => {
    if (!notifications.enabled) return;

    const checkNotifications = () => {
      const now = new Date();
      const nowStr = now.toTimeString().slice(0, 5);
      
      // Check Sahar
      if (notifications.saharReminder) {
        const [h, m] = todayData.fajr.split(':').map(Number);
        const reminderTime = new Date(now);
        reminderTime.setHours(h, m - notifications.reminderMinutes, 0);
        
        if (now.getHours() === reminderTime.getHours() && now.getMinutes() === reminderTime.getMinutes() && now.getSeconds() === 0) {
          new Notification("Saharlik yaqinlashmoqda!", {
            body: `Saharlik vaqtiga ${notifications.reminderMinutes} daqiqa qoldi. Bugungi niyatni unutmang!`,
            icon: '/favicon.ico'
          });
        }
      }

      // Check Iftor
      if (notifications.iftorReminder) {
        const [h, m] = todayData.maghrib.split(':').map(Number);
        const reminderTime = new Date(now);
        reminderTime.setHours(h, m - notifications.reminderMinutes, 0);
        
        if (now.getHours() === reminderTime.getHours() && now.getMinutes() === reminderTime.getMinutes() && now.getSeconds() === 0) {
          new Notification("Iftorlik yaqinlashmoqda!", {
            body: `Iftorlik vaqtiga ${notifications.reminderMinutes} daqiqa qoldi. Alloh qabul qilsin!`,
            icon: '/favicon.ico'
          });
        }
      }
    };

    const interval = setInterval(checkNotifications, 1000);
    return () => clearInterval(interval);
  }, [notifications, todayData]);

  const handleStartApp = () => {
    // Add a small delay to simulate "bot starting"
    const btn = document.activeElement as HTMLButtonElement;
    if (btn) btn.disabled = true;
    
    setTimeout(() => {
      localStorage.setItem('app_started', 'true');
      setCurrentTab(AppState.TODAY);
    }, 300);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg: Message = { role: 'user', text: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    try {
      const response = await getGeminiChatResponse([...chatHistory, userMsg], chatInput);
      setChatHistory(prev => [...prev, { role: 'model', text: response }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'model', text: "Xatolik yuz berdi. Iltimos, qayta urinib ko'ring." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderContent = () => {
    switch (currentTab) {
      case AppState.WELCOME:
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center min-h-[600px] text-center px-6 space-y-12"
          >
            <div className="relative">
              <motion.div 
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 6, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="bg-emerald-600 w-32 h-32 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-emerald-200 relative z-10"
              >
                <Moon size={64} className="text-white fill-current" />
              </motion.div>
              <div className="absolute -inset-4 bg-emerald-100 rounded-[3rem] blur-2xl opacity-50 -z-0"></div>
            </div>

            <div className="space-y-4">
              <h2 className="text-4xl font-black text-gray-900 tracking-tight">Ramazon 2026</h2>
              <p className="text-gray-500 font-medium leading-relaxed max-w-xs mx-auto">
                Xorazm viloyati uchun maxsus tayyorlangan Ramazon taqvimi va yordamchi ilovasi.
              </p>
            </div>

            <div className="w-full space-y-4">
              <motion.button
                whileHover={{ scale: 1.02, backgroundColor: '#059669' }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartApp}
                className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 transition-colors"
              >
                <SendHorizontal size={24} className="rotate-[-45deg]" />
                BOSHLASH
              </motion.button>
              
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <div className="w-8 h-px bg-gray-200"></div>
                <span className="text-[10px] font-black uppercase tracking-widest">Botni ishga tushirish</span>
                <div className="w-8 h-px bg-gray-200"></div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 w-full pt-8">
              {[
                { icon: <Timer size={20} />, label: 'Taqvim', tab: AppState.MONTH },
                { icon: <Bell size={20} />, label: 'Eslatma', tab: AppState.REGION },
                { icon: <MessageSquare size={20} />, label: 'AI Bot', tab: AppState.CHAT }
              ].map((item, i) => (
                <motion.button 
                  key={i} 
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    localStorage.setItem('app_started', 'true');
                    setCurrentTab(item.tab);
                  }}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="w-14 h-14 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-emerald-600 group-hover:border-emerald-100 group-hover:bg-emerald-50 transition-all shadow-sm">
                    {item.icon}
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 group-hover:text-emerald-600">{item.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        );

      case AppState.REGION:
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                  <MapPin className="text-emerald-600" size={20} />
                  <h2 className="text-xl font-bold text-gray-800">Hududni tanlang</h2>
                </div>
                <button onClick={() => setCurrentTab(AppState.TODAY)} className="text-gray-400 hover:text-gray-600">
                  <Settings size={20} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {KHOREZM_DISTRICTS.map(district => (
                  <motion.button
                    key={district.name}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedDistrict(district);
                    }}
                    className={`p-5 rounded-[2rem] border text-left transition-all duration-300 ${
                      selectedDistrict.name === district.name
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-100'
                        : 'bg-white text-gray-700 border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30'
                    }`}
                  >
                    <div className="font-bold text-lg">{district.name}</div>
                    <div className={`text-[10px] mt-2 font-medium ${selectedDistrict.name === district.name ? 'text-emerald-100' : 'text-gray-400'}`}>
                      Sahar: {district.sahar >= 0 ? `+${district.sahar}` : district.sahar}m |
                      Iftor: {district.iftor >= 0 ? `+${district.iftor}` : district.iftor}m
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pb-24">
              <div className="flex items-center gap-2 px-2">
                <Bell className="text-emerald-600" size={20} />
                <h2 className="text-xl font-bold text-gray-800">Eslatmalar</h2>
              </div>
              
              <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-gray-800">Bildirishnomalar</h3>
                    <p className="text-xs text-gray-400">Har kuni vaqtida eslatib turish</p>
                  </div>
                  <button 
                    onClick={() => {
                      if (!notifications.enabled) requestNotificationPermission();
                      else setNotifications(prev => ({ ...prev, enabled: false }));
                    }}
                    className={`w-14 h-8 rounded-full transition-all relative ${notifications.enabled ? 'bg-emerald-600' : 'bg-gray-200'}`}
                  >
                    <motion.div 
                      animate={{ x: notifications.enabled ? 24 : 4 }}
                      className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm"
                    />
                  </button>
                </div>

                {notifications.enabled && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pt-4 border-t border-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-600">Saharlik eslatmasi</span>
                      <button 
                        onClick={() => setNotifications(prev => ({ ...prev, saharReminder: !prev.saharReminder }))}
                        className={`p-2 rounded-xl ${notifications.saharReminder ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-50 text-gray-300'}`}
                      >
                        {notifications.saharReminder ? <Bell size={18} /> : <BellOff size={18} />}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-600">Iftorlik eslatmasi</span>
                      <button 
                        onClick={() => setNotifications(prev => ({ ...prev, iftorReminder: !prev.iftorReminder }))}
                        className={`p-2 rounded-xl ${notifications.iftorReminder ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-50 text-gray-300'}`}
                      >
                        {notifications.iftorReminder ? <Bell size={18} /> : <BellOff size={18} />}
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <span>Vaqtdan oldin eslatish</span>
                        <span>{notifications.reminderMinutes} daqiqa</span>
                      </div>
                      <input 
                        type="range" 
                        min="5" 
                        max="60" 
                        step="5"
                        value={notifications.reminderMinutes}
                        onChange={(e) => setNotifications(prev => ({ ...prev, reminderMinutes: parseInt(e.target.value) }))}
                        className="w-full accent-emerald-600"
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        );

      case AppState.TODAY:
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Main Card */}
            <div className={`bg-gradient-to-br ${statusInfo.color} p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden transition-all duration-1000`}>
              {/* Decorative elements */}
              <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 bg-black/10 rounded-full blur-2xl"></div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin size={14} className="text-emerald-200" />
                      <span className="text-xs font-bold uppercase tracking-widest text-emerald-100/80">{selectedDistrict.name}</span>
                    </div>
                    <h2 className="text-4xl font-black tracking-tight">{todayData.date}</h2>
                    <p className="text-emerald-100/60 text-sm font-medium mt-1">Ramazonning {todayData.day}-kuni • 1447 h.</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="bg-white/10 backdrop-blur-xl p-4 rounded-[1.5rem] border border-white/20 shadow-xl">
                      <div className="text-center">
                        <div className="text-[10px] font-black uppercase tracking-tighter text-emerald-100/70 mb-1">Hozir</div>
                        <div className="text-xl font-black tabular-nums">{currentTime.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                    <motion.button 
                      whileTap={{ scale: 0.9 }}
                      onClick={handleShare}
                      className="bg-white/10 backdrop-blur-xl p-3 rounded-xl border border-white/20 text-white flex items-center justify-center"
                    >
                      <Send size={16} className="rotate-[-45deg]" />
                    </motion.button>
                  </div>
                </div>

                {/* Countdown */}
                <div className="mb-10 text-center py-6 bg-white/5 backdrop-blur-sm rounded-[2.5rem] border border-white/10">
                  <div className="flex items-center justify-center gap-2 mb-2 text-emerald-100/80">
                    {statusInfo.icon}
                    <span className="text-xs font-black uppercase tracking-[0.2em]">{statusInfo.label}</span>
                  </div>
                  <div className="text-6xl font-black tracking-tighter tabular-nums drop-shadow-lg mb-4">
                    {timeLeft}
                  </div>
                  
                  {/* Progress Bar */}
                  {statusInfo.label === 'Iftorgacha' && (
                    <div className="px-8">
                      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${fastProgress}%` }}
                          className="h-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                        />
                      </div>
                      <div className="flex justify-between mt-2 text-[9px] font-black uppercase tracking-widest text-emerald-100/50">
                        <span>Saharlik</span>
                        <span>{Math.round(fastProgress)}%</span>
                        <span>Iftorlik</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-md p-6 rounded-[2rem] border border-white/20 shadow-inner group hover:bg-white/20 transition-all">
                    <div className="flex items-center gap-2 mb-3 text-emerald-100">
                      <Sun size={18} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Saharlik</span>
                    </div>
                    <div className="text-4xl font-black tracking-tight tabular-nums">{todayData.fajr}</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-6 rounded-[2rem] border border-white/20 shadow-inner group hover:bg-white/20 transition-all">
                    <div className="flex items-center gap-2 mb-3 text-emerald-100">
                      <Moon size={18} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Iftorlik</span>
                    </div>
                    <div className="text-4xl font-black tracking-tight tabular-nums">{todayData.maghrib}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 gap-4">
              <motion.div 
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center justify-between group cursor-pointer" 
                onClick={() => setCurrentTab(AppState.DUA)}
              >
                <div className="flex items-center gap-5">
                  <div className="bg-emerald-100 p-4 rounded-2xl text-emerald-600 shadow-inner">
                    <BookOpen size={28} />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-800 text-lg">Bugungi duolar</h3>
                    <p className="text-xs text-gray-400 font-medium">Sahar va iftorlik niyatlari</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-2 rounded-full text-gray-300 group-hover:text-emerald-500 group-hover:bg-emerald-50 transition-all">
                  <ChevronRight size={20} />
                </div>
              </motion.div>

              <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100/50 flex gap-4 items-start">
                <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
                  <Info size={18} />
                </div>
                <p className="text-xs text-emerald-800/80 leading-relaxed font-semibold">
                  Eslatma: Taqvim vaqtlari O'zbekiston Musulmonlari idorasi tomonidan belgilangan vaqtlarga asoslangan.
                </p>
              </div>
            </div>
          </motion.div>
        );

      case AppState.MONTH:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-emerald-600 p-5 text-white relative overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="relative z-10 flex justify-between items-end">
                  <div>
                    <h2 className="text-lg font-black tracking-tight">Ramazon Taqvimi</h2>
                    <p className="text-emerald-100 text-[8px] font-black opacity-80 uppercase tracking-[0.2em]">{selectedDistrict.name} vaqti</p>
                  </div>
                  <div className="text-[10px] font-black bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">
                    2026 / 1447 h.
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto max-h-[calc(100vh-260px)] overflow-y-auto no-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-100 z-10">
                    <tr className="text-gray-400 text-[7px] font-black uppercase tracking-[0.2em]">
                      <th className="pl-5 pr-1 py-3">Kun</th>
                      <th className="px-1 py-3">Sana</th>
                      <th className="px-1 py-3 text-center">Sahar</th>
                      <th className="pl-1 pr-5 py-3 text-center">Iftor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {adjustedCalendar.map((day, idx) => {
                      const isToday = day.day === currentRamazonDay.day;
                      return (
                        <tr 
                          key={idx} 
                          className={`group transition-all duration-150 ${isToday ? 'bg-emerald-50/80' : 'hover:bg-gray-50/30'}`}
                        >
                          <td className={`pl-5 pr-1 py-2.5 font-black text-[10px] ${isToday ? 'text-emerald-700' : 'text-gray-300'}`}>
                            {String(day.day).padStart(2, '0')}
                          </td>
                          <td className={`px-1 py-2.5 font-bold text-[10px] ${isToday ? 'text-emerald-900' : 'text-gray-600'}`}>
                            {day.date}
                          </td>
                          <td className="px-1 py-2.5 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded font-black text-[11px] tabular-nums ${isToday ? 'bg-emerald-100 text-emerald-900' : 'text-gray-700'}`}>
                              {day.fajr}
                            </span>
                          </td>
                          <td className="pl-1 pr-5 py-2.5 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded font-black text-[11px] tabular-nums ${isToday ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-600'}`}>
                              {day.maghrib}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        );

      case AppState.DUA:
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8 pb-32"
          >
            {[DUAS.sahar, DUAS.iftar].map((dua, i) => (
              <div key={i} className="relative">
                {/* Decorative background number */}
                <div className="absolute -top-10 -left-4 text-[12rem] font-black text-gray-50 select-none -z-0 leading-none opacity-50">
                  0{i + 1}
                </div>
                
                <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-gray-100 relative overflow-hidden group z-10">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50 rounded-bl-[8rem] -z-0 opacity-40 group-hover:scale-110 transition-transform duration-1000"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                        {i === 0 ? <Sun size={24} /> : <Moon size={24} />}
                      </div>
                      <h3 className="font-black text-gray-900 text-2xl tracking-tight leading-tight">{dua.title}</h3>
                    </div>

                    <div className="space-y-10">
                      <div className="relative">
                        <div className="absolute -left-6 top-0 bottom-0 w-1 bg-emerald-500 rounded-full opacity-30"></div>
                        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 mb-4 px-2">O'qilishi</div>
                        <p className="text-xl text-gray-800 font-bold italic leading-relaxed px-2">
                          "{dua.transliteration}"
                        </p>
                      </div>

                      <div className="pt-8 border-t border-gray-50">
                        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4">Ma'nosi</div>
                        <p className="text-sm text-gray-500 font-medium leading-relaxed">
                          {dua.translation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="bg-indigo-900 p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <div className="relative z-10 flex items-start gap-5">
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                  <Info size={24} />
                </div>
                <div>
                  <h4 className="font-black text-lg mb-2">Eslatma</h4>
                  <p className="text-xs text-indigo-100/80 leading-relaxed font-medium">
                    Duolarni chin dildan, ixlos bilan o'qish ijobat bo'lishining asosiy shartlaridan biridir. Alloh tutgan ro'zalaringizni qabul qilsin.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case AppState.TASBIH:
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center justify-center py-10 space-y-10"
          >
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-gray-800 tracking-tight">Raqamli Tasbeh</h2>
              <p className="text-sm text-gray-400 font-medium">Zikr qiling va savobingizni ko'paytiring</p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 px-4">
              {tasbihOptions.map(opt => (
                <button 
                  key={opt}
                  onClick={() => setTasbihText(opt)}
                  className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                    tasbihText === opt ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-white text-gray-400 border border-gray-100'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-emerald-100 rounded-full blur-3xl opacity-30 animate-pulse"></div>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setTasbihCount(prev => prev + 1)}
                className="relative w-64 h-64 bg-white rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-8 border-emerald-50 flex flex-col items-center justify-center group"
              >
                <div className="text-6xl font-black text-emerald-600 tabular-nums mb-2">{tasbihCount}</div>
                <div className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] group-hover:text-emerald-400 transition-colors">Bosing</div>
              </motion.button>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setTasbihCount(0)}
                className="flex items-center gap-2 px-6 py-3 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all"
              >
                <Settings size={14} />
                Nolga tushirish
              </button>
            </div>

            <div className="p-8 bg-emerald-50 rounded-[2.5rem] w-full text-center">
              <div className="text-emerald-900 font-black text-xl mb-2 tracking-tight">"{tasbihText}"</div>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest opacity-60">Tanlangan zikr</p>
            </div>
          </motion.div>
        );

      case AppState.CHAT:
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col h-[calc(100vh-220px)]"
          >
            <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar scroll-smooth">
              {chatHistory.length === 0 && (
                <div className="text-center py-20 px-10">
                  <div className="relative inline-block mb-8">
                    <div className="bg-emerald-100 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
                      <MessageSquare size={48} className="text-emerald-600" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow-lg">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-gray-800 mb-3 tracking-tight">AI Ramazon Yordamchi</h3>
                  <p className="text-sm text-gray-400 leading-relaxed font-medium">
                    Ro'za qoidalari, duolar yoki ma'naviy savollaringiz bo'lsa, bemalol so'rang. Men sizga yordam berishdan mamnunman.
                  </p>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-5 rounded-[2rem] shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-none shadow-emerald-100'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                  }`}>
                    <p className="text-sm leading-relaxed font-bold">{msg.text}</p>
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 p-5 rounded-[2rem] rounded-tl-none flex gap-1.5">
                    <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-2 h-2 bg-emerald-400 rounded-full"></motion.div>
                    <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="w-2 h-2 bg-emerald-400 rounded-full"></motion.div>
                    <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} className="w-2 h-2 bg-emerald-400 rounded-full"></motion.div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-5 bg-white/80 backdrop-blur-xl border-t border-gray-50 flex gap-3 pb-24">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Savol bering..."
                className="flex-1 px-8 py-5 bg-gray-50 border-none rounded-[2rem] focus:ring-2 focus:ring-emerald-500 transition-all text-sm font-bold shadow-inner"
              />
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || isTyping}
                className="p-5 bg-emerald-600 text-white rounded-[2rem] hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 disabled:opacity-50"
              >
                <Send size={24} />
              </motion.button>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-0 sm:p-4 md:p-8 font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-hidden">
      {/* Background Atmosphere for Desktop */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden hidden lg:block">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-200/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-200/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-lg h-full sm:h-[850px] bg-[#FDFDFD] flex flex-col shadow-[0_30px_100px_rgba(0,0,0,0.15)] relative sm:rounded-[3.5rem] overflow-hidden border border-white/50 backdrop-blur-sm">
        {/* Header */}
        {currentTab !== AppState.WELCOME && (
          <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-gray-50 px-8 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div 
                whileHover={{ rotate: 15 }}
                className="bg-emerald-600 w-12 h-12 rounded-[1.25rem] flex items-center justify-center shadow-xl shadow-emerald-100"
              >
                <Moon size={24} className="text-white fill-current" />
              </motion.div>
              <div>
                <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none">RAMAZON 2026</h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] text-emerald-600 font-black uppercase tracking-[0.2em]">Xorazm Viloyati</span>
                </div>
              </div>
            </div>
            <motion.button 
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentTab(AppState.REGION)}
              className="flex items-center gap-2 text-[11px] font-black text-emerald-800 bg-emerald-50 px-5 py-2.5 rounded-2xl border border-emerald-100/50 hover:bg-emerald-100 transition-all shadow-sm"
            >
              <MapPin size={14} className="text-emerald-600" />
              {selectedDistrict.name.toUpperCase()}
            </motion.button>
          </header>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto no-scrollbar pb-32">
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </main>

        {/* Navigation */}
        {currentTab !== AppState.WELCOME && (
          <nav className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[92%] bg-white/90 backdrop-blur-3xl border border-gray-100/50 p-2 flex justify-around shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2.5rem] z-50">
            <NavButton active={currentTab === AppState.TODAY} onClick={() => setCurrentTab(AppState.TODAY)} icon={<Timer size={20} />} label="Bugun" />
            <NavButton active={currentTab === AppState.MONTH} onClick={() => setCurrentTab(AppState.MONTH)} icon={<Calendar size={20} />} label="Taqvim" />
            <NavButton active={currentTab === AppState.TASBIH} onClick={() => setCurrentTab(AppState.TASBIH)} icon={<Settings size={20} />} label="Tasbeh" />
            <NavButton active={currentTab === AppState.DUA} onClick={() => setCurrentTab(AppState.DUA)} icon={<BookOpen size={20} />} label="Duolar" />
            <NavButton active={currentTab === AppState.CHAT} onClick={() => setCurrentTab(AppState.CHAT)} icon={<MessageSquare size={20} />} label="AI" />
          </nav>
        )}
      </div>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex-1 flex flex-col items-center py-4 gap-1.5 transition-all duration-500 rounded-[1.75rem] ${active ? 'text-emerald-700 bg-emerald-50/80 shadow-inner' : 'text-gray-400 hover:text-gray-600'}`}
  >
    <motion.div animate={active ? { scale: 1.1, y: -2 } : { scale: 1, y: 0 }}>
      {icon}
    </motion.div>
    <span className={`text-[9px] font-black uppercase tracking-widest ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
  </button>
);

export default App;
