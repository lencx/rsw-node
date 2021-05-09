#!/usr/bin/env node

const fs = require('fs');
const chalk = require('chalk');
const path = require('path');
const os = require('os');
const which = require('which');
const spawnSync = require('child_process').spawnSync;

const isWin = os.platform() === 'win32';
const wpCmd = () => isWin ? 'wasm-pack.exe' : 'wasm-pack';
const getCrateName = (crate) => (typeof crate === 'object' ? crate.name : crate);

async function init() {
  checkWpCmd();

  let cratesMap = new Map();

  const hasRswrc = fs.existsSync('.rswrc.json');
  if (hasRswrc) {
    const rswrc = fs.readFileSync(`.rswrc.json`, 'utf8');
    const rcJSON = JSON.parse(rswrc);

    if (!rcJSON.crates) {
      console.log(
        chalk.bold.red('[rsw::cmd::config]'),
        chalk.red('`.rswrc.json` is missing the `crates` field.'),
        chalk.red(`\n\`${JSON.stringify(rcJSON, null, 2)}\`\n`),
      );
      process.exit();
    }

    rcJSON.crates.forEach(i => {
      let rswCrate, pkgName, scope, outDir;

      const args = ['build', '--release', '--target', 'web'];

      rswCrate = getCrateName(i);
      outDir = getCratePath(i, rcJSON.root || '.');
      if (rswCrate.startsWith('@')) {
        const a = rswCrate.match(/(@.*)\/(.*)/);
        scope = a[1].substring(1);
        pkgName = `${scope}~${a[2]}`;
      } else {
        pkgName = rswCrate;
      }

      args.push('--out-name', pkgName);
      if (scope) args.push('--scope', scope);
      if (outDir) args.push('--out-dir', outDir);

      let p = spawnSync(`${wpCmd()}`, args, {
        shell: true,
        cwd: path.resolve(process.cwd(), rswCrate),
        stdio: 'inherit',
      });

      if (p.status !== 0) {
        throw chalk.red(`[rsw::cmd::error] wasm-pack for crate ${rswCrate} failed.`);
      }

      cratesMap.set(getCrateName(i), outDir)
    });
  } else {
    console.log(
      chalk.bold.red('[rsw::cmd::config]'),
      chalk.red('missing `.rswrc.json` file'),
    );
    process.exit();
  }

  spawnSync(`npm`, ['link', ...Array.from(cratesMap.values())], {
    shell: true,
    cwd: process.cwd(),
    stdio: 'inherit',
  });

  console.log(chalk.green(`\n[rsw::cmd::link]`))
  cratesMap.forEach((val, key) => {
    console.log(
      chalk.yellow(`  ↳ ${key} `),
      chalk.blue(` ${val} `)
    );
  })
}

init().catch((e) => {
  console.log(e);
});

function getCratePath(crate, root) {
  const _root = path.resolve(root, getCrateName(crate));

  if (!_root.startsWith(process.cwd())) {
    console.log(
      chalk.bold.red('[rsw::cmd::error]'),
      chalk.red('Invalid root ~> `root` must be included in the project root path.'),
    );
    process.exit();
  }

  if (typeof crate === 'object' && crate.outDir) {
    if (crate.outDir.startsWith('/')) {
      console.log(
        chalk.bold.red('[rsw::cmd::error]'),
        chalk.red('Invalid outDir ~> Please use relative path.'),
        chalk.red(`\n\`${JSON.stringify(crate, null, 2)}\`\n`),
      );
      process.exit();
    }
    return path.resolve(_root, crate.outDir);
  }
  return path.resolve(_root, 'pkg');
};

function checkWpCmd() {
  const wasmPack = which.sync('wasm-pack', { nothrow: true });
  if (!wasmPack) {
    console.log(
      chalk.bold.red('[rsw::cmd::error]'),
      chalk.red('Cannot find wasm-pack in your PATH. Please make sure wasm-pack is installed.'),
    );
    console.log(
      chalk.bold.gray('[rsw::cmd::INFO]'),
      'wasm-pack install:',
      chalk.green('https://github.com/rustwasm/wasm-pack'),
    );
    process.exit();
  }
}