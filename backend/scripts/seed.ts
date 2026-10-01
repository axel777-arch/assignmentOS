import { pool } from "../src/config/database";
import { createAssignment } from "../src/services/assignment.service";

async function seed() {
  const userId = process.env.DEV_USER_ID || "00000000-0000-4000-8000-000000000001";
  const existing = await pool.query("SELECT id FROM assignments WHERE user_id = $1 LIMIT 1", [userId]);
  if (!existing.rowCount) await createAssignment(userId, {
    title: "Electrolysis and its applications", course: "Chemistry 201", subject: "CHEMISTRY · LAB REPORT",
    due: new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10), targetWords: 1350, minWords: 1200, maxWords: 1500, sourceTarget: 4,
    instructions: "Write a 1,200 to 1,500 word chemistry report on electrolysis. Explain the process, discuss Faraday's laws, describe two applications, and use at least four sources.",
    requirements: [
      { id: "r-topic", text: "Explain the electrolysis process", kind: "concept", status: "not_checked" },
      { id: "r-laws", text: "Discuss Faraday's laws", kind: "concept", status: "not_checked" },
      { id: "r-apps", text: "Describe two applications", kind: "concept", status: "not_checked" },
      { id: "r-sources", text: "Use at least 4 identifiable sources", kind: "sources", status: "not_checked" },
      { id: "r-length", text: "Write between 1,200 and 1,500 words", kind: "length", status: "not_checked" }
    ], draft: "<h2>Electrolysis: an introduction</h2><p>Electrolysis uses an external electrical current to drive a chemical reaction that would not occur spontaneously.</p><h3>Faraday's laws</h3><p>The amount of substance produced at an electrode is proportional to the total electric charge passed through the cell.</p><h3>Applications</h3><p>Electroplating deposits a thin metal coating on an object.</p><h3>References</h3><p>Faraday, M. Experimental Researches in Electricity.</p>"
  });
  console.log("Demo assignment is ready.");
}

seed().catch((error) => {
  console.error("Demo seed failed.", error);
  process.exitCode = 1;
}).finally(() => pool.end());
