import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, Phone, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function SupportChatModal() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMsg, setInputMsg] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: `Hello ${user?.name ? user.name.split(' ')[0] : 'there'}! 👋 Welcome to GreenZet 24/7 Live Support. How can I help you today?`,
      time: 'Just now'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const userText = inputMsg.trim();
    const newMsg = {
      id: Date.now(),
      sender: 'user',
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMsg('');
    setIsTyping(true);

    // Automated smart assistant response
    setTimeout(() => {
      let botReply = "I have noted your request! A GreenZet support specialist will assist you shortly.";
      const lower = userText.toLowerCase();

      if (lower.includes('order') || lower.includes('track')) {
        botReply = "You can track your live 5-stage order progress anytime under 'My Orders'. Live orders include the 4-digit OTP and rider contact!";
      } else if (lower.includes('delivery') || lower.includes('time') || lower.includes('late')) {
        botReply = "Our express delivery riders typically arrive within 25–35 minutes in Malda (732101). Free delivery applies on orders above ₹399!";
      } else if (lower.includes('refund') || lower.includes('cancel') || lower.includes('money')) {
        botReply = "Cancellations before rider dispatch receive an instant 100% refund credited directly to your GreenZet in-app wallet.";
      } else if (lower.includes('coupon') || lower.includes('discount') || lower.includes('code')) {
        botReply = "Try using coupon code 'WELCOME50' for ₹50 OFF, or 'SAVE20' for 20% OFF your grocery basket!";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: botReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-40 bg-gradient-to-tr from-emerald-700 to-teal-600 hover:from-emerald-800 hover:to-teal-700 text-white p-3.5 rounded-full shadow-2xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95 group"
        title="24/7 Live Customer Support"
      >
        <MessageSquare className="w-5 h-5" />
        <span className="text-xs font-bold hidden sm:inline pr-1">24/7 Support</span>
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-ping absolute -top-0.5 -right-0.5" />
      </button>

      {/* Chat Window Modal */}
      {isOpen && (
        <div className="fixed bottom-20 left-6 z-50 w-[340px] sm:w-[380px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[460px] animate-scaleUp">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white p-4 flex items-center justify-between shadow">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-emerald-200" />
              </div>
              <div>
                <h4 className="font-bold text-xs">GreenZet Help Desk</h4>
                <span className="text-[10px] text-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online • 24/7 Instant Support
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'bot' && (
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                    GZ
                  </div>
                )}
                <div
                  className={`max-w-[75%] p-3 rounded-2xl ${
                    m.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none shadow-sm'
                      : 'bg-white text-slate-800 rounded-bl-none border border-slate-200/80 shadow-xs'
                  }`}
                >
                  <p className="leading-relaxed">{m.text}</p>
                  <span className={`text-[9px] block mt-1 ${m.sender === 'user' ? 'text-emerald-200' : 'text-slate-400'}`}>
                    {m.time}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1 text-slate-400 text-[11px] italic bg-white px-3 py-1.5 rounded-xl w-24 border border-slate-100">
                <span>typing</span>
                <span className="animate-bounce">.</span>
                <span className="animate-bounce delay-100">.</span>
                <span className="animate-bounce delay-200">.</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder="Ask about orders, delivery, refunds..."
              className="flex-1 bg-slate-100 text-slate-800 text-xs px-3 py-2 rounded-xl outline-none focus:bg-white focus:border-emerald-500 border border-transparent"
            />
            <button
              type="submit"
              disabled={!inputMsg.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white p-2 rounded-xl transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </>
  );
}
