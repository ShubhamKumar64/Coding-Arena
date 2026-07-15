import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router';
import { useSelector } from 'react-redux';
import Editor from '@monaco-editor/react';
import confetti from 'canvas-confetti';
import { useSocket } from '../context/SocketContext';
import axiosClient from '../utils/axiosClient';
import { 
  Swords, Play, Send, CheckCircle2, XCircle, AlertCircle, 
  MessageSquare, Trophy, ShieldAlert, Sparkles, Code2, LogOut 
} from 'lucide-react';

const langMap = {
  cpp: 'C++',
  java: 'Java',
  javascript: 'JavaScript'
};

const TAUNTS = [
  "GG!",
  "Catch me if you can!",
  "Stuck? 😉",
  "Almost solved!",
  "Too easy!",
  "Good luck!"
];

const BattleArena = () => {
  const { battleId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { socket } = useSocket();

  // Route state fallbacks
  const initialProblemId = location.state?.problemId;
  const opponentName = location.state?.opponentName || 'Opponent';
  const opponentId = location.state?.opponentId;

  // Problem & Editor State
  const [problem, setProblem] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Results & Outputs State
  const [activeRightTab, setActiveRightTab] = useState('code');
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);

  // Real-Time Progress States
  const [isOpponentTyping, setIsOpponentTyping] = useState(false);
  const [myProgress, setMyProgress] = useState({ passed: 0, total: 1 });
  const [opponentProgress, setOpponentProgress] = useState({ passed: 0, total: 1 });
  
  // Real-Time Chat & Taunt bubbles
  const [activeTaunt, setActiveTaunt] = useState(null);
  const [myActiveTaunt, setMyActiveTaunt] = useState(null);
  const [showTauntSelector, setShowTauntSelector] = useState(false);

  // Game End State
  const [battleEndData, setBattleEndData] = useState(null); // { winnerId, winnerName, isForfeit }

  // Monaco Editor Ref
  const editorRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Fetch Problem details
  useEffect(() => {
    if (!initialProblemId) {
      navigate('/battle');
      return;
    }

    const fetchProblem = async () => {
      try {
        const response = await axiosClient.get(`/problem/problemById/${initialProblemId}`);
        const problemData = response.data;
        setProblem(problemData);
        
        // Load initial code for default language
        const initialCode = problemData.startCode.find(sc => sc.language === langMap[selectedLanguage])?.initialCode || '';
        setCode(initialCode);
        
        // Set total test cases
        setMyProgress({ passed: 0, total: problemData.hiddenTestCases.length });
        setOpponentProgress({ passed: 0, total: problemData.hiddenTestCases.length });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching problem details in battle:', error);
        navigate('/battle');
      }
    };

    fetchProblem();
  }, [initialProblemId, navigate]);

  // Connect socket and register listeners for this room
  useEffect(() => {
    if (!socket) return;

    // Join room
    socket.emit('join-battle', { battleId });

    // Listeners
    socket.on('opponent-typing', ({ isTyping }) => {
      setIsOpponentTyping(isTyping);
    });

    socket.on('opponent-test-results', ({ passed, total }) => {
      setOpponentProgress({ passed, total });
    });

    socket.on('receive-taunt', ({ tauntText }) => {
      setActiveTaunt(tauntText);
      // Play a small notification sound or delay dismissal
      const timeout = setTimeout(() => setActiveTaunt(null), 4000);
      return () => clearTimeout(timeout);
    });

    socket.on('battle-ended', ({ winnerId, winnerName, isForfeit }) => {
      setBattleEndData({ winnerId, winnerName, isForfeit });
      
      if (winnerId === user?._id) {
        // Trigger massive winner confetti
        confetti({
          particleCount: 180,
          spread: 90,
          origin: { y: 0.5 }
        });
      }
    });

    return () => {
      socket.off('opponent-typing');
      socket.off('opponent-test-results');
      socket.off('receive-taunt');
      socket.off('battle-ended');
    };
  }, [socket, battleId, user]);

  // Synchronize start code when user switches language
  useEffect(() => {
    if (problem) {
      const savedCode = localStorage.getItem(`battle_code_${battleId}_${selectedLanguage}`);
      if (savedCode) {
        setCode(savedCode);
      } else {
        const start = problem.startCode.find(sc => sc.language === langMap[selectedLanguage])?.initialCode || '';
        setCode(start);
      }
    }
  }, [selectedLanguage, problem, battleId]);

  // Handle local code edits and emit typing events
  const handleEditorChange = (value) => {
    setCode(value || '');
    localStorage.setItem(`battle_code_${battleId}_${selectedLanguage}`, value || '');

    if (socket) {
      socket.emit('battle-typing', { battleId, isTyping: true });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('battle-typing', { battleId, isTyping: false });
      }, 1000);
    }
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  // Run visible test cases
  const handleRun = async () => {
    if (running || submitting) return;
    setRunning(true);
    setRunResult(null);
    setActiveRightTab('testcase');

    try {
      const response = await axiosClient.post(`/submission/run/${initialProblemId}`, {
        code,
        language: selectedLanguage
      });

      setRunResult(response.data);
      
      // Update local and socket progress based on visible run results
      if (response.data?.testCases) {
        const passed = response.data.testCases.filter(t => t.status_id === 3).length;
        const total = response.data.testCases.length;
        socket?.emit('battle-test-results', { battleId, passed, total });
      }
    } catch (error) {
      console.error('Error running code in battle:', error);
      setRunResult({
        success: false,
        error: 'Internal server error running code'
      });
    } finally {
      setRunning(false);
    }
  };

  // Submit code to evaluate hidden test cases
  const handleSubmitCode = async () => {
    if (running || submitting) return;
    setSubmitting(true);
    setSubmitResult(null);
    setActiveRightTab('result');

    try {
      const response = await axiosClient.post(`/submission/submit/${initialProblemId}`, {
        code,
        language: selectedLanguage
      });

      setSubmitResult(response.data);

      const passed = response.data.passedTestCases || 0;
      const total = response.data.totalTestCases || 1;
      
      setMyProgress({ passed, total });

      // Sync test results progress via Socket.io
      socket?.emit('battle-test-results', { battleId, passed, total });

      // If accepted (passes all hidden test cases), declare victory
      if (response.data.accepted) {
        socket?.emit('submit-success', { 
          battleId, 
          winnerId: user._id, 
          winnerName: user.firstName 
        });
      }
    } catch (error) {
      console.error('Error submitting code in battle:', error);
      setSubmitResult({
        accepted: false,
        error: 'Internal server error submitting code'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Taunt triggers
  const triggerTaunt = (tauntText) => {
    if (socket) {
      socket.emit('send-taunt', { battleId, tauntText });
      setMyActiveTaunt(tauntText);
      setShowTauntSelector(false);
      setTimeout(() => setMyActiveTaunt(null), 3000);
    }
  };

  // Map language selection format to Monaco editor languages
  const getLanguageForMonaco = (lang) => {
    switch (lang) {
      case 'javascript': return 'javascript';
      case 'java': return 'java';
      case 'cpp': return 'cpp';
      default: return 'javascript';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 justify-center items-center min-h-screen bg-slate-950 text-slate-100">
        <span className="loading loading-ring loading-lg text-violet-500"></span>
        <span className="text-sm font-semibold text-slate-400">Loading battle arena... Preparing compiler</span>
      </div>
    );
  }

  // Calculate percentages for progress bars
  const myPct = Math.round((myProgress.passed / myProgress.total) * 100) || 0;
  const oppPct = Math.round((opponentProgress.passed / opponentProgress.total) * 100) || 0;

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 font-sans select-none overflow-hidden relative">
      
      {/* Top VS Dashboard Header */}
      <header className="flex-none bg-slate-900 border-b border-slate-800/80 px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-violet-600/20 text-violet-400 border border-violet-500/20">
            <Swords className="h-5 w-5" />
          </span>
          <span className="text-sm font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            Battle Arena
          </span>
        </div>

        {/* Real-time Battle Tracker Panel */}
        <div className="flex items-center gap-8 md:gap-16 relative">
          
          {/* Player stats */}
          <div className="text-right flex flex-col items-end">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold">You ({user?.firstName})</span>
              <span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 mt-0.5">
              Passed: {myProgress.passed} / {myProgress.total} test cases
            </span>
            <div className="w-28 bg-slate-800 rounded-full h-1 mt-1.5 overflow-hidden">
              <div className="bg-violet-500 h-1 rounded-full" style={{ width: `${myPct}%` }}></div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center relative">
            <span className="text-xs font-black px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 font-mono tracking-tighter">
              VS
            </span>
            
            {/* Show local sending taunts */}
            {myActiveTaunt && (
              <div className="absolute bottom-[-45px] bg-violet-600 text-white text-xs px-3 py-1 rounded-xl shadow-lg border border-violet-400/30 animate-bounce whitespace-nowrap z-50">
                You: {myActiveTaunt}
              </div>
            )}

            {/* Show incoming opponent taunts */}
            {activeTaunt && (
              <div className="absolute bottom-[-45px] bg-fuchsia-600 text-white text-xs px-3 py-1 rounded-xl shadow-lg border border-fuchsia-400/30 animate-bounce whitespace-nowrap z-50">
                {opponentName}: {activeTaunt}
              </div>
            )}
          </div>

          {/* Opponent stats */}
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-500"></span>
              <span className="text-xs text-slate-400 font-bold">{opponentName}</span>
              {isOpponentTyping && (
                <span className="text-[9px] text-fuchsia-400 font-semibold animate-pulse tracking-wide italic">
                  (typing...)
                </span>
              )}
            </div>
            <span className="text-[10px] font-mono text-slate-500 mt-0.5">
              Passed: {opponentProgress.passed} / {opponentProgress.total} test cases
            </span>
            <div className="w-28 bg-slate-800 rounded-full h-1 mt-1.5 overflow-hidden">
              <div className="bg-fuchsia-500 h-1 rounded-full" style={{ width: `${oppPct}%` }}></div>
            </div>
          </div>
        </div>

        {/* Quick Taunt / Forfeit Bar */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button 
              onClick={() => setShowTauntSelector(!showTauntSelector)}
              className="btn btn-outline btn-sm border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-100 rounded-xl gap-1 text-xs"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Taunt
            </button>
            
            {showTauntSelector && (
              <div className="absolute right-0 mt-2 p-2 bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl flex flex-col gap-1 w-44 z-50 animate-fade-in-up">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2.5 py-1.5 block">
                  Send Battle Taunt
                </span>
                {TAUNTS.map((taunt, index) => (
                  <button
                    key={index}
                    onClick={() => triggerTaunt(taunt)}
                    className="text-left px-2.5 py-1.5 hover:bg-slate-800 text-xs text-slate-300 rounded-lg transition-colors"
                  >
                    {taunt}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/battle')}
            className="btn btn-ghost btn-sm text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 rounded-xl text-xs"
          >
            Forfeit
          </button>
        </div>
      </header>

      {/* Main Splits Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Question details */}
        <div className="w-1/2 flex flex-col border-r border-slate-900 overflow-hidden bg-slate-950/20">
          <div className="tabs tabs-bordered bg-slate-900/60 px-4 py-1 flex-none border-b border-slate-900">
            <button className="tab tab-active text-xs text-slate-300 font-semibold px-4 border-b-2 border-violet-500">
              Problem Description
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
            {problem && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-100">{problem.title}</h1>
                  <span className={`px-2 py-0.5 border rounded text-[10px] uppercase font-bold tracking-wider ${
                    problem.difficulty.toLowerCase() === 'easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    problem.difficulty.toLowerCase() === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    {problem.difficulty}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-800/60 border border-slate-700/40 text-slate-400 rounded text-[10px] font-semibold capitalize">
                    {problem.tags}
                  </span>
                </div>

                <div className="prose max-w-none text-slate-300 text-sm leading-relaxed whitespace-pre-wrap mb-8">
                  {problem.description}
                </div>

                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-400 mb-4">Examples:</h3>
                  <div className="space-y-4">
                    {problem.visibleTestCases.map((example, index) => (
                      <div key={index} className="bg-slate-900/40 border border-slate-850 p-4 rounded-2xl">
                        <h4 className="font-bold text-xs text-violet-400 mb-2.5">Example {index + 1}:</h4>
                        <div className="space-y-1.5 text-xs font-mono text-slate-300">
                          <div><strong>Input:</strong> {example.input}</div>
                          <div><strong>Output:</strong> {example.output}</div>
                          <div className="text-slate-400 mt-1"><strong>Explanation:</strong> {example.explanation}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Side: Coding and Compiler output */}
        <div className="w-1/2 flex flex-col overflow-hidden bg-slate-950">
          
          {/* Right Header: language and theme */}
          <div className="flex-none bg-slate-900/60 px-4 py-2 border-b border-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <select
                className="select select-sm bg-slate-950 border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl text-xs text-slate-300 w-36"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
              >
                <option value="javascript">JavaScript</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>
            </div>

            {/* Tab navigation for Editor output pane */}
            <div className="flex gap-1.5">
              <button
                onClick={() => setActiveRightTab('code')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeRightTab === 'code' ? 'bg-slate-800 text-slate-100' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Editor
              </button>
              <button
                onClick={() => setActiveRightTab('testcase')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all relative ${
                  activeRightTab === 'testcase' ? 'bg-slate-800 text-slate-100' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Console Results
                {runResult && <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-violet-500 animate-ping"></span>}
              </button>
              <button
                onClick={() => setActiveRightTab('result')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all relative ${
                  activeRightTab === 'result' ? 'bg-slate-800 text-slate-100' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Submission Logs
                {submitResult && <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-fuchsia-500 animate-ping"></span>}
              </button>
            </div>
          </div>

          {/* Right Editor Screen panel */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {activeRightTab === 'code' ? (
              <div className="flex-1 overflow-hidden relative min-h-[300px]">
                <Editor
                  height="100%"
                  language={getLanguageForMonaco(selectedLanguage)}
                  theme="vs-dark"
                  value={code}
                  onChange={handleEditorChange}
                  onMount={handleEditorDidMount}
                  options={{
                    fontSize: 14,
                    fontFamily: 'Fira Code, monospace',
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    padding: { top: 16, bottom: 16 },
                    lineHeight: 22,
                    smoothScrolling: true,
                    cursorSmoothCaretAnimation: 'on'
                  }}
                />
              </div>
            ) : activeRightTab === 'testcase' ? (
              <div className="flex-1 p-6 overflow-y-auto bg-slate-950 font-mono text-sm leading-relaxed scrollbar-thin">
                <h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-500 mb-4">
                  Run Results (Visible test cases)
                </h3>
                {running ? (
                  <div className="flex items-center gap-2 text-slate-400 py-2">
                    <span className="loading loading-spinner loading-xs text-violet-500"></span>
                    Compiling and running against visible test cases...
                  </div>
                ) : runResult ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      {runResult.success ? (
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-xl text-xs font-bold border border-emerald-500/20">
                          <CheckCircle2 className="h-4 w-4" /> SUCCESS
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 text-rose-400 rounded-xl text-xs font-bold border border-rose-500/20">
                          <XCircle className="h-4 w-4" /> COMPILATION ERROR / WRONG ANSWER
                        </span>
                      )}
                      <span className="text-xs text-slate-500 font-mono">
                        Time: {runResult.runtime || 0}s | Memory: {runResult.memory || 0} KB
                      </span>
                    </div>

                    {runResult.testCases && (
                      <div className="space-y-3 mt-4">
                        {runResult.testCases.map((test, index) => (
                          <div key={index} className="p-4 rounded-xl border border-slate-900 bg-slate-900/30">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-slate-400">Test Case {index + 1}</span>
                              <span className={`text-xs font-bold ${test.status_id === 3 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {test.status_id === 3 ? 'Passed' : 'Failed'}
                              </span>
                            </div>
                            <div className="text-xs font-mono space-y-1 text-slate-300">
                              <div><strong>Input:</strong> {test.stdin || 'None'}</div>
                              <div><strong>Expected Output:</strong> {test.expected_output || 'None'}</div>
                              <div><strong>Your Output:</strong> {test.stdout || 'None'}</div>
                              {test.stderr && (
                                <div className="text-rose-400/80 bg-rose-950/10 p-2 rounded mt-2 border border-rose-950/20">
                                  <strong>Error Log:</strong> {test.stderr}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-500 italic">No runs executed yet. Write code and hit "Run Code".</div>
                )}
              </div>
            ) : (
              <div className="flex-1 p-6 overflow-y-auto bg-slate-950 font-mono text-sm leading-relaxed scrollbar-thin">
                <h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-500 mb-4">
                  Final Submission Results (Hidden test cases)
                </h3>
                {submitting ? (
                  <div className="flex items-center gap-2 text-slate-400 py-2">
                    <span className="loading loading-spinner loading-xs text-fuchsia-500"></span>
                    Evaluating code against all hidden test cases...
                  </div>
                ) : submitResult ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      {submitResult.accepted ? (
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-xl text-xs font-bold border border-emerald-500/20">
                          <CheckCircle2 className="h-4 w-4" /> ACCEPTED
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 text-rose-400 rounded-xl text-xs font-bold border border-rose-500/20">
                          <XCircle className="h-4 w-4" /> WRONG ANSWER
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      <div>Test Cases Passed: <strong className="text-slate-200">{submitResult.passedTestCases || 0} / {submitResult.totalTestCases || 0}</strong></div>
                      <div>Runtime duration: <strong className="text-slate-200">{submitResult.runtime || 0}s</strong></div>
                      <div>Peak memory usage: <strong className="text-slate-200">{submitResult.memory || 0} KB</strong></div>
                    </div>
                    {submitResult.errorMessage && (
                      <div className="text-rose-400 bg-rose-950/10 border border-rose-950/20 p-4 rounded-xl text-xs font-mono mt-4">
                        <strong>Error details:</strong> {submitResult.errorMessage}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-500 italic">No final submissions checked. Click "Submit Code" to test against hidden inputs.</div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Execution Bar */}
          <div className="flex-none p-4 bg-slate-900 border-t border-slate-800/80 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Auto-saves locally on code edit
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleRun}
                disabled={running || submitting}
                className="btn btn-outline border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-slate-100 rounded-xl text-xs gap-1.5 font-semibold"
              >
                <Play className="h-3.5 w-3.5" />
                Run Code
              </button>
              <button
                onClick={handleSubmitCode}
                disabled={running || submitting}
                className="btn bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-none rounded-xl text-xs gap-1.5 font-bold shadow-[0_0_15px_rgba(124,58,237,0.25)]"
              >
                <Send className="h-3.5 w-3.5" />
                Submit Code
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Game Ended Full-Screen Result Overlay */}
      {battleEndData && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-fade-in-up">
          <div className="w-full max-w-md p-8 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden text-center">
            
            {/* Visual background lights */}
            {battleEndData.winnerId === user?._id ? (
              <div className="absolute -top-20 -left-20 w-44 h-44 bg-violet-500/20 rounded-full blur-[60px] pointer-events-none"></div>
            ) : (
              <div className="absolute -top-20 -left-20 w-44 h-44 bg-rose-500/20 rounded-full blur-[60px] pointer-events-none"></div>
            )}

            {battleEndData.winnerId === user?._id ? (
              <div className="flex flex-col items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-500/10 text-violet-400 border border-violet-500/30 mb-6 shadow-inner animate-pulse">
                  <Trophy className="h-10 w-10 text-yellow-500" />
                </div>
                <h2 className="text-3xl font-black bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                  VICTORY!
                </h2>
                <p className="mt-3 text-slate-300 text-sm max-w-xs leading-relaxed">
                  Congratulations! You solved the problem first and won the coding battle!
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-500/10 text-rose-400 border border-rose-500/30 mb-6 shadow-inner">
                  <ShieldAlert className="h-10 w-10 text-rose-500" />
                </div>
                <h2 className="text-3xl font-black text-rose-500">
                  DEFEAT
                </h2>
                <p className="mt-3 text-slate-300 text-sm max-w-xs leading-relaxed">
                  {battleEndData.isForfeit 
                    ? "Match cancelled - your opponent forfeited the game."
                    : `${battleEndData.winnerName} solved the problem first and won the battle!`
                  }
                </p>
              </div>
            )}

            {/* Scorecard detail */}
            <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl my-6 flex justify-around items-center">
              <div>
                <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Your score</span>
                <span className="text-base font-black font-mono text-slate-200">
                  {myProgress.passed} <span className="text-slate-650 text-xs">/ {myProgress.total}</span>
                </span>
              </div>
              <div className="h-8 border-r border-slate-800"></div>
              <div>
                <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Opponent score</span>
                <span className="text-base font-black font-mono text-slate-200">
                  {opponentProgress.passed} <span className="text-slate-650 text-xs">/ {opponentProgress.total}</span>
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate('/battle')}
              className="w-full btn bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white rounded-xl py-3 text-sm font-extrabold border-none shadow-[0_0_15px_rgba(124,58,237,0.3)] mt-2"
            >
              Back to Battle Lobby
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default BattleArena;
