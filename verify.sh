#!/usr/bin/env bash
# One-command verification: extract inline game script, syntax-check, run smoke harness.
set -euo pipefail
cd "$(dirname "$0")"

# 1) Extract the inline (src-less) <script> block out of the HTML to /tmp/game.js
node -e '
const fs=require("fs");
const html=fs.readFileSync("hillbilly-rocket-league.html","utf8");
const re=/<script(\b[^>]*)>([\s\S]*?)<\/script>/gi;
let m, out=null;
while((m=re.exec(html))){ if(!/\bsrc=/i.test(m[1])) out=m[2]; }
if(!out){ console.error("no inline script found"); process.exit(1); }
fs.writeFileSync("/tmp/game.js", out);
console.log("extracted inline script:", out.length, "chars");
'

# 2) Syntax check
echo "== node --check =="
node --check /tmp/game.js && echo "SYNTAX OK"

# 3) Headless smoke test (simulates a full match with stubbed THREE/DOM)
echo "== smoke harness =="
node hillbilly-rl-test-harness.js
