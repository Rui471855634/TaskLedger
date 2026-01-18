# TaskLedger（发布版 / Release 包）

这个目录用于放置 **普通用户** 使用的说明与启动脚本（会跟随 GitHub Release 一起发布）。

> 仓库根目录 `README.md` 是给开发者看的。  
> 这里的 `release/README.zh-CN.md` 是给“下载 Release 压缩包”的用户看的。

## 你下载到的内容应该包含什么

Release 压缩包建议至少包含：

- `dist/`：已经构建好的前端文件
- `taskledger-server.exe`（Windows）：本地静态服务（无需安装 Node）
- `tools/serve-dist.mjs`（macOS/备用）：本地静态服务（需要 Node）
- `release/`：本目录（启动脚本 + 说明）

## Windows：一键启动（无需安装 Node）

1. 解压 Release 压缩包到一个文件夹（尽量避免需要管理员权限的路径）。
2. 双击运行：
   - `release/windows/start-taskledger.bat`
3. 浏览器访问：
   - `http://127.0.0.1:4173`

### Windows：设置开机自启动（当前用户登录后自动启动）

双击（或右键 → 用 PowerShell 运行）：

- `release/windows/install-autostart.ps1`

卸载自启动：

- `release/windows/uninstall-autostart.ps1`

> 如果 PowerShell 禁止脚本执行，可以先运行一次（当前用户）：
>
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
> ```

## macOS：启动（目前需要安装 Node.js）

1. 解压 Release 压缩包
2. 首次运行建议在 Terminal 中执行：

```bash
chmod +x release/macos/*.command
./release/macos/start-taskledger.command
```

3. 浏览器访问：
   - `http://127.0.0.1:4173`

### macOS：开机自启动（当前用户登录后自动启动）

```bash
chmod +x release/macos/*.command
./release/macos/install-autostart.command
```

卸载：

```bash
./release/macos/uninstall-autostart.command
```

## 修改端口 / Host

默认：`127.0.0.1:4173`

你可以在启动前设置环境变量：

- `HOST`（默认 `127.0.0.1`）
- `PORT`（默认 `4173`）

## 常见问题

- **访问不了**：确认服务窗口是否在运行，以及端口是否被占用（可以换一个 `PORT`）。
- **页面空白**：确认压缩包里有 `dist/`（这是构建产物）。

