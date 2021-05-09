#!/usr/bin/env node

const fs = require('fs');
const chalk = require('chalk');
const path = require('path');
const os = require('os');
const which = require('which');
const debug = require('debug')('rsw:cmd');
const argv = require('minimist')(process.argv.slice(2));
const spawnSync = require('child_process').spawnSync;

const isWin = os.platform() === 'win32';
const wpCmd = () => (isWin ? 'wasm-pack.exe' : 'wasm-pack');
const getCrateName = (crate) => (typeof crate === 'object' ? crate.name : crate);

async function init() {
  const _argv0 = argv._[0];

  if (!_argv0) {
    if (argv.h || argv.help) {
      cmdHelp();
      process.exit(1);
    }
  }

  debug('start');
  checkWpCmd();

  let cratesMap = new Map();

  debug(`[process.cwd] ${process.cwd()}`)

  const hasRswrc = fs.existsSync('.rswrc.json');
  if (hasRswrc) {
    debug('`.rswrc.json` file exists');
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

      const cmdCwd = path.resolve(process.cwd(), rcJSON.root || '.', rswCrate);

      debug(`[wasm-pack build](${rswCrate}) ${args.join(' ')}`);
      debug(`[wasm-pack cwd](${rswCrate}) ${cmdCwd}`);

      let p = spawnSync(`${wpCmd()}`, args, {
        shell: true,
        cwd: cmdCwd,
        stdio: 'inherit',
      });

      if (p.status !== 0) {
        debug(`[wasm-pack build error](${rswCrate}) ${args.join(' ')}`);
        console.log(chalk.red(`[rsw::cmd::error] wasm-pack for crate ${rswCrate} failed.`));

        throw p.error;
      }

      debug(`[wasm-pack build success](${rswCrate}) ${outDir}`);
      cratesMap.set(rswCrate, outDir)
    });
  } else {
    debug('`.rswrc.json` file does not exist');
    console.log(
      chalk.bold.red('[rsw::cmd::config]'),
      chalk.red('missing `.rswrc.json` file'),
    );
    cmdHelp()
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
  const wasmPack = which.sync(wpCmd(), { nothrow: true });

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
  step1: create ${chalk.green('.rswrc.json')} in the project root path.
  step2: .rswrc.json
      ${chalk.green(`{
        "root": ".",
        "crates": []
      }`)}
      ${chalk.yellow('root')}: The default is the project root path, which supports customization,
            but cannot exceed the project root path.
      ${chalk.yellow('crates')}: and \`[vite-plugin-rsw]: plugin options\` configuration is the same.
            ${chalk.cyan('https://github.com/lencx/vite-plugin-rsw#plugin-options')}
  step3: package.json
      ${chalk.green(`{
        "scripts": {
          "rsw:deploy": "rsw && npm run build"
        }
      }`)}`);
}