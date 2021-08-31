#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const chalk = require('chalk');
const which = require('which');
const debug = require('debug')('rsw:cmd');
const spawnSync = require('child_process').spawnSync;
const argv = require('minimist')(process.argv.slice(2));
const rimraf = require('rimraf');

const isWin = os.platform() === 'win32';
const wpCmd = isWin ? 'wasm-pack.exe' : 'wasm-pack';
const getCrateName = (crate) => (typeof crate === 'object' ? crate.name : crate);

// fix: https://github.com/lencx/vite-plugin-rsw/issues/20#issuecomment-904562812
// ------------------------------------------
// escape a space in a file path in node.js
// normalizePath('/Users/foo bar') // "/Users/foo bar"
const normalizePath = (_path) => `"${_path}"`;

async function init() {
  const _argv0 = argv._[0];

  if (!_argv0) {
    if (argv.h || argv.help) {
      cmdHelp();
      process.exit();
    }
  }

  debug('start');
  debug(`[process.cwd] ${process.cwd()}`)
  checkWpCmd();

  let cratesMap = new Map();

  const hasRswrc = fs.existsSync('.rsw.json');
  if (!hasRswrc) {
    debug('`.rsw.json` file does not exist');
    console.log(
      chalk.bold.red('[rsw::cmd::config]'),
      chalk.red('missing `.rsw.json` file'),
    );
    cmdHelp();
    process.exit();
  }

  const dist = normalizePath(path.join(process.cwd(), '.rsw/crates'));
  rimraf.sync(dist);

  debug('`.rsw.json` file exists');
  const rswrc = fs.readFileSync(`.rsw.json`, 'utf8');
  const rcJSON = JSON.parse(rswrc);

  if (!rcJSON.crates) {
    console.log(
      chalk.bold.red('[rsw::cmd::config]'),
      chalk.red('`.rsw.json` is missing the `crates` field.'),
      chalk.red(`\n\`${JSON.stringify(rcJSON, null, 2)}\`\n`),
    );
    process.exit();
  }

  const crateList = rcJSON.crates.map((i) => getCrateName(i));
  spawnSync(`npm`, ['unlink', '-g', crateList.join(' ')], {
    shell: true,
    cwd: process.cwd(),
    stdio: 'pipe',
  });

  crateList.forEach((rswCrate) => {
    let pkgName, scope, outDir;
    const args = ['build', '--release', '--target', 'web'];

    outDir = getCratePath(rswCrate, dist);

    if (rswCrate.startsWith('@')) {
      const a = rswCrate.split(/@|\//);
      scope = a[1];
      pkgName = `${scope}~${a[2]}`;
    } else {
      pkgName = rswCrate;
    }

    args.push('--out-name', `'${pkgName}'`);
    if (scope) args.push('--scope', `'${scope}'`);
    if (outDir) args.push('--out-dir', `'${outDir}'`);

    const cmdCwd = path.resolve(process.cwd(), rswCrate);

    debug(`[wasm-pack build](${rswCrate}) ${args.join(' ')}`);
    debug(`[wasm-pack cwd](${rswCrate}) ${cmdCwd}`);

    let p = spawnSync(`${wpCmd}`, args, {
      shell: true,
      cwd: cmdCwd,
      stdio: 'inherit',
    });

    if (p.status !== 0) {
      debug(`[wasm-pack build error](${rswCrate}) ${args.join(' ')}`);
      console.log(chalk.red(`[rsw::cmd::error] wasm-pack for crate ${rswCrate} failed.`));
      throw chalk.red(p.error);
    }

    debug(`[wasm-pack build success](${rswCrate}) ${outDir}`);
    cratesMap.set(rswCrate, outDir);
  });

  const cratePaths = Array.from(cratesMap.values()).map(p => `'${p}'`);
  spawnSync(`npm`, ['link', ...cratePaths], {
    shell: true,
    cwd: process.cwd(),
    stdio: 'inherit',
  });

  console.log(chalk.green(`\n[rsw::cmd::link]`));
  cratesMap.forEach((val, key) => {
    console.log(
      chalk.yellow(`  ↳ ${key} `),
      chalk.blue(` ${val} `),
    );
  });
}

init().catch((e) => {
  console.log(e);
});

function getCratePath(crate, root) {
  const _root = path.resolve(root, getCrateName(crate));
  debug(`[crate root] ${_root}`);

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
  const wasmPack = which.sync(wpCmd, { nothrow: true });

  if (!wasmPack) {
    debug('Cannot find `wasm-pack` in your PATH');
    spawnSync(`npm`, ['install', '-g', 'wasm-pack'], {
      shell: true,
      cwd: process.cwd(),
      stdio: 'inherit',
    });
    debug('`wasm-pack` installation complete');
  }
  debug('`wasm-pack` command exists');
}

function cmdHelp() {
  return console.log(`
Command Help:
${chalk.magenta('[rsw]')}: https://github.com/lencx/rsw-node

Usage:

${chalk.bold.yellow`step1:`} create ${chalk.green('.rsw.json')} in the project root path.

${chalk.bold.yellow`step2:`} edit .rsw.json
crates - package name, support npm organization
${chalk.green(`{
  "crates": []
}`)}

${chalk.bold.yellow`step3:`} edit package.json
${chalk.green(`{
  "scripts": {
    "rsw:build": "rsw && npm run build"
  }
}`)}`);
}
