"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn, signUp } from "@/lib/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [registering, setRegistering] = useState(false);
  const [username, setUsername] = useState(""); const [displayName, setDisplayName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      if (registering) await signUp(username, password, displayName || username, email || undefined);
      else await signIn(username, password);
      router.replace("/dashboard");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Authentication failed."); }
    finally { setBusy(false); }
  }
  return <main className="auth-page"><Link className="brand auth-brand" href="/"> <span className="brand-mark">A</span> assignmentOS</Link><section className="auth-panel"><div className="eyebrow">STUDENT WORKSPACE</div><h1>{registering ? "Create your workspace." : "Welcome back."}</h1><p className="muted-copy">{registering ? "Choose a username and password to get started." : "Sign in with your student username."}</p><form className="create-form" onSubmit={submit}>{registering && <Input id="display-name" label="Your name" autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />}<Input id="username" label="Username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} minLength={3} maxLength={32} required />{registering && <Input id="email" label="Email (optional)" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />}<Input id="password" label="Password" type="password" autoComplete={registering ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} minLength={10} maxLength={72} required />{message && <p className="field-error" role="alert">{message}</p>}<Button variant="primary" type="submit" disabled={busy}>{busy ? "Please wait…" : registering ? "Create account" : "Sign in"}</Button></form><button className="auth-switch" type="button" onClick={() => { setRegistering((value) => !value); setMessage(""); }}>{registering ? "Already have an account? Sign in" : "New to AssignmentOS? Create an account"}</button></section></main>;
}
