import assert from "node:assert/strict";
import test from "node:test";
import jwt from "jsonwebtoken";
import { loginSchema } from "@/validators/auth.validator";
import { env } from "@/config/env";
import { verifySessionToken } from "@/services/auth.service";
import { hashPassword, verifyPassword } from "@/services/password.service";
import { sanitizeDraft } from "@/utils/sanitize";

test("passwords are stored as bcrypt hashes and verified without plaintext storage", async () => {
  const password = "study-with-evidence-2026";
  const hash = await hashPassword(password);
  assert.notEqual(hash, password);
  assert.match(hash, /^\$2[aby]\$/);
  assert.equal(await verifyPassword(password, hash), true);
  assert.equal(await verifyPassword("incorrect-password", hash), false);
});

test("login credentials require a username and a ten-character password", () => {
  assert.equal(loginSchema.safeParse({ username: "student_1", password: "long-password" }).success, true);
  assert.equal(loginSchema.safeParse({ username: "ab", password: "long-password" }).success, false);
  assert.equal(loginSchema.safeParse({ username: "student_1", password: "short" }).success, false);
});

test("session tokens require the AssignmentOS issuer and carry the student id", () => {
  const token = jwt.sign({ username: "student_1" }, env.JWT_SECRET, { subject: "student-id", issuer: "assignmentos", expiresIn: 60 });
  assert.equal(verifySessionToken(token).sub, "student-id");
  const wrongIssuer = jwt.sign({ username: "student_1" }, env.JWT_SECRET, { subject: "student-id", issuer: "other", expiresIn: 60 });
  assert.throws(() => verifySessionToken(wrongIssuer));
});

test("draft sanitizer preserves editor formatting but strips scripts and event handlers", () => {
  const clean = sanitizeDraft('<h2 onclick="alert(1)">Plan</h2><script>alert(1)</script><p><img src=x onerror=alert(1)>Evidence</p>');
  assert.match(clean, /<h2>Plan<\/h2>/);
  assert.match(clean, /<p>Evidence<\/p>/);
  assert.doesNotMatch(clean, /script|onclick|onerror|<img/i);
});
