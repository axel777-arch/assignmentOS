"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { signIn, signUp } from "@/lib/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [registering, setRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setMessage(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (registering) await signUp(username, password, displayName || username, email || undefined);
      else await signIn(username, password);
      router.replace("/dashboard");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  function handleGoogleLogin() {
    const backendApi = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    window.location.href = `${backendApi}/api/auth/google`;
  }

  return (
    <main className="auth-page">
      <Link className="brand auth-brand" href="/">
        <span className="brand-title">assignmentOS</span>
      </Link>
      <section className="auth-panel">
        <div className="eyebrow">STUDENT WORKSPACE</div>
        <h1>{registering ? "Create your workspace." : "Welcome back."}</h1>
        <p className="muted-copy">
          {registering ? "Choose a username and password to get started." : "Sign in with your student username or Google account."}
        </p>

        <button type="button" className="google-auth-button" onClick={handleGoogleLogin}>
          <svg width="18" height="18" viewBox="0 0 24 24">
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
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Sign in with Google
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "14px 0", color: "var(--muted)", fontSize: "10px" }}>
          <div style={{ flex: 1, height: "1px", background: "var(--line)" }} />
          <span>OR</span>
          <div style={{ flex: 1, height: "1px", background: "var(--line)" }} />
        </div>

        <form className="create-form" onSubmit={submit}>
          {registering && <Input id="display-name" label="Your name" autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />}
          <Input id="username" label="Username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} minLength={3} maxLength={32} required />
          {registering && <Input id="email" label="Email (optional)" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />}
          <Input id="password" label="Password" type="password" autoComplete={registering ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} maxLength={72} required />
          {message && <p className="field-error" role="alert">{message}</p>}
          <Button variant="primary" type="submit" disabled={busy}>{busy ? "Please wait…" : registering ? "Create account" : "Sign in"}</Button>
        </form>

        <button className="auth-switch" type="button" onClick={() => { setRegistering((value) => !value); setMessage(""); }}>
          {registering ? "Already have an account? Sign in" : "New to AssignmentOS? Create an account"}
        </button>
      </section>
    </main>
  );
}
