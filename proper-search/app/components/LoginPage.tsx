"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type Props = {
  onLogin: () => void;
};

type AuthMode = "login" | "signup" | "forgot";

export default function LoginPage({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        toast.success("Welcome back!");
        onLogin();
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    }
    
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        toast.success("Account created! Please check your email to verify.");
        setMode("login");
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    }
    
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message);
        setIsLoading(false);
        return;
      }

      toast.success("Password reset email sent! Check your inbox.");
      setMode("login");
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    }
    
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}`,
        },
      });

      if (error) {
        toast.error(error.message);
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    }
    
    setIsLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (mode === "login") {
      handleLogin(e);
    } else if (mode === "signup") {
      handleSignup(e);
    } else {
      handleForgotPassword(e);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop"
          alt="Modern Florida luxury home"
          fill
          className="object-cover"
          priority
        />
        {/* Dark overlay with gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60" />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="backdrop-blur-md bg-white/10 rounded-3xl shadow-2xl p-8 border border-white/20 ring-1 ring-white/10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="mb-3">
              <Image
                src="/proper-search-logo.png"
                alt="ProperSearch"
                width={220}
                height={107}
                className="drop-shadow-lg"
                priority
              />
            </div>
            <p className="text-sm text-white/70">
              {mode === "login" && "Welcome back"}
              {mode === "signup" && "Create your account"}
              {mode === "forgot" && "Reset your password"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-12 px-4 bg-white/10 backdrop-blur-sm border-white/20 rounded-xl text-white placeholder:text-white/50 focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-white/20 transition-all"
                  required
                />
              </div>
            )}
            
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 px-4 bg-white/10 backdrop-blur-sm border-white/20 rounded-xl text-white placeholder:text-white/50 focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-white/20 transition-all"
                required
              />
            </div>
            
            {mode !== "forgot" && (
              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 px-4 bg-white/10 backdrop-blur-sm border-white/20 rounded-xl text-white placeholder:text-white/50 focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-white/20 transition-all"
                  required
                  minLength={6}
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-lg shadow-primary/40 hover:shadow-primary/60 hover:scale-[1.02] transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Please wait...</span>
                </div>
              ) : (
                <>
                  {mode === "login" && "Login"}
                  {mode === "signup" && "Create Account"}
                  {mode === "forgot" && "Send Reset Link"}
                </>
              )}
            </Button>
          </form>

          {mode !== "forgot" && (
            <>
              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-transparent text-white/50">or</span>
                </div>
              </div>

              {/* Google Sign In */}
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full h-12 bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 rounded-xl font-medium text-white transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>
            </>
          )}

          {/* Forgot Password / Back to Login */}
          <div className="text-center mt-6">
            {mode === "login" && (
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                Forgot password?
              </button>
            )}
            {mode === "forgot" && (
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                Back to login
              </button>
            )}
          </div>

          {/* Toggle Login/Signup */}
          <div className="text-center mt-4 pt-4 border-t border-white/10">
            {mode === "login" && (
              <span className="text-sm text-white/60">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-primary font-semibold hover:text-primary/80 transition-colors"
                >
                  Sign up
                </button>
              </span>
            )}
            {(mode === "signup" || mode === "forgot") && (
              <span className="text-sm text-white/60">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-primary font-semibold hover:text-primary/80 transition-colors"
                >
                  Log in
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/80 text-sm mt-6 drop-shadow-lg">
          Tampa Bay's Premier Property Search Platform
        </p>
      </div>
    </div>
  );
}
