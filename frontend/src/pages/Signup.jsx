import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, NavLink } from 'react-router';
import { registerUser } from '../authSlice';
import { Code2, Terminal, Tv, MessageSquare, User, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

const signupSchema = z.object({
  firstName: z.string().min(3, "First name must be at least 3 characters"),
  emailId: z.string().email("Invalid Email Address"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(signupSchema) });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = (data) => {
    dispatch(registerUser(data));
  };

  return (
    <div className="min-h-screen flex bg-[#07090e] text-slate-200 font-sans relative overflow-hidden">
      {/* Dynamic Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none animate-blob-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none animate-blob-medium"></div>

      {/* Left Panel - Feature Panel (Hidden on mobile/tablet) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 overflow-hidden border-r border-white/5">
        {/* Background Image & Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity scale-105"
          style={{ backgroundImage: `url('/coding-bg.png')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#07090e] via-[#07090e]/95 to-indigo-950/90"></div>
        
        {/* Left Side Content */}
        <div className="relative z-10 w-full max-w-lg">
          {/* Logo Brand */}
          <div className="flex items-center gap-3.5 mb-10 animate-fade-in-up">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-2xl shadow-lg shadow-indigo-500/25 border border-white/10">
              <Code2 className="h-7 w-7 text-white" />
            </div>
            <span className="text-3xl font-extrabold tracking-wider bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Coding Arena
            </span>
          </div>

          <h2 className="text-4xl font-extrabold leading-tight mb-8 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent animate-fade-in-up [animation-delay:100ms]">
            Elevate Your Coding Skills<br />to the Next Level
          </h2>

          {/* Feature Lists */}
          <div className="space-y-5 animate-fade-in-up [animation-delay:200ms]">
            <div className="flex items-start gap-4 p-5 rounded-2xl glass-card hover:bg-white/5 transition-all duration-300 hover:-translate-y-1 hover:border-white/10 group">
              <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 group-hover:border-indigo-500/40 group-hover:bg-indigo-500/20 transition-all duration-300">
                <Terminal className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <h4 className="font-semibold text-lg text-white group-hover:text-indigo-300 transition-colors">Online Interactive IDE</h4>
                <p className="text-sm text-slate-400 mt-1 leading-relaxed">Write, compile, and run code in JavaScript, C++, and Java with instant sandbox feedback.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 rounded-2xl glass-card hover:bg-white/5 transition-all duration-300 hover:-translate-y-1 hover:border-white/10 group">
              <div className="p-3 bg-pink-500/10 rounded-xl border border-pink-500/20 group-hover:border-pink-500/40 group-hover:bg-pink-500/20 transition-all duration-300">
                <Tv className="h-5 w-5 text-pink-400" />
              </div>
              <div>
                <h4 className="font-semibold text-lg text-white group-hover:text-pink-300 transition-colors">Cloud-hosted Video Editorials</h4>
                <p className="text-sm text-slate-400 mt-1 leading-relaxed">Stuck on a problem? Watch complete step-by-step video solutions uploaded by experts.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 rounded-2xl glass-card hover:bg-white/5 transition-all duration-300 hover:-translate-y-1 hover:border-white/10 group">
              <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20 group-hover:border-cyan-500/40 group-hover:bg-cyan-500/20 transition-all duration-300">
                <MessageSquare className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <h4 className="font-semibold text-lg text-white group-hover:text-cyan-300 transition-colors">AI-Powered DSA Tutor</h4>
                <p className="text-sm text-slate-400 mt-1 leading-relaxed">Get specialized hints, code reviews, and complexity analysis from our integrated Gemini bot.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form Container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 z-10">
        <div className="w-full max-w-md animate-fade-in-up [animation-delay:150ms]">
          
          {/* Mobile Header */}
          <div className="flex justify-center mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl shadow-md border border-white/10">
                <Code2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-extrabold tracking-wider bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Coding Arena</span>
            </div>
          </div>

          {/* Form Card */}
          <div className="glass-panel rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
            <h2 className="text-3xl font-bold text-center text-white mb-2 tracking-tight">Create Account</h2>
            <p className="text-center text-sm text-slate-400 mb-8">Join Coding Arena to start solving DSA problems</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* First Name Field */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-medium text-slate-300 text-sm">First Name</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    placeholder="John"
                    className={`glass-input w-full pl-11 pr-4 py-3 rounded-xl text-sm ${errors.firstName ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20' : ''}`} 
                    {...register('firstName')}
                  />
                </div>
                {errors.firstName && (
                  <span className="text-red-400 text-xs mt-1.5 flex items-center gap-1.5 animate-fade-in-up">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                    {errors.firstName.message}
                  </span>
                )}
              </div>

              {/* Email Field */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-medium text-slate-300 text-sm">Email Address</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    className={`glass-input w-full pl-11 pr-4 py-3 rounded-xl text-sm ${errors.emailId ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20' : ''}`}
                    {...register('emailId')}
                  />
                </div>
                {errors.emailId && (
                  <span className="text-red-400 text-xs mt-1.5 flex items-center gap-1.5 animate-fade-in-up">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                    {errors.emailId.message}
                  </span>
                )}
              </div>

              {/* Password Field with Toggle */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-medium text-slate-300 text-sm">Password</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={`glass-input w-full pl-11 pr-11 py-3 rounded-xl text-sm ${errors.password ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20' : ''}`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors" 
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <span className="text-red-400 text-xs mt-1.5 flex items-center gap-1.5 animate-fade-in-up">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                    {errors.password.message}
                  </span>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-3"> 
                <button
                  type="submit"
                  className={`w-full py-3.5 px-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(99,102,241,0.25)] hover:shadow-[0_0_30px_rgba(99,102,241,0.45)] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 group ${loading ? 'opacity-85 pointer-events-none' : ''}`}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <span>Sign Up</span>
                      <ArrowRight className="h-4.5 w-4.5 group-hover:translate-x-1 transition-transform duration-200" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Login Redirect */}
            <div className="text-center mt-8 pt-6 border-t border-white/5">
              <span className="text-sm text-slate-400">
                Already have an account?{' '}
                <NavLink to="/login" className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors hover:underline underline-offset-4">
                  Login
                </NavLink>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;