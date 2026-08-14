import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function NotificationToast() {
  const { notification } = useAuth();

  if (!notification) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
  };

  const borders = {
    success: 'border-emerald-200 bg-emerald-50/95 text-emerald-950',
    error: 'border-rose-200 bg-rose-50/95 text-rose-950',
    warning: 'border-amber-200 bg-amber-50/95 text-amber-950',
    info: 'border-blue-200 bg-blue-50/95 text-blue-950'
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-bounce-short shadow-2xl transition-all duration-300">
      <div className={`p-4 rounded-xl border shadow-lg backdrop-blur-md flex items-start gap-3 ${borders[notification.type || 'info']}`}>
        {icons[notification.type || 'info']}
        <div className="flex-1 text-sm">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <span>{notification.title}</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/70 text-slate-600 border border-slate-200">
                Live Alert
              </span>
            </h4>
          </div>
          <p className="text-slate-700 text-xs mt-0.5 leading-relaxed">{notification.message}</p>
        </div>
      </div>
    </div>
  );
}
