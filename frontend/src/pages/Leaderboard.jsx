import { useEffect, useState } from 'react';
import { NavLink } from 'react-router';
import { useSelector } from 'react-redux';
import axiosClient from '../utils/axiosClient';
import { Trophy, Medal, ArrowLeft, Loader2 } from 'lucide-react';

function Leaderboard() {
  const { user } = useSelector((state) => state.auth);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data } = await axiosClient.get('/user/leaderboard');
        setRankings(data);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchLeaderboard();
    } else {
      setLoading(false);
    }
  }, [user]);

  const getRankBadge = (index) => {
    switch (index) {
      case 0:
        return <Trophy className="h-6 w-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />;
      case 1:
        return <Medal className="h-6 w-6 text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.5)]" />;
      case 2:
        return <Medal className="h-6 w-6 text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.5)]" />;
      default:
        return <span className="font-semibold text-slate-400 pl-2">{index + 1}</span>;
    }
  };

  const getRowHighlightClass = (index, item) => {
    const isCurrentUser = user && item._id === user._id;
    if (isCurrentUser) return 'bg-violet-950/40 border-l-4 border-l-violet-500 hover:bg-violet-950/60 transition-all duration-200';
    if (index === 0) return 'bg-yellow-950/10 hover:bg-yellow-950/20 transition-all duration-200';
    if (index === 1) return 'bg-slate-900/40 hover:bg-slate-900/60 transition-all duration-200';
    if (index === 2) return 'bg-amber-950/10 hover:bg-amber-950/20 transition-all duration-200';
    return 'hover:bg-slate-800/40 transition-all duration-200';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-violet-500 selection:text-white">
      {/* Navbar */}
      <nav className="navbar bg-slate-900/80 backdrop-blur-md border-b border-slate-800/60 px-6 py-4 sticky top-0 z-50">
        <div className="flex-1 items-center gap-4">
          <NavLink to="/" className="btn btn-ghost p-1 hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5 text-slate-400 hover:text-slate-100" />
          </NavLink>
          <span className="text-xl font-bold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
            Coding Arena
          </span>
          <span className="text-xs uppercase bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono tracking-wider">
            Leaderboard
          </span>
        </div>
      </nav>

      {/* Main Container */}
      <div className="container mx-auto max-w-4xl p-6">
        <div className="text-center my-8">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Top Coders
          </h1>
          <p className="text-slate-400 mt-2">
            See who has solved the most coding problems in the arena
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 text-violet-500 animate-spin" />
            <p className="text-slate-400 font-medium">Loading ranking statistics...</p>
          </div>
        ) : rankings.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-12 text-center shadow-xl backdrop-blur-sm">
            <Trophy className="h-16 w-16 mx-auto text-slate-600 mb-4" />
            <h3 className="text-xl font-bold text-slate-300">No stats available</h3>
            <p className="text-slate-500 mt-1 max-w-md mx-auto">
              Solve problems or wait for other arena contestants to start submitting code!
            </p>
            <NavLink to="/" className="btn btn-primary mt-6 bg-gradient-to-r from-violet-600 to-indigo-600 border-none hover:from-violet-700 hover:to-indigo-700 shadow-[0_0_15px_rgba(109,40,217,0.3)]">
              Solve Problems
            </NavLink>
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="table w-full text-slate-300 border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-400 uppercase text-xs tracking-wider font-semibold">
                    <th className="py-4 pl-6 text-left">Rank</th>
                    <th className="py-4 text-left">Coder</th>
                    <th className="py-4 text-right pr-6">Problems Solved</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((item, index) => (
                    <tr 
                      key={item._id} 
                      className={`border-b border-slate-800/40 ${getRowHighlightClass(index, item)}`}
                    >
                      <td className="py-4 pl-6 align-middle">
                        <div className="flex items-center">
                          {getRankBadge(index)}
                        </div>
                      </td>
                      <td className="py-4 align-middle">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-100 flex items-center gap-2">
                            {item.firstName} {item.lastName || ''}
                            {user && item._id === user._id && (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded border border-violet-500/30">
                                You
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 text-right pr-6 align-middle font-mono font-bold text-lg text-slate-200">
                        <span className="bg-slate-850 px-3 py-1 rounded-lg border border-slate-800/40 text-violet-400">
                          {item.solvedCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;
