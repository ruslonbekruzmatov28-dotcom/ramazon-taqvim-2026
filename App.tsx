import React, { useState, useEffect, useMemo } from 'react';
import { KHOREZM_2026_CALENDAR, KHOREZM_DISTRICTS, DUAS, DistrictOffset } from './constants';
import { AppState, Message } from './types';
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
  AlertCircle
} from 'lucide-react';

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<AppState>(AppState.TODAY);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictOffset>(KHOREZM_DISTRICTS[0]);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  const todayIndex = useMemo(() => {
    const months: Record<string, number> = { 'Фев': 1, 'Мар': 2 };
    const idx = adjustedCalendar.findIndex(item => {
      const [d, m] = item.date.split('-');
      return parseInt(d) === currentTime.getDate() && months[m] === currentTime.getMonth() + 1;
    });
    return idx === -1 ? 0 : idx;
  }, [currentTime, adjustedCalendar]);

  const statusInfo = useMemo(() => {
    const todayData = adjustedCalendar[todayIndex];
    const nowStr = currentTime.toTimeString().slice(0, 5);
    
    if (nowStr < todayData.fajr) {
      return { label: 'Saharlikgacha', time: todayData.fajr, color: 'from-blue-600 to-indigo-800' };
    } else if (nowStr < todayData.maghrib) {
      return { label: 'Iftorgacha', time: todayData.maghrib, color: 'from-emerald-600 to-teal-800' };
    } else {
      const nextDay = adjustedCalendar[todayIndex + 1] || adjustedCalendar[0];
      return { label: 'Saharlikgacha (Ertaga)', time: nextDay.fajr, color: 'from-indigo-900 to-slate-900' };
    }
  }, [currentTime, adjustedCalendar, todayIndex]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isTyping) return;
    
    const userMsg: Message = { role: 'user', text: chatInput };
    const updatedHistory = [...chatHistory, userMsg];
    
    setChatHistory(updatedHistory);
    setChatInput('');
    setIsTyping(true);
    
    try {
      const response = await getGeminiChatResponse(updatedHistory);
      setChatHistory(prev => [...prev, { role: 'model', text: response }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'model', text: "Aloqada xatolik yuz berdi. Iltimos, birozdan so'ng qayta urinib ko'ring." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderContent = () => {
    switch (currentTab) {
      case AppState.REGION:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-2 px-2">
              <MapPin className="text-emerald-600" size={20} />
              <h2 className="text-xl font-bold text-gray-800">Hududni tanlang</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 pb-24">
              {KHOREZM_DISTRICTS.map(district => (
                <button
                  key={district.name}
                  onClick={() => {
                    setSelectedDistrict(district);
                    setCurrentTab(AppState.TODAY);
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all duration-300 ${
                    selectedDistrict.name === district.name 
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg scale-[1.02]' 
                      : 'bg-white text-gray-700 border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/50'
                  }`}
                >
                  <div className="font-bold">{district.name}</div>
                  <div className={`text-[10px] mt-1 ${selectedDistrict.name === district.name ? 'text-emerald-100' : 'text-gray-400'}`}>
                    Sahar: {district.sahar >= 0 ? `+${district.sahar}` : district.sahar}m | 
                    Iftor: {district.iftor >= 0 ? `+${district.iftor}` : district.iftor}m
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case AppState.TODAY:
        const todayData = adjustedCalendar[todayIndex]; 
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className={`bg-gradient-to-br ${statusInfo.color} p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden transition-all duration-700`}>
              <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-3xl font-black">{selectedDistrict.name}</h2>
                    <p className="text-emerald-100/80 font-medium">{todayData.date}, 2026 • {todayData.day}-кун</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl">
                    <Moon size={24} />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/20 shadow-inner">
                    <div className="flex items-center gap-2 mb-2 text-emerald-100">
                      <Sun size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">Saharlik</span>
                    </div>
                    <div className="text-4xl font-black tracking-tight">{todayData.fajr}</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/20 shadow-inner">
                    <div className="flex items-center gap-2 mb-2 text-emerald-100">
                      <Moon size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">Iftorlik</span>
                    </div>
                    <div className="text-4xl font-black tracking-tight">{todayData.maghrib}</div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
                  <span className="text-sm font-medium text-emerald-100/70">{statusInfo.label}:</span>
                  <span className="text-xl font-bold bg-white/20 px-4 py-1 rounded-full">{statusInfo.time}</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
               <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between group active:scale-95 transition-transform cursor-pointer" onClick={() => setCurrentTab(AppState.DUA)}>
                 <div className="flex items-center gap-4">
                   <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600">
                     <BookOpen size={24} />
                   </div>
                   <div>
                     <h3 className="font-bold text-gray-800">Duolarni o'qish</h3>
                     <p className="text-xs text-gray-500">Sahar va iftorlik duolari</p>
                   </div>
                 </div>
                 <ChevronRight size={20} className="text-gray-300 group-hover:text-emerald-500 transition-colors" />
               </div>
            </div>
          </div>
        );

      case AppState.MONTH:
        return (
          <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="bg-emerald-600 p-6 text-white">
              <h2 className="text-xl font-bold">To'liq taqvim — 2026</h2>
              <p className="text-emerald-100 text-xs opacity-80">{selectedDistrict.name} vaqti bilan</p>
            </div>
            <div className="overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="sticky top-0 bg-white border-b border-gray-100 z-10">
                  <tr className="text-gray-400 text-[10px] font-black uppercase tracking-widest">
                    <th className="px-6 py-4">Ramazon</th>
                    <th className="px-6 py-4">Sana</th>
                    <th className="px-6 py-4 text-center">Sahar</th>
                    <th className="px-6 py-4 text-center">Iftor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {adjustedCalendar.map((day, idx) => (
                    <tr key={idx} className={`${idx === todayIndex ? 'bg-emerald-50/50' : 'hover:bg-gray-50/50'} transition-colors`}>
                      <td className="px-6 py-4 font-bold text-emerald-700">{day.day}</td>
                      <td className="px-6 py-4 text-gray-500 font-medium">{day.date}</td>
                      <td className="px-6 py-4 text-center font-black text-gray-800">{day.fajr}</td>
                      <td className="px-6 py-4 text-center font-black text-emerald-600">{day.maghrib}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case AppState.DUA:
        return (
          <div className="space-y-4 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {[DUAS.sahar, DUAS.iftar].map((dua, i) => (
              <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-[5rem] -z-0 opacity-50 group-hover:scale-110 transition-transform"></div>
                <div className="relative z-10">
                  <h3 className="font-black text-gray-800 text-xl mb-4">{dua.title}</h3>
                  <div className="arabic text-3xl text-right text-emerald-900 mb-8 leading-[1.8] tracking-wide font-bold">
                    {dua.arabic}
                  </div>
                  <div className="space-y-4">
                    <div className="p-5 bg-emerald-50/50 rounded-2xl border-l-4 border-emerald-500">
                      <p className="text-sm text-emerald-800 font-medium italic leading-relaxed">
                        "{dua.transliteration}"
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 font-medium leading-relaxed px-2">
                      {dua.translation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case AppState.CHAT:
        return (
          <div className="flex flex-col h-[calc(100vh-200px)] animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
              {chatHistory.length === 0 && (
                <div className="text-center py-20 px-10">
                  <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MessageSquare size={40} className="text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">AI Yordamchi</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Ro'za qoidalari, duolar yoki ma'naviy savollaringiz bo'lsa, bemalol so'rang.
                  </p>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in zoom-in-95 duration-300`}>
                  <div className={`max-w-[85%] p-4 rounded-3xl shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-emerald-600 text-white rounded-tr-none' 
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                  }`}>
                    <p className="text-sm leading-relaxed font-medium whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start animate-pulse">
                  <div className="bg-gray-100 p-4 rounded-3xl rounded-tl-none flex gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 flex gap-3 pb-24">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Savol bering..."
                className="flex-1 px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all text-sm font-medium outline-none"
              />
              <button 
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || isTyping}
                className="p-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all shadow-lg active:scale-90 disabled:opacity-50"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen max-w-lg mx-auto bg-[#FDFDFD] flex flex-col shadow-2xl relative">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-50 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100">
            <Moon size={20} className="text-white fill-current" />
          </div>
          <div>
            <h1 className="text-lg font-black text-gray-900 tracking-tight">RAMAZON 2026</h1>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold uppercase tracking-widest">
              Xorazm Viloyati
            </div>
          </div>
        </div>
        <button 
          onClick={() => setCurrentTab(AppState.REGION)}
          className="flex items-center gap-2 text-[11px] font-black text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100/50 hover:bg-emerald-100 transition-all active:scale-95"
        >
          <MapPin size={14} />
          {selectedDistrict.name.toUpperCase()}
        </button>
      </header>

      <main className="flex-1 p-5 overflow-y-auto">
        {renderContent()}
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] bg-white/90 backdrop-blur-2xl border border-gray-100 p-2 flex justify-around shadow-2xl rounded-[2rem] z-50">
        <NavButton active={currentTab === AppState.TODAY} onClick={() => setCurrentTab(AppState.TODAY)} icon={<Clock size={20} />} label="Bugun" />
        <NavButton active={currentTab === AppState.MONTH} onClick={() => setCurrentTab(AppState.MONTH)} icon={<Calendar size={20} />} label="Taqvim" />
        <NavButton active={currentTab === AppState.DUA} onClick={() => setCurrentTab(AppState.DUA)} icon={<BookOpen size={20} />} label="Duolar" />
        <NavButton active={currentTab === AppState.CHAT} onClick={() => setCurrentTab(AppState.CHAT)} icon={<MessageSquare size={20} />} label="AI Yordam" />
      </nav>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex-1 flex flex-col items-center py-3 gap-1 transition-all duration-300 rounded-2xl ${active ? 'text-emerald-600 bg-emerald-50' : 'text-gray-400'}`}
  >
    {icon}
    <span className="text-[9px] font-black uppercase tracking-tighter">{label}</span>
  </button>
);

export default App;
