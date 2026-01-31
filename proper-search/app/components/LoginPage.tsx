"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";

type Props = {
  onLogin: () => void;
};

export default function LoginPage({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate brief loading then login
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 500);
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
        <div className="backdrop-blur-xl bg-white/95 rounded-2xl shadow-2xl p-8 border border-white/20">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="mb-4">
              <Image
                src="/proper-search-logo.png"
                alt="ProperSearch"
                width={64}
                height={64}
                className="drop-shadow-lg"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">ProperSearch</h1>
            <p className="text-sm text-gray-500 mt-1">Property Search Platform</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 px-4 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 px-4 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-lg shadow-primary/30 transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Logging in...</span>
                </div>
              ) : (
                "Login"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-400">or</span>
            </div>
          </div>

          {/* Google Sign In */}
          <Button
            type="button"
            variant="outline"
            onClick={onLogin}
            className="w-full h-12 border-gray-200 hover:bg-gray-50 rounded-xl font-medium transition-all duration-200"
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

          {/* Forgot Password */}
          <div className="text-center mt-6">
            <button
              type="button"
              className="text-sm text-gray-500 hover:text-primary transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="text-center mt-4 pt-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={onLogin}
                className="text-primary font-semibold hover:underline"
              >
                Sign up
              </button>
            </span>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/70 text-sm mt-6">
          Tampa Bay's Premier Property Search Platform
        </p>
      </div>
    </div>
  );
}
