"use client";

import { useState } from "react";
import { signIn, signUp, signOut, useSession } from "../lib/auth-client";
import {
  User,
  Mail,
  Lock,
  Shield,
  Trophy,
  Swords,
  LogOut,
  Loader2,
} from "lucide-react";

import {
  GamePanel,
  GameButton,
  GameTabs,
  GameBadge,
  GameAlert,
  HazardStripe,
  GameInput,
  GameProgressBar,
} from "../components/game-ui";

type AuthMode = "sign-in" | "sign-up";

const HomePage = () => {
  const { data: session, isPending } = useSession();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "sign-up") {
        const { error: signUpError } = await signUp.email({
          name,
          email,
          password,
        });
        if (signUpError) {
          setError(signUpError.message ?? "Sign-up failed");
          return;
        }
      } else {
        const { error: signInError } = await signIn.email({
          email,
          password,
        });
        if (signInError) {
          setError(signInError.message ?? "Invalid credentials");
          return;
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleToggleMode = () => {
    setMode(mode === "sign-in" ? "sign-up" : "sign-in");
    setError("");
  };

  /* ---- Loading ---- */
  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-game-cream-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-[3px] border-game-navy rounded-sm bg-game-amber flex items-center justify-center game-shadow">
            <Shield size={24} className="text-game-navy animate-pulse" />
          </div>
          <div className="flex items-center gap-2 text-game-navy font-bold uppercase text-sm">
            <Loader2 size={16} className="animate-spin" />
            Loading...
          </div>
        </div>
      </div>
    );
  }

  /* ---- Authenticated: Profile ---- */
  if (session?.user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 bg-game-cream-dark relative">
        {/* Background texture */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%231B2838' fill-opacity='1'%3E%3Cpath d='M5 0h1L0 5V4zM6 5v1H5z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-12 w-12 border-[3px] border-game-navy rounded-sm bg-game-amber flex items-center justify-center game-shadow">
            <Swords size={24} className="text-game-navy" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-game-navy tracking-tight uppercase">
              Clash of DSA
            </h1>
            <p className="text-[10px] font-bold text-game-navy/50 uppercase tracking-widest">
              1v1 DSA Arena
            </p>
          </div>
        </div>

        {/* Profile Card */}
        <GamePanel
          variant="default"
          hasFold
          hasShadow
          shadowSize="lg"
          className="relative z-10 w-full max-w-sm"
        >
          {/* Top stripe */}
          <HazardStripe variant="warning" height="md" className="-mx-4 -mt-4 mb-4" />

          {/* Avatar */}
          <div className="flex flex-col items-center mb-4">
            <div className="h-20 w-20 border-[3px] border-game-navy rounded-sm bg-game-amber/20 flex items-center justify-center text-3xl font-bold text-game-amber-dark game-shadow-sm mb-3">
              {session.user.name?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <h2 className="text-xl font-bold text-game-navy uppercase">
              {session.user.name}
            </h2>
            <p className="text-xs text-game-navy/50 font-bold">
              {session.user.email}
            </p>
          </div>

          {/* Stats */}
          <div className="space-y-3 mb-4">
            <GamePanel variant="inset" hasShadow={false} className="border-[2px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy size={16} className="text-game-amber" />
                  <span className="text-xs font-bold text-game-navy/60 uppercase">
                    Rating
                  </span>
                </div>
                <span className="text-lg font-bold text-game-amber-dark">
                  {(session.user as Record<string, unknown>).rating as number ??
                    1200}
                </span>
              </div>
            </GamePanel>

            <GameProgressBar
              value={35}
              max={100}
              variant="xp"
              label="Level Progress"
              showValue
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <GameButton
              variant="primary"
              size="md"
              className="flex-1"
              onClick={() => (window.location.href = "/dashboard")}
            >
              <Swords size={14} />
              Dashboard
            </GameButton>
            <GameButton
              variant="danger"
              size="md"
              onClick={handleSignOut}
            >
              <LogOut size={14} />
              Sign Out
            </GameButton>
          </div>

          {/* Bottom stripe */}
          <HazardStripe variant="warning" height="md" className="-mx-4 -mb-4 mt-4" />
        </GamePanel>
      </div>
    );
  }

  /* ---- Auth Form ---- */
  const authTabs = [
    { id: "sign-in", label: "Login" },
    { id: "sign-up", label: "Register" },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 bg-game-cream-dark relative">
      {/* Background texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%231B2838' fill-opacity='1'%3E%3Cpath d='M5 0h1L0 5V4zM6 5v1H5z'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="h-12 w-12 border-[3px] border-game-navy rounded-sm bg-game-amber flex items-center justify-center game-shadow">
          <Swords size={24} className="text-game-navy" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-game-navy tracking-tight uppercase">
            Clash of DSA
          </h1>
          <p className="text-[10px] font-bold text-game-navy/50 uppercase tracking-widest">
            1v1 DSA Arena
          </p>
        </div>
      </div>

      {/* Auth Card */}
      <GamePanel
        variant="default"
        hasShadow
        shadowSize="lg"
        className="relative z-10 w-full max-w-md !p-0 overflow-hidden"
      >
        {/* Tabs: Login / Register */}
        <GameTabs
          tabs={authTabs}
          activeTab={mode}
          onTabChange={(id) => {
            setMode(id as AuthMode);
            setError("");
          }}
        />

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          {/* Sign-up: Name field */}
          {mode === "sign-up" && (
            <GameInput
              label="Name"
              icon={<User size={16} />}
              placeholder="Your name"
              value={name}
              onChange={setName}
              autoComplete="name"
              required
            />
          )}

          {/* Email */}
          <GameInput
            label="Email"
            icon={<Mail size={16} />}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            required
          />

          {/* Password */}
          <GameInput
            label="Password"
            icon={<Lock size={16} />}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={setPassword}
            state={error ? "error" : "default"}
            autoComplete={
              mode === "sign-in" ? "current-password" : "new-password"
            }
            required
            minLength={8}
          />

          {/* Error */}
          {error && (
            <GameAlert variant="error" message={error} />
          )}

          {/* Submit */}
          <GameButton
            variant="primary"
            size="lg"
            type="submit"
            disabled={loading}
            className="w-full mt-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Please wait...
              </>
            ) : mode === "sign-in" ? (
              "Login"
            ) : (
              "Register"
            )}
          </GameButton>
        </form>

        {/* Footer toggle */}
        <div className="border-t-[2px] border-game-navy px-6 py-3 bg-game-cream-dark text-center">
          <span className="text-xs text-game-navy/50 font-bold">
            {mode === "sign-in"
              ? "Don't have an account? "
              : "Already have an account? "}
          </span>
          <button
            type="button"
            onClick={handleToggleMode}
            tabIndex={0}
            aria-label={
              mode === "sign-in" ? "Switch to sign up" : "Switch to sign in"
            }
            className="text-xs font-bold text-game-amber-dark hover:text-game-amber underline-offset-2 hover:underline cursor-pointer"
          >
            [ {mode === "sign-in" ? "Sign Up" : "Sign In"} ]
          </button>
        </div>

        {/* Bottom stripe */}
        <HazardStripe variant="warning" height="sm" />
      </GamePanel>

      {/* Continue as guest */}
      <button
        type="button"
        onClick={() => (window.location.href = "/dashboard")}
        tabIndex={0}
        aria-label="Continue as guest"
        className="relative z-10 text-xs font-bold text-game-navy/40 hover:text-game-amber-dark cursor-pointer transition-colors"
      >
        [ Continue as guest ]
      </button>
    </div>
  );
};

export default HomePage;
