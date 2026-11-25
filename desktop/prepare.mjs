import fs from 'node:fs';
import path from 'node:path';

const packagePath = path.resolve('package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

if (!pkg.scripts?.build) {
    throw new Error('build スクリプトがありません。');
}

pkg.main = 'desktop/main.cjs';
pkg.description = pkg.description || 'NEiN 防災 — リアルタイム地震情報・緊急地震速報・気象情報モニター';
pkg.author = pkg.author || 'IDIO';

pkg.scripts['desktop:start'] = 'electron .';

pkg.scripts['desktop:build'] =
    'npm run build -- --base=./ && electron-builder --config desktop/electron-builder.yml --win nsis portable --x64 --publish never';

pkg.scripts['desktop:build:arm64'] =
    'npm run build -- --base=./ && electron-builder --config desktop/electron-builder.yml --win nsis portable --arm64 --publish never';

pkg.devDependencies = pkg.devDependencies || {};
pkg.devDependencies.electron = 'latest';
pkg.devDependencies['electron-builder'] = 'latest';

fs.writeFileSync(
    packagePath,
    JSON.stringify(pkg, null, 2) + '\n',
    'utf8'
);

console.log('NEiN Desktop: package.json を設定しました。');
