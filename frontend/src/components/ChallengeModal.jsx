import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Sword, X, Check } from 'lucide-react';

const ChallengeModal = () => {
  const { incomingInvite, acceptInvite, declineInvite } = useSocket();
  const [timeLeft, setTimeLeft] = useState(20);

  useEffect(() => {
    if (!incomingInvite) return;

    setTimeLeft(20);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          declineInvite(incomingInvite.senderSocketId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [incomingInvite, declineInvite]);

  if (!incomingInvite) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-fade-in-up">
      <div className="relative w-full max-w-md p-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
        {/* Decorative elements */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Content */}
        <div className="flex flex-col items-center text-center relative z-10">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400 border border-violet-500/30 mb-4 animate-bounce">
            <Sword className="h-8 w-8" />
          </div>

          <h3 className="text-xl font-bold text-slate-100">Coding Duel Challenge!</h3>
          <p className="mt-2 text-sm text-slate-400">
            <span className="font-semibold text-violet-400">{incomingInvite.senderName}</span> has challenged you to a 1v1 coding battle!
          </p>

          {/* Time Limit Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-6 mb-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-1.5 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${(timeLeft / 20) * 100}%` }}
            ></div>
          </div>
          <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">
            Auto-declines in {timeLeft} seconds
          </span>

          {/* Action Buttons */}
          <div className="flex gap-4 w-full mt-6">
            <button
              onClick={() => declineInvite(incomingInvite.senderSocketId)}
              className="flex-1 btn btn-outline border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-100 rounded-xl gap-2 font-medium"
            >
              <X className="h-4 w-4" />
              Decline
            </button>
            <button
              onClick={() => acceptInvite(incomingInvite.senderSocketId)}
              className="flex-1 btn bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white rounded-xl gap-2 font-semibold shadow-[0_0_15px_rgba(124,58,237,0.3)] border-none"
            >
              <Check className="h-4 w-4" />
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeModal;
