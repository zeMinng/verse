# Rust 安装与运行 Wasm

## 概要

[WebAssembly (Wasm)](https://webassembly.org) 可将 Rust 编译为浏览器可运行的二进制模块，供 JavaScript 调用。

## 一、安装 Rust（rustup）

[安装 Rust](https://rust-lang.org/zh-CN/tools/install/) 最推荐的方式是使用 rustup：它能统一管理 rustc/cargo 版本，并让你方便地安装额外编译目标（后面编译 Wasm 会用到）。

##### 1.（Windows 可选）设置环境变量（清华镜像）

如果你在 Windows 上安装/更新经常很慢，可以先配置 rustup 的镜像地址：

- 打开环境变量配置（Win + R → 输入 sysdm.cpl → **高级** → **环境变量**）
- 新增系统变量或用户变量：
  ```bash
  RUSTUP_DIST_SERVER=https://mirrors.tuna.tsinghua.edu.cn/rustup
  RUSTUP_UPDATE_ROOT=https://mirrors.tuna.tsinghua.edu.cn/rustup/rustup
  ```

完成后建议**重开终端**再继续安装/更新。

##### 2. 安装 rustup 并验证

::: code-group
```bash [Windows（PowerShell）]
# 下载安装器：rustup-init.exe
# 安装完成后重开一个终端，再验证是否安装成功：
rustc -V
cargo -V
rustup -V
```

```bash [macOS / Linux]
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"

rustc -V
cargo -V
rustup -V
```
:::

## 二、Wasm 编译

### 1. wasm-pack 安装

要在浏览器里跑 Wasm，你至少需要两样东西：一个 **Wasm 编译目标**（让 Rust 能输出 .wasm），以及一个 **打包工具**（把 .wasm + JS glue 组织成前端可直接引用的产物）。

wasm-pack 会帮你把 Rust 库打包成前端可用的产物（包含 `.wasm` 与 JS glue 代码）。

::: code-group
```bash [wasm-pack（推荐）]
cargo install wasm-pack
wasm-pack --version

# 热更新
# 安装 cargo-watch 热更新工具
cargo install cargo-watch
# 命令
cargo watch -s "wasm-pack build --target web --out-dir ./dist/dev --dev"   # 开发模式输出到本地 dist
cargo watch -s "wasm-pack build --target web --out-dir ../src/worker/wasm --dev"  # 或输出到前端项目目录
wasm-pack build --release --target web --out-dir ./dist/pro  # 发布模式
```

```bash [Wasm target]
rustup target add wasm32-unknown-unknown
```
:::

### 2. wasm-pack 编译运行

::: code-group
```bash [创建项目与构建]
# 第一步：创建新项目
mkdir rust-wasm-demo && cd rust-wasm-demo
cargo new --lib hello-wasm
cd hello-wasm

# 构建项目
wasm-pack build --target web
```

```toml [Cargo.toml]
# 第二步：编辑Cargo.toml，加入 wasm-bindgen 依赖，并声明这是 cdylib。
[lib]
crate-type = ["cdylib"]

[dependencies]
wasm-bindgen = "0.2"
```

```rust [src/lib.rs]
/// 第三步
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn greet(name: &str) -> String {
  format!("Hello, {} from Rust/Wasm!", name)
}
```
:::

构建成功后会生成 pkg/ 目录，里面包含：`*.wasm（Wasm 模块）`、`*.js（浏览器侧加载/调用 glue 代码）`。

接下来，写一个最小网页调用它：

::: code-group
```
# 在项目根目录创建 `www/`：
hello-wasm/
  pkg/
  src/
  www/
    index.html
    main.js
```

```html [www/index.html]
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Rust Wasm Demo</title>
  </head>
  <body>
    <h1>Rust Wasm Demo</h1>
    <pre id="out">loading...</pre>
    <script type="module" src="./main.js"></script>
  </body>
</html>
```

```js [www/main.js]
// （注意导入路径要指向 `pkg/` 生成的 JS 文件名）
import init, { greet } from "../pkg/hello_wasm.js";

async function run() {
  await init();
  document.querySelector("#out").textContent = greet("zeming");
}

run();
```
:::

启动静态服务器并访问：

::: code-group
```bash [用 Node（推荐）]
# 在 hello-wasm 目录下
npx serve ./www
```

```bash [用 Python]
# 在 hello-wasm 目录下
python -m http.server 5173 --directory ./www
```
:::

然后打开终端输出的地址（例如 `http://localhost:5173`），看到页面输出 `Hello, ...` 即成功。

:::warning 必须用 http(s) 访问
不要用 `file://` 直接打开 `index.html`，浏览器通常会因为模块加载/CORS 限制导致 Wasm 失败。
:::

## 三、wasm-bindgen-cli

如果你想更清楚 “Wasm + JS glue” 是怎么拼出来的，可以直接用 wasm-bindgen-cli，也更底层，了解原理使用。

:::code-group
```bash [安装 wasm-bindgen-cli]
cargo install wasm-bindgen-cli
wasm-bindgen --version
```

```bash [编译]
# 编译为 wasm32-unknown-unknown
cargo build --release --target wasm32-unknown-unknown

# 产物一般在类似路径：
target/wasm32-unknown-unknown/release/hello_wasm.wasm
```

```bash [生成浏览器可用 glue 代码]
wasm-bindgen \
  --target web \
  --out-dir ./www/pkg \
  ./target/wasm32-unknown-unknown/release/hello_wasm.wasm
```
:::

接着你可以像 wasm-pack 那样在 `www/` 里写 `index.html`/`main.js` 并用静态服务器打开。

## 四、常见问题与排查

### 1. Windows：MSVC toolchain 报缺少 `link.exe`

::::details MSVC link.exe 问题排查
现象：在 Windows 下使用 **MSVC toolchain** 编译 Rust 时，报错提示找不到 `link.exe`，常见于刚装完 Rust、但没有安装 MSVC 构建工具的环境。

解决方案：

① 安装 [Visual Studio Build Tools 安装器（最小安装）](https://aka.ms/vs/17/release/vs_BuildTools.exe)，并勾选 C++ 构建组件。

② 安装时选择
   - 工作负载：**使用 C++ 的桌面开发（Desktop development with C++）**
   - 确认包含（通常会自动勾选）： **MSVC v14.x C++ 编译器工具集**、**Windows 10/11 SDK**、 **CMake / 构建工具** 等

③ 安装完成后重开终端，验证

::: code-group
```bash [版本验证]
rustc --version
cargo --version
```

```bash [验证 link.exe 是否存在]
where link
```
:::

如果配置正确，`where link` 会返回类似路径（示例）：

```text
C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC\14.43.XXXXX\bin\Hostx64\x64\link.exe
```
::::

### 2. `wasm-pack` / `wasm-bindgen` 版本不匹配

现象：构建或运行时报错，提示 `wasm-bindgen` 版本不一致。  
处理：升级工具链与相关工具，保持 `wasm-pack` 与 `wasm-bindgen` 在较新版本。

```bash
rustup update
cargo install wasm-pack --force
cargo install wasm-bindgen-cli --force
```

## 小结

:::info 📖 相关资源
<ResourceLinks
  :grid="2"
  :groups="[
    {
      title: '',
      icon: 'simple-icons:wasm',
      items: [
        { name: 'wasm-pack', desc: 'Rust → WebAssembly 构建与发布工具', link: 'https://github.com/rustwasm/wasm-pack' },
        { name: 'wasm-bindgen', desc: 'Rust/Wasm 与 JavaScript 互操作桥接', link: 'https://github.com/rustwasm/wasm-bindgen' },
      ]
    },
  ]"
/>
:::