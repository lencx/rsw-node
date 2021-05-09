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

### Step1

```bash
# install rsw
npm i -D rsw-node

# or
yarn add -D rsw-node
```

### Step2

* Create `.rswrc.json` in the project root path.
* `root`: The default is the project root path, which supports customization, but cannot exceed the project root path.
* `crates` and [[vite-plugin-rsw]: plugin options](https://github.com/lencx/vite-plugin-rsw#plugin-options) configuration is the same

For example:

```json
{
  "root": ".",
  "crates": [
    "@rsw/chasm",
    "@rsw/game-of-life"
  ]
}
```

### Step3

Add `rsw:deploy` to `package.json`

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
+   "rsw:deploy": "rsw && npm run build"
  },
}
```

## License

MIT License © 2021 [lencx](https://github.com/lencx)
