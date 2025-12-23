"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { login, resetPassword } from "./actions";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await login(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  async function handleForgotPassword() {
    const email = (document.getElementById("email") as HTMLInputElement)?.value;

    if (!email) {
      setError("Please enter your email address first.");
      return;
    }

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await resetPassword(email);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setSuccess("Password reset link sent! Check your email.");
      }
    });
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="max-w-[450px] mx-auto px-8 py-8 flex-1 flex flex-col justify-center">
        {/* Header */}
        <header className="text-center py-6">
          <Link href="/">
            <Image
              src="/images/logo.png"
              alt="Nexus Growth Partners"
              width={400}
              height={70}
              className="mx-auto max-w-[280px] sm:max-w-[360px] h-auto"
              priority
            />
          </Link>
        </header>

        {/* Login Card */}
        <div className="bg-white/[0.03] border border-white/10 rounded-lg p-8 mt-4 animate-fade-in">
          <h1 className="text-xl font-semibold text-center mb-6">
            Client Portal
          </h1>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-300 px-4 py-3 rounded mb-4 text-sm">
              {success}
            </div>
          )}

          <form action={handleSubmit}>
            <div className="mb-5">
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2 opacity-80"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="you@company.com"
                required
                autoComplete="email"
                className="w-full px-4 py-3.5 bg-white/5 border border-white/15 rounded text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 focus:bg-white/[0.08] transition-colors"
              />
            </div>

            <div className="mb-5">
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2 opacity-80"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="w-full px-4 py-3.5 bg-white/5 border border-white/15 rounded text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 focus:bg-white/[0.08] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-4 bg-white text-black font-semibold rounded hover:bg-gray-100 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none mt-2"
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="text-center mt-4">
            <button
              onClick={handleForgotPassword}
              disabled={isPending}
              className="text-white/50 text-sm hover:text-white/80 transition-colors"
            >
              Forgot password?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
