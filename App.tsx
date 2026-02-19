import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Info,
  Sparkles
} from 'lucide-react';

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<AppState>(AppState.TODAY);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictOffset>(KHOREZM_DISTRICTS[0]);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isTyping]);

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
    const todayData = adjustedCalendar[todayIndex] || adjustedCalendar[0];
    const nowStr = currentTime.toTimeString().slice(0, 5);
    
    if (nowStr < todayData.fajr) {
      return { label: 'Saharlikgacha', time: todayData.fajr, color: 'from-blue-600 to-indigo-800', icon: <Sun className="animate-pulse" /> };
    } else if (nowStr < todayData.maghrib) {
      return { label: 'Iftorgacha', time: todayData.maghrib, color: 'from-emerald-600 to-teal-800', icon: <Moon className="animate-bounce" /> };
    } else {
      const nextDay = adjustedCalendar[todayIndex + 1] || adjustedCalendar[0];
      return { label: 'Saharlikgacha (Ertaga)', time: nextDay.fajr, color: 'from-indigo-900 to-black', icon: <Sun className="opacity-50" /> };
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
      setChatHistory(prev => [...prev, { role: 'model', text: "Kechirasiz, aloqada uzilish bo'ldi. Iltimos, qaytadan yozib ko'ring." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderContent = () => {
    switch (currentTab) {
      case AppState.REGION :
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
            <div className="flex items-center gap-3 px-2">
              <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
                <MapPin size={24} />
              </div>
              <h2 className="text-2xl font-black text-gray-800">Hududni tanlang</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {KHOREZM_DISTRICTS.map(district => (
                <button
                  key={district.name}
                  onClick={() => { setSelectedDistrict(district); setCurrentTab(AppState.TODAY); }}
                  className={`p-5 rounded-[1.8rem] border-2 text-left transition-all relative overflow-hidden group active:scale-95 ${
                    selectedDistrict.name === district.name 
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-100' 
                      : 'bg-white text-gray-700 border-gray-50 hover:border-emerald-200'
                  }`}
                >
                  <div className="font-bold text-lg mb-1">{district.name}</div>
                  <div className={`text-[10px] font-medium uppercase tracking-wider ${selectedDistrict.name === district.name ? 'text-emerald-100' : 'text-gray-400'}`}>
                    Vaqt farqi: {district.sahar >= 0 ? `+${district.sahar}` : district.sahar} m
                  </div>
                  {selectedDistrict.name === district.name && (
                    <div className="absolute top-2 right-3">
                      <Sparkles size={14} className="text-emerald-200" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        );

      case AppState.TODAY:
        const todayData = adjustedCalendar[todayIndex] || adjustedCalendar[0];
        return (
          <div className="space-y-6 animate-in fade-in duration-700">
            <div className={`bg-gradient-to-br ${statusInfo.color} p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden`}>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h2 className="text-4xl font-black tracking-tight mb-2">{selectedDistrict.name}</h2>
                    <div className="flex items-center gap-2 text-emerald-100/80 font-semibold text-sm">
                      <Calendar size={16} />
                      <span>{todayData.date}, 2026 • {todayData.day}-kun</span>
                    </div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-xl p-4 rounded-[2rem] border border-white/20">
                    {statusInfo.icon}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white/10 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/20 shadow-inner group">
                    <Sun size={20} className="mb-2 text-orange-300" />
                    <span className="text-[10px] uppercase font-black tracking-widest block mb-1 opacity-70">Saharlik</span>
                    <span className="text-4xl font-black tracking-tighter">{todayData.fajr}</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/20 shadow-inner">
                    <Moon size={20} className="mb-2 text-emerald-200" />
                    <span className="text-[10px] uppercase font-black tracking-widest block mb-1 opacity-70">Iftorlik</span>
                    <span className="text-4xl font-black tracking-tighter">{todayData.maghrib}</span>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-emerald-200" />
                    <span className="text-xs font-bold uppercase tracking-widest opacity-80">{statusInfo.label}</span>
                  </div>
                  <span className="text-2xl font-black bg-white text-emerald-900 px-5 py-1 rounded-full shadow-lg">{statusInfo.time}</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
               <button 
                 onClick={() => setCurrentTab(AppState.DUA)}
                 className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 flex items-center justify-between group active:scale-95 transition-all"
               >
                 <div className="flex items-center gap-5">
                   <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                     <BookOpen size={24} />
                   </div>
                   <div className="text-left">
                     <h3 className="font-black text-gray-800 text-lg">Bugungi duolar</h3>
                     <p className="text-xs text-gray-400 font-medium">Og'iz yopish va ochish duolari</p>
                   </div>
                 </div>
                 <ChevronRight size={24} className="text-gray-200 group-hover:text-emerald-500 transition-colors" />
               </button>

               <div className="bg-blue-50/50 p-5 rounded-[2rem] flex items-start gap-4 border border-blue-100">
                  <Info size={20} className="text-blue-500 mt-1 shrink-0" />
                  <p className="text-xs text-blue-700 leading-relaxed font-medium">
                    <b>Eslatma:</b> Vaqtlar O'zbekiston Musulmonlari idorasi ma'lumotlari asosida tayyorlandi. Tumanlardagi vaqt farqlari hisobga olingan.
                  </p>
               </div>
            </div>
          </div>
        );

      case AppState.MONTH:
        return (
          <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-50 animate-in fade-in duration-500">
            <div className="bg-emerald-600 p-8 text-white relative">
              <div className="absolute top-4 right-6 opacity-20"><Calendar size={60} /></div>
              <h2 className="text-2xl font-black mb-1">30 kunlik taqvim</h2>
              <p className="text-sm font-medium text-emerald-100">Xorazm • {selectedDistrict.name} vaqti bilan</p>
            </div>
            <div className="overflow-x-auto max-h-[calc(100vh-320px)] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white/95 backdrop-blur-md shadow-sm z-20">
                  <tr className="text-gray-400 text-[10px] uppercase font-black tracking-widest border-b border-gray-50">
                    <th className="px-6 py-4 text-left">Kun</th>
                    <th className="px-6 py-4 text-left">Sana</th>
                    <th className="px-6 py-4 text-center">Sahar</th>
                    <th className="px-6 py-4 text-center">Iftor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {adjustedCalendar.map((day, idx) => (
                    <tr key={idx} className={`${idx === todayIndex ? 'bg-emerald-50/70' : 'hover:bg-gray-50/50'} transition-colors`}>
                      <td className="px-6 py-5 font-black text-emerald-700">{day.day}</td>
                      <td className="px-6 py-5 text-gray-500 font-bold">{day.date}</td>
                      <td className="px-6 py-5 text-center font-black text-gray-800">{day.fajr}</td>
                      <td className="px-6 py-5 text-center font-black text-emerald-600">{day.maghrib}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case AppState.DUA:
        return (
          <div className="space-y-6 pb-28 animate-in fade-in slide-in-from-bottom-6 duration-500">
            {[DUAS.sahar, DUAS.iftar].map((dua, i) => (
              <div key={i} className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-50 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500 opacity-20 group-hover:opacity-100 transition-opacity"></div>
                <h3 className="font-black text-emerald-700 text-xl mb-6 flex items-center gap-2">
                   <BookOpen size={20} /> {dua.title}
                </h3>
                <div className="arabic text-3xl text-right text-gray-900 mb-8 leading-[1.8] font-bold tracking-wide">
                  {dua.arabic}
                </div>
                <div className="space-y-5">
                  <div className="p-5 bg-emerald-50/50 rounded-[1.5rem] border-l-4 border-emerald-500">
                    <p className="text-sm text-emerald-900 font-bold italic leading-relaxed">
                      "{dua.transliteration}"
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 font-semibold leading-relaxed px-2">
                    <span className="text-emerald-600 uppercase font-black block mb-1 text-[10px]">Ma'nosi:</span>
                    {dua.translation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        );

      case AppState.CHAT:
        return (
          <div className="flex flex-col h-[calc(100vh-230px)] animate-in fade-in duration-500">
            <div className="flex-1 overflow-y-auto p-4 space-y-5 scroll-smooth custom-scrollbar">
              {chatHistory.length === 0 && (
                <div className="text-center py-20">
                  <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-50">
                    <Sparkles size={40} className="text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-black text-gray-800 mb-2">Ramazon AI Yordamchi</h3>
                  <p className="text-sm text-gray-400 px-10 leading-relaxed font-medium">
                    Ro'za qoidalari, amallar va ma'naviy maslahatlar bo'yicha savollaringizni yozing.
                  </p>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in zoom-in-95 duration-300`}>
                  <div className={`max-w-[85%] p-5 rounded-[2rem] shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-emerald-600 text-white rounded-tr-none' 
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none font-medium'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-5 rounded-[2rem] rounded-tl-none flex gap-1.5 items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="p-4 bg-white border-t border-gray-50 flex gap-3 pb-24">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Savol yozing..."
                className="flex-1 bg-gray-50 px-6 py-4 rounded-[1.5rem] outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm font-bold placeholder:text-gray-300"
              />
              <button 
                onClick={handleSendMessage} 
                disabled={!chatInput.trim() || isTyping} 
                className="p-4 bg-emerald-600 text-white rounded-[1.5rem] shadow-lg shadow-emerald-100 active:scale-90 disabled:opacity-50 transition-all"
              >
                <Send size={22} />
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen max-w-lg mx-auto bg-[#FDFDFD] flex flex-col shadow-2xl border-x border-gray-50 relative">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl px-6 py-5 flex items-center justify-between border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 w-12 h-12 rounded-[1.2rem] flex items-center justify-center shadow-lg shadow-emerald-100 rotate-3">
            <Moon size={24} className="text-white fill-current" />
          </div>
          <div>
            <h1 className="text-lg font-black leading-none tracking-tight">RAMAZON 2026</h1>
            <span className="text-[10px] text-emerald-600 uppercase font-black tracking-widest">Xorazm Viloyati</span>
          </div>
        </div>
        <button 
          onClick={() => setCurrentTab(AppState.REGION)} 
          className="text-[11px] font-black bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl flex items-center gap-2 border border-emerald-100 hover:bg-emerald-100 transition-colors"
        >
          <MapPin size={14} /> {selectedDistrict.name.toUpperCase()}
        </button>
      </header>

      <main className="flex-1 p-5 overflow-y-auto">
        {renderContent()}
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white/95 backdrop-blur-xl border-t border-gray-50 p-3 flex justify-around items-center z-50 rounded-t-[2.5rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
        <NavBtn active={currentTab === AppState.TODAY} onClick={() => setCurrentTab(AppState.TODAY)} icon={<Clock size={22}/>} label="Bugun" />
        <NavBtn active={currentTab === AppState.MONTH} onClick={() => setCurrentTab(AppState.MONTH)} icon={<Calendar size={22}/>} label="Taqvim" />
        <NavBtn active={currentTab === AppState.DUA} onClick={() => setCurrentTab(AppState.DUA)} icon={<BookOpen size={22}/>} label="Duolar" />
        <NavBtn active={currentTab === AppState.CHAT} onClick={() => setCurrentTab(AppState.CHAT)} icon={<MessageSquare size={22}/>} label="AI Yordam" />
      </nav>
    </div>
  );
};

const NavBtn = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick} 
    className={`flex flex-col items-center py-3 px-5 rounded-[1.5rem] transition-all duration-300 ${active ? 'text-emerald-600 bg-emerald-50 shadow-inner' : 'text-gray-400 hover:text-gray-600'}`}
  >
    <div className={`transition-transform duration-300 ${active ? 'scale-110 -translate-y-1' : ''}`}>
      {icon}
    </div>
    <span className={`text-[9px] font-black mt-1 uppercase tracking-tighter ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
  </button>
);

export default App;
