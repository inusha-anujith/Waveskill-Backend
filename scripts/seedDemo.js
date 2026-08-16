const { spawnSync } = require('child_process');
const path = require('path');

const scripts = ['seedAdmin.js', 'seedUsers.js', 'seedLeaves.js', 'seedAttendance.js'];

let allOk = true;
for (const s of scripts) {
    console.log(`\n=== Running ${s} ===`);
    const r = spawnSync('node', [path.join(__dirname, s)], { stdio: 'inherit' });
    if (r.status !== 0) {
        allOk = false;
        console.error(`${s} failed`);
    }
}
process.exit(allOk ? 0 : 1);
