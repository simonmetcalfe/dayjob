// electron-winstaller's own postinstall (vendor/../script/select-7z-arch.js) copies the
// 7-Zip binary matching the *host* architecture (os.arch()) into vendor/7z.exe(.dll).
// That's wrong for our use case: we always run 7z.exe through Wine to build a Windows
// x64 installer, so on Apple Silicon hosts it wrongly selects the arm64 (Windows-on-ARM)
// binary, which Wine's x64 build can't load ("ShellExecuteEx failed: Bad format").
// Force the x64 variant regardless of host arch before every Windows package/make run.
const fs = require('fs');
const path = require('path');

const vendorDir = path.join(__dirname, '..', 'node_modules', 'electron-winstaller', 'vendor');

for (const ext of ['exe', 'dll']) {
    const src = path.join(vendorDir, `7z-x64.${ext}`);
    const dest = path.join(vendorDir, `7z.${ext}`);

    if (!fs.existsSync(src)) {
        console.warn(`fix-electron-winstaller-7z: ${src} not found, skipping`);
        continue;
    }

    fs.copyFileSync(src, dest);
}
