// Electron Forge writes distributables to <outDir>/make/... using its own naming
// convention. This hook copies each installer artifact up into the flat bld/
// directory using the naming convention the project used before migrating to
// Forge (e.g. dayjob_mac_arm-1.2.2.dmg, dayjob_win_x64-1.2.2-setup.exe).
const fs = require('fs');
const path = require('path');

const macArchLabel = {
    arm64: 'arm',
    x64: 'x64'
};

module.exports = async function renameInstallers(forgeConfig, results) {
    const { version } = require('../package.json');
    const targetDir = path.resolve(__dirname, '..', 'bld');
    fs.mkdirSync(targetDir, { recursive: true });

    return results.map((result) => ({
        ...result,
        artifacts: result.artifacts.map((artifactPath) => {
            const base = path.basename(artifactPath);
            let destName = base;

            if (result.platform === 'darwin' && base.endsWith('.dmg')) {
                destName = `dayjob_mac_${macArchLabel[result.arch] || result.arch}-${version}.dmg`;
            } else if (result.platform === 'win32' && base.endsWith('Setup.exe')) {
                destName = `dayjob_win_${result.arch}-${version}-setup.exe`;
            } else if (result.platform === 'win32' && base.endsWith('-full.nupkg')) {
                destName = `dayjob_win_${result.arch}-${version}-full.nupkg`;
            } else if (result.platform === 'win32' && base === 'RELEASES') {
                destName = 'RELEASES';
            }

            const destPath = path.join(targetDir, destName);
            fs.renameSync(artifactPath, destPath);
            return destPath;
        })
    }));
};
