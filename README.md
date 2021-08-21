# rsw-node

[![npm](https://img.shields.io/npm/v/rsw-node.svg)](https://www.npmjs.com/package/rsw-node)
[![npm downloads](https://img.shields.io/npm/dm/rsw-node.svg)](https://npmjs.org/package/rsw-node)
[![chat](https://img.shields.io/badge/chat-discord-blue?style=flat&logo=discord)](https://discord.gg/euyYWXTwmk)

[![Rust](https://img.shields.io/badge/-Rust-DEA584?style=flat&logo=rust&logoColor=000000)](https://www.rust-lang.org)
[![WebAssembly](https://img.shields.io/badge/-WebAssembly-654FF0?style=flat&logo=webassembly&logoColor=ffffff)](https://webassembly.org)

`wasm-pack build` executed in remote deployment, use with [vite-plugin-rsw](https://github.com/lencx/vite-plugin-rsw).

## Pre-installed

* [rust](https://www.rust-lang.org/learn/get-started)
* [nodejs](https://nodejs.org)
* [wasm-pack](https://github.com/rustwasm/wasm-pack): `npm install -g wasm-pack`
* [vite-plugin-rsw](https://github.com/lencx/vite-plugin-rsw): `npm install -D vite-plugin-rsw`

## Get Started

```bash
# rsw -h: command help
# You can use the `rsw` command alone
npm install -g rsw-node
```

<img width="450" src="https://github.com/lencx/rsw-node/raw/main/assets/rsw-cmd-help.png" alt="rsw cmd help" />

<img width="640" src="https://github.com/lencx/rsw-node/raw/main/assets/rsw-cmd.png" alt="rsw cmd" />

![build](https://github.com/lencx/rsw-node/raw/main/assets/rsw-build.png)

## Usage

```bash
# install rsw
npm i -D rsw-node

# or
yarn add -D rsw-node
```

```bash
Usage:

step1: create .rsw.json in the project root path.

step2: edit .rsw.json
crates - package name, support npm organization
{
  "crates": []
}

step3: edit package.json
{
  "scripts": {
    "rsw:build": "rsw && npm run build"
  }
}
```

For example:

```jsonc
// .rsw.json
{
  "crates": [
    "@rsw/chasm", // npm org
    "game-of-life", // npm package
  ]
}
```

```jsonc
// package.json
{
  // ...
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
+   "rsw:build": "rsw && npm run build"
  }
}
```

Use `DEBUG=rsw:cmd` to enable [debug](https://github.com/visionmedia/debug) mode

## License

MIT License © 2021 [lencx](https://github.com/lencx)
