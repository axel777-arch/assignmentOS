import { api } from "@/lib/api";

export async function signIn(username: string, password: string) {
  return api.auth.login({ username, password });
}

export async function signUp(username: string, password: string, displayName: string, email?: string) {
  return api.auth.register({ username, password, displayName, email });
}

export async function signOut() {
  await api.auth.logout();
}
