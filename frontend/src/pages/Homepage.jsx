import { useEffect, useState } from 'react';
import { NavLink } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import axiosClient from '../utils/axiosClient';
import { logoutUser } from '../authSlice';
import { Search, Trophy, CheckCircle2, LogOut, ShieldAlert, Sparkles, Code2, HelpCircle } from 'lucide-react';

function Homepage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [problems, setProblems] = useState([]);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    difficulty: 'all',
    tag: 'all',
    status: 'all'
  });

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const { data } = await axiosClient.get('/problem/getAllProblem');
        setProblems(data);
      } catch (error) {
        console.error('Error fetching problems:', error);
      }
    };

    const fetchSolvedProblems = async () => {
      try {
        const { data } = await axiosClient.get('/problem/problemSolvedByUser');
        setSolvedProblems(data);
      } catch (error) {
        console.error('Error fetching solved problems:', error);
      }
    };

    fetchProblems();
    if (user) fetchSolvedProblems();
  }, [user]);

  const handleLogout = () => {
    dispatch(logoutUser());
    setSolvedProblems([]);
  };

  const filteredProblems = problems.filter(problem => {
    const titleMatch = problem.title.toLowerCase().includes(searchQuery.toLowerCase());
    const difficultyMatch = filters.difficulty === 'all' || problem.difficulty === filters.difficulty;
    const tagMatch = filters.tag === 'all' || problem.tags === filters.tag;
    const isSolved = solvedProblems.some(sp => sp._id === problem._id);
    const statusMatch = filters.status === 'all' || 
                        (filters.status === 'solved' && isSolved) ||
                        (filters.status === 'unsolved' && !isSolved);
    return titleMatch && difficultyMatch && tagMatch && statusMatch;
  });

  // Calculate difficulty-wise breakdown
  const totalEasy = problems.filter(p => p.difficulty.toLowerCase() === 'easy').length;
  const totalMedium = problems.filter(p => p.difficulty.toLowerCase() === 'medium').length;
  const totalHard = problems.filter(p => p.difficulty.toLowerCase() === 'hard').length;

  const solvedEasy = solvedProblems.filter(p => p.difficulty.toLowerCase() === 'easy').length;
  const solvedMedium = solvedProblems.filter(p => p.difficulty.toLowerCase() === 'medium').length;
  const solvedHard = solvedProblems.filter(p => p.difficulty.toLowerCase() === 'hard').length;

  const progressPercent = problems.length > 0 ? Math.round((solvedProblems.length / problems.length) * 100) : 0;
  const strokeDashoffset = 251.2 - (251.2 * progressPercent) / 100;

  const tags = ['all', 'array', 'linkedList', 'graph', 'dp'];

  const getDifficultyBadgeColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'medium': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'hard': return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default: return 'bg-slate-700/10 text-slate-400 border-slate-700/30';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-violet-500 selection:text-white">
      {/* Navigation Bar */}
      <nav className="navbar bg-slate-900/80 backdrop-blur-md border-b border-slate-800/60 px-6 py-4 sticky top-0 z-50">
        <div className="flex-1 gap-2 items-center">
          <span className="text-xl font-bold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
            Coding Arena
          </span>
          <NavLink to="/leaderboard" className="btn btn-ghost btn-sm text-xs gap-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 rounded-lg">
            <Trophy className="h-3.5 w-3.5 text-yellow-500" />
            Leaderboard
          </NavLink>
        </div>
        <div className="flex-none gap-4">
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost hover:bg-slate-800/60 rounded-xl px-4 py-2 border border-slate-800 text-slate-300 hover:text-slate-100 gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
              {user?.firstName}
            </div>
            <ul tabIndex={0} className="mt-3 p-2 shadow-2xl menu menu-sm dropdown-content bg-slate-900 border border-slate-800 rounded-xl w-52 text-slate-300 gap-1">
              {user?.role === 'admin' && (
                <li>
                  <NavLink to="/admin" className="flex items-center gap-2 hover:bg-slate-800 py-2 rounded-lg">
                    <ShieldAlert className="h-4 w-4 text-rose-400" />
                    Admin Dashboard
                  </NavLink>
                </li>
              )}
              <li>
                <button onClick={handleLogout} className="flex items-center gap-2 hover:bg-rose-950/30 hover:text-rose-400 py-2 rounded-lg transition-colors">
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto max-w-5xl p-6">
        
        {/* Progress Tracker Dashboard Header */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/60 rounded-3xl p-6 mb-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-extrabold tracking-tight">
                  Welcome back, <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">{user?.firstName}</span>!
                </h1>
                <Sparkles className="h-6 w-6 text-yellow-400 animate-bounce" />
              </div>
              <p className="text-slate-400 mt-2 max-w-md">
                Fuel your passion, master algorithms, and conquer the leaderboard in the ultimate coding arena.
              </p>
              
              {/* Stats Breakdown */}
              <div className="flex flex-wrap gap-3 mt-6">
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="text-xs font-semibold text-emerald-400">Easy: {solvedEasy}/{totalEasy}</span>
                </div>
                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span className="text-xs font-semibold text-amber-400">Medium: {solvedMedium}/{totalMedium}</span>
                </div>
                <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  <span className="text-xs font-semibold text-rose-400">Hard: {solvedHard}/{totalHard}</span>
                </div>
              </div>
            </div>

            {/* Circular Progress Display */}
            <div className="flex items-center gap-6 bg-slate-950/40 border border-slate-800/40 p-4 rounded-2xl backdrop-blur-sm pr-6">
              <div className="relative flex items-center justify-center">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" className="text-slate-800" fill="transparent" />
                  <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" className="text-violet-500 drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" fill="transparent"
                    strokeDasharray="251.2"
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round" />
                </svg>
                <div className="absolute text-center">
                  <span className="text-xl font-bold font-mono">{progressPercent}%</span>
                  <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Solved</span>
                </div>
              </div>
              <div>
                <span className="block text-slate-400 text-xs font-medium uppercase tracking-wider">Overall Progress</span>
                <span className="text-2xl font-black font-mono text-slate-200">
                  {solvedProblems.length} <span className="text-slate-600 text-lg">/ {problems.length}</span>
                </span>
                <span className="block text-[10px] text-slate-500 mt-0.5">Problems Completed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Controls: Search, Select Filters, Tag selection */}
        <div className="flex flex-col gap-6 mb-8">
          
          {/* Search and Filters row */}
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search Input */}
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search problems by name..."
                className="input input-bordered w-full pl-11 bg-slate-900 border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl text-slate-200 placeholder-slate-500 shadow-inner"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Status & Difficulty selectors */}
            <div className="flex gap-4 w-full md:w-auto">
              <select
                className="select select-bordered bg-slate-900 border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl text-slate-300 w-full md:w-44"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="all">All Statuses</option>
                <option value="solved">Solved</option>
                <option value="unsolved">Unsolved</option>
              </select>

              <select
                className="select select-bordered bg-slate-900 border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl text-slate-300 w-full md:w-44"
                value={filters.difficulty}
                onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Interactive Tag Selector Row */}
          <div className="flex flex-wrap items-center gap-2 py-1 border-t border-b border-slate-800/40">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 mr-2">Tags:</span>
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setFilters({ ...filters, tag: tag })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border capitalize ${
                  filters.tag === tag
                    ? 'bg-violet-600 border-violet-500 text-white shadow-[0_0_12px_rgba(109,40,217,0.4)]'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {tag === 'all' ? 'All Tags' : tag}
              </button>
            ))}
          </div>
        </div>

        {/* Problems List */}
        {filteredProblems.length === 0 ? (
          <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-16 text-center shadow-lg">
            <HelpCircle className="h-12 w-12 mx-auto text-slate-600 mb-3" />
            <h3 className="text-lg font-bold text-slate-400">No problems found</h3>
            <p className="text-slate-600 text-sm mt-1">
              Try adjusting your search queries or filter selections.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredProblems.map(problem => {
              const isSolved = solvedProblems.some(sp => sp._id === problem._id);
              return (
                <div 
                  key={problem._id} 
                  className={`card bg-slate-900/40 border border-slate-850 hover:border-violet-500/50 hover:shadow-[0_0_15px_rgba(124,58,237,0.08)] transition-all duration-300 rounded-2xl ${
                    isSolved ? 'bg-slate-900/20' : ''
                  }`}
                >
                  <div className="card-body p-5 md:p-6 flex flex-row items-center justify-between gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2.5">
                        {isSolved && (
                          <CheckCircle2 className="h-5 w-5 text-emerald-400 drop-shadow-[0_0_4px_rgba(52,211,153,0.3)] shrink-0" />
                        )}
                        <h2 className="text-lg font-bold text-slate-200 hover:text-violet-400 transition-colors">
                          <NavLink to={`/problem/${problem._id}`}>
                            {problem.title}
                          </NavLink>
                        </h2>
                      </div>
                      
                      {/* Meta Tags */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 border rounded text-[10px] uppercase font-bold tracking-wider ${getDifficultyBadgeColor(problem.difficulty)}`}>
                          {problem.difficulty}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-800/60 border border-slate-700/40 text-slate-400 rounded text-[10px] font-semibold flex items-center gap-1 capitalize">
                          <Code2 className="h-3 w-3 text-slate-500" />
                          {problem.tags}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <NavLink 
                        to={`/problem/${problem._id}`} 
                        className={`btn btn-sm px-4 rounded-xl border border-slate-800 hover:border-violet-500/50 transition-all text-xs font-semibold ${
                          isSolved 
                            ? 'bg-slate-950 text-slate-400 hover:text-slate-100 hover:bg-slate-900' 
                            : 'bg-violet-600 hover:bg-violet-700 text-white hover:shadow-[0_0_15px_rgba(109,40,217,0.35)] border-none'
                        }`}
                      >
                        {isSolved ? 'Solve Again' : 'Solve'}
                      </NavLink>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Homepage;