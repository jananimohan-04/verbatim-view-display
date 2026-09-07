import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2, CheckCircle2, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In | Argus CNC Manufacturing ERP" },
      { name: "description", content: "Sign in to access your CNC engineering, production, and costing workspace." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loginSuccess, setLoginSuccess] = useState(false);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage("");

    if (!email.trim()) {
      setErrorMessage("Please enter your email or username");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your password");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await login(email, password, rememberMe);

      if (res.success) {
        setLoginSuccess(true);
        toast.success("Welcome to Argus Manufacturing ERP", {
          description: "Signed in successfully. Redirecting to workspace...",
        });
        setTimeout(() => {
          navigate({ to: "/" });
        }, 600);
      } else {
        setErrorMessage(res.error || "Authentication failed. Please check your credentials.");
        toast.error("Sign in failed", { description: res.error });
      }
    } catch (err: any) {
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#0B1120] text-slate-100 font-sans select-none overflow-x-hidden">
      
      {/* LEFT PANE: PHOTOREALISTIC CNC HERO VISUAL (Hidden on small mobile, visible on lg+) */}
      <div className="relative hidden lg:flex lg:w-[55%] xl:w-[58%] overflow-hidden bg-[#070D1A] flex-col justify-between p-12">
        {/* Background Image with Dark Navy Vignette */}
        <div className="absolute inset-0 z-0">
          <img
            src="/cnc-login-hero.png"
            alt="CNC Manufacturing Facility"
            className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000 ease-out"
          />
          {/* Multi-layer Cinematic Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B1120]/40 via-[#0B1120]/60 to-[#0B1120]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-transparent to-[#0B1120]/80" />
          <div className="absolute inset-0 bg-blue-950/20 mix-blend-overlay" />
        </div>

        {/* Top Floating Badge */}
        <div className="relative z-10 flex items-center">
          <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-blue-500/20 shadow-lg">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider text-slate-200 uppercase">
              Live Telemetry
            </span>
          </div>
        </div>

        {/* Center/Bottom Cinematic Showcase */}
        <div className="relative z-10 space-y-6 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-semibold tracking-wide uppercase">
            <Cpu className="size-3.5" />
            <span>Precision Engineering & Industrial Automation</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Intelligent Control for High-Precision <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-400">CNC Manufacturing</span>
          </h1>

          <p className="text-sm xl:text-base text-slate-300/90 leading-relaxed">
            Synchronize shop floor work orders, 5-axis toolpaths, inventory dispatch, and commercial costing in real time.
          </p>
        </div>

        {/* Bottom Status Bar */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-6">
          <p>© {new Date().getFullYear()} Argus Technologies · All rights reserved.</p>
        </div>
      </div>

      {/* RIGHT PANE: MODERN PREMIUM LOGIN FORM */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-16 xl:p-20 bg-[#0B1120] relative z-10">
        
        {/* Mobile Header Banner */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-white p-1.5 shadow-md border border-slate-700/60 flex items-center justify-center">
              <img src="/argus-logo.png" alt="Argus" className="size-full object-contain" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white block leading-none">Argus</span>
              <span className="text-[10px] text-blue-400 tracking-wider uppercase font-semibold">Manufacturing ERP</span>
            </div>
          </div>
        </div>

        {/* Main Form Container */}
        <div className="w-full max-w-md mx-auto my-auto py-8">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Welcome Back</h2>
            <p className="mt-2 text-sm text-slate-400">
              Sign in to access your manufacturing, planning, and accounts portal.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
              <span className="size-1.5 rounded-full bg-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-5">
            {/* Email / Username Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Email or Username
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="admin@argus.com"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 pl-10 bg-slate-900/90 border-slate-700/80 text-white placeholder:text-slate-500 text-sm rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => toast.info("Password Reset", { description: "Please contact your Plant System Administrator to reset your security credentials." })}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pl-10 pr-10 bg-slate-900/90 border-slate-700/80 text-white placeholder:text-slate-500 text-sm rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <Checkbox
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(!!checked)}
                  className="border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded"
                />
                <span className="text-xs text-slate-300">Remember this workstation</span>
              </label>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              disabled={isSubmitting || loginSuccess}
              className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-lg shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : loginSuccess ? (
                <>
                  <CheckCircle2 className="size-4 text-emerald-300" />
                  <span>Authorized · Redirecting...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Plant Portal</span>
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>
        </div>

      </div>

    </div>
  );
}
