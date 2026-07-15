import React from 'react';
import { NavLink } from 'react-router';
import { useSelector } from 'react-redux';
import { useSocket } from '../context/SocketContext';
import { Swords, Users, Trophy, ChevronLeft, ShieldAlert } from 'lucide-react';

const BattleLobby = () => {
  const { user } = useSelector((state) => state.auth);
  const { onlineUsers, sendInvite, inviteStatus, setInviteStatus, errorMessage } = useSocket();

  // Filter out current user from the list
  const activeOpponents = onlineUsers.filter((u) => u.userId !== user?._id);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'online':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-semibold">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Online
          </span>
        );
      case 'in-battle':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-xs font-semibold">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
            In Battle
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-400 rounded-full text-xs font-semibold">
            Offline
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-violet-500 selection:text-white pb-12">
      {/* Navigation */}
      <nav className="navbar bg-slate-900/80 backdrop-blur-md border-b border-slate-800/60 px-6 py-4 sticky top-0 z-50">
        <div className="flex-1 gap-2 items-center">
          <NavLink to="/" className="btn btn-ghost btn-sm text-xs gap-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 rounded-lg">
            <ChevronLeft className="h-4 w-4" />
            Back to Arena
          </NavLink>
          <span className="text-xl font-bold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent ml-2">
            Battle Lobby
          </span>
        </div>
      </nav>

      <div className="container mx-auto max-w-4xl p-6 mt-6">
        {/* Banner */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/60 rounded-3xl p-8 mb-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-extrabold tracking-tight">
                  1v1 Real-Time <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Coding Battles</span>
                </h1>
                <Swords className="h-7 w-7 text-violet-400 animate-pulse" />
              </div>
              <p className="text-slate-400 mt-2 max-w-lg">
                Challenge any online programmer. You will both be assigned the same random coding question. The person who submits the correct code first wins!
              </p>
            </div>
            <div className="shrink-0 flex items-center justify-center p-4 bg-slate-950/40 border border-slate-800/40 rounded-2xl backdrop-blur-sm gap-4">
              <Users className="h-10 w-10 text-violet-500" />
              <div>
                <span className="block text-slate-500 text-xs font-semibold uppercase tracking-wider">Active Warriors</span>
                <span className="text-2xl font-black font-mono text-slate-200">{onlineUsers.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Global matching alerts */}
        {inviteStatus === 'waiting' && (
          <div className="bg-violet-950/20 border border-violet-500/30 text-violet-300 px-6 py-4 rounded-2xl flex items-center justify-between mb-6 animate-pulse shadow-lg shadow-violet-950/10">
            <div className="flex items-center gap-3">
              <span className="loading loading-spinner loading-sm text-violet-400"></span>
              <span className="text-sm font-semibold">Challenge request sent! Waiting for opponent response...</span>
            </div>
            <button 
              onClick={() => setInviteStatus(null)} 
              className="text-xs hover:text-slate-100 underline decoration-violet-500/50"
            >
              Cancel Request
            </button>
          </div>
        )}

        {inviteStatus === 'declined' && (
          <div className="bg-rose-950/20 border border-rose-500/30 text-rose-300 px-6 py-4 rounded-2xl flex items-center gap-3 mb-6 shadow-lg shadow-rose-950/10">
            <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0" />
            <span className="text-sm font-semibold">Your challenge invitation was declined by the opponent.</span>
          </div>
        )}

        {inviteStatus === 'error' && (
          <div className="bg-amber-950/20 border border-amber-500/30 text-amber-300 px-6 py-4 rounded-2xl flex items-center gap-3 mb-6 shadow-lg shadow-amber-950/10">
            <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0" />
            <span className="text-sm font-semibold">{errorMessage || 'An error occurred. Please try again.'}</span>
          </div>
        )}

        {/* Opponents List */}
        <div className="bg-slate-900/20 border border-slate-800/60 rounded-3xl p-6 shadow-2xl">
          <h2 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Available Challengers
          </h2>

          {activeOpponents.length === 0 ? (
            <div className="border border-dashed border-slate-800 rounded-2xl p-16 text-center">
              <div className="flex justify-center mb-4">
                <span className="loading loading-ring loading-lg text-violet-500/60"></span>
              </div>
              <h3 className="text-base font-bold text-slate-400">Waiting for other players to join...</h3>
              <p className="text-slate-600 text-xs mt-1 max-w-sm mx-auto">
                Open a new window/incognito tab, sign up with a different email, and join the battle lobby to play against yourself!
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {activeOpponents.map((opponent) => (
                <div 
                  key={opponent.userId}
                  className="bg-slate-900/40 border border-slate-800 hover:border-violet-500/40 hover:shadow-[0_0_15px_rgba(124,58,237,0.05)] transition-all duration-300 rounded-2xl p-5 flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-slate-200">{opponent.firstName}</h3>
                      <span className="text-[10px] font-mono text-slate-500">ID: {opponent.userId.slice(-6).toUpperCase()}</span>
                    </div>
                    {getStatusBadge(opponent.status)}
                  </div>

                  <div>
                    <button
                      onClick={() => sendInvite(opponent.userId)}
                      disabled={opponent.status !== 'online' || inviteStatus === 'waiting'}
                      className={`w-full btn btn-sm py-2.5 rounded-xl border border-slate-800 font-semibold transition-all text-xs gap-1.5 ${
                        opponent.status === 'online'
                          ? 'bg-violet-600 border-none hover:bg-violet-700 text-white hover:shadow-[0_0_12px_rgba(109,40,217,0.3)]'
                          : 'bg-slate-950 text-slate-600 cursor-not-allowed border-slate-850'
                      }`}
                    >
                      <Swords className="h-3.5 w-3.5" />
                      {opponent.status === 'online' ? 'Challenge to Duel' : 'Busy in Match'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BattleLobby;
