const { spawnSync } = require("node:child_process");

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const result = spawnSync(npm, ["--prefix", "backend", "run", "seed"], { stdio: "inherit", shell: process.platform === "win32" });
process.exit(result.status ?? 1);
