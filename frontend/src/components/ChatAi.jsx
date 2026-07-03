import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import axiosClient from "../utils/axiosClient";
import { Send, Bot, User } from 'lucide-react';

function ChatAi({ problem }) {
    const [messages, setMessages] = useState([
        { role: 'model', parts: [{ text: "Hi, I am your DSA tutor. I can help you understand this problem, suggest optimal approaches, review your code, or explain complexities. How can I help you today?" }] }
    ]);
    const [loadingAi, setLoadingAi] = useState(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loadingAi]);

    // Safety check in case problem isn't loaded yet
    if (!problem) {
        return (
            <div className="flex items-center justify-center p-8 glass-panel rounded-2xl h-[450px]">
                <div className="text-center">
                    <span className="loading loading-spinner loading-md text-primary mb-2"></span>
                    <p className="text-slate-400 text-sm">Loading problem context...</p>
                </div>
            </div>
        );
    }

    const onSubmit = async (data) => {
        const userMsg = { role: 'user', parts: [{ text: data.message }] };
        const updatedMessages = [...messages, userMsg];
        
        // Optimistically update the UI with user's message
        setMessages(updatedMessages);
        setLoadingAi(true);
        reset();

        try {
            const response = await axiosClient.post("/ai/chat", {
                messages: updatedMessages,
                title: problem.title,
                description: problem.description,
                testCases: problem.visibleTestCases,
                startCode: problem.startCode
            });

            setMessages(prev => [...prev, { 
                role: 'model', 
                parts: [{ text: response.data.message }] 
            }]);
        } catch (error) {
            console.error("API Error:", error);
            setMessages(prev => [...prev, { 
                role: 'model', 
                parts: [{ text: "Sorry, I ran into an error while generating a response. Please try again." }] 
            }]);
        } finally {
            setLoadingAi(false);
        }
    };

    return (
        <div className="flex flex-col glass-panel rounded-2xl border border-white/5 h-[500px] overflow-hidden">
            {/* Header info */}
            <div className="px-4 py-3 bg-slate-950/40 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                        <Bot className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div>
                        <h4 className="text-xs font-semibold text-white leading-none">DSA AI Assistant</h4>
                        <span className="text-[10px] text-slate-400">Gemini-3.5-Flash</span>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] font-medium text-slate-400">Online</span>
                </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => {
                    const isUser = msg.role === "user";
                    return (
                        <div 
                            key={index} 
                            className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                        >
                            {/* Assistant Avatar */}
                            {!isUser && (
                                <div className="p-1.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 self-start mt-0.5">
                                    <Bot className="h-3.5 w-3.5 text-indigo-400" />
                                </div>
                            )}

                            {/* Message Bubble */}
                            <div 
                                className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm text-sm leading-relaxed ${
                                    isUser 
                                    ? 'bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white rounded-tr-none' 
                                    : 'glass-card text-slate-100 rounded-tl-none border border-white/5'
                                }`}
                            >
                                <p className="whitespace-pre-wrap">{msg.parts[0].text}</p>
                            </div>

                            {/* User Avatar */}
                            {isUser && (
                                <div className="p-1.5 bg-slate-800 rounded-xl border border-white/5 self-start mt-0.5">
                                    <User className="h-3.5 w-3.5 text-slate-300" />
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Thinking Indicator */}
                {loadingAi && (
                    <div className="flex gap-2.5 justify-start">
                        <div className="p-1.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 self-start mt-0.5">
                            <Bot className="h-3.5 w-3.5 text-indigo-400" />
                        </div>
                        <div className="glass-card text-slate-400 rounded-2xl rounded-tl-none px-4 py-3.5 border border-white/5 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form 
                onSubmit={handleSubmit(onSubmit)} 
                className="p-3 bg-slate-950/40 border-t border-white/5"
            >
                <div className="relative flex items-center">
                    <input 
                        placeholder={loadingAi ? "Tutor is thinking..." : "Ask me anything about this DSA problem..."} 
                        className="glass-input w-full pl-4 pr-12 py-3 rounded-xl text-sm" 
                        disabled={loadingAi}
                        autoComplete="off"
                        {...register("message", { required: true, minLength: 2 })}
                    />
                    <button 
                        type="submit" 
                        className={`absolute right-2 p-2 rounded-lg text-slate-400 hover:text-white transition-colors ${loadingAi ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={loadingAi}
                    >
                        <Send size={16} />
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ChatAi;