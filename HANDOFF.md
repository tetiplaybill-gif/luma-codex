# Handoff

Updated 2026-10-27 by Codex

## Goal
在公开仓库发布 ChatGPT 桌面伴侣主题，提供从 Git 克隆后的 macOS 和 Windows 启动入口及 Codex skill。

## Status
macOS 跨平台源码启动器已在真实客户端的 Codex 视图新窗口验证；Chat / Work 视图尚未验收。Windows 包检测、启动脚本和跨平台模拟测试已实现，但未在 Windows 真机运行，必须标为实验性；GitHub Windows CI 也不能替代真实客户端和消息流验收。用户已选择先按非商业用途公开；远端发布状态以实际 GitHub 仓库为准。

## Done
- `src/platform.cjs`, `src/launcher.cjs`：macOS / Windows 路径发现及独立调试管道启动；不修改官方程序或读取聊天。
- `start-macos.command`, `start-windows.cmd`, `start-windows.ps1`：对应系统入口，不自动安装 Git、Node 或客户端。
- `src/theme.*`, `assets/`, `licenses/`：原主题和原创角色，宫殿与装饰保留上游 CC BY-NC-SA 4.0 条款。
- `skills/luma-desktop-theme/`, `.codex-plugin/`, `.agents/plugins/`：待在实际 Codex 插件安装流程中验证的 skill 和清单。
- `tests/`, `.github/workflows/ci.yml`：依赖已有 Node / Git 的测试；CI 未运行前不要报告 Windows CI 为通过。

## Next steps
1. 检查目标 GitHub 仓库的写入权限；上传前执行 `git status --short`，仅暂存本项目文件，检查敏感数据后提交并推送。
2. 在 Windows 10/11 安装真实新版官方客户端后运行 `start-windows.cmd -Verify`；继续验证新窗口登录、消息发送、流式回复和退出。不要从本机或 CI 的模拟测试推断这些已通过。
3. 验证从 Git 导入的 Codex marketplace 与 skill 是否可发现并能保持启动进程存活。
4. 如需商业发行，先替换或取得宫殿、蕾丝和蝴蝶结素材的商业授权；不能把 CC BY-NC-SA 当作纯 MIT。

## Verify
- `node --test tests/platform.test.cjs tests/bundle.test.cjs tests/ipc.test.cjs tests/chromium-pipe.test.cjs` → macOS 本地通过；Windows 相关的注册包查询在非 Windows 上跳过。
- `MAID_PROFILE_DIR=<isolated-path> ./start-macos.command --verify` → 在本机官方客户端检查主题及输入区域，随后只退出测试实例。
- `ruby -r yaml -r json ...` → 仅验证 skill YAML 与插件 JSON 解析。官方 skill 验证脚本因环境缺少 PyYAML 未运行成功；不得称完整 skill 安装验证通过。

## Decisions & gotchas
- Windows 的官方应用属于 MSIX 包，直接启动包内程序可能受到包身份与版本影响。私有管道和包检测尚未在目标客户端实测。
- 隔离 Chromium 数据目录不等同于隔离用户账户或会话；绝不截取真实会话画面或复制用户资料。
- 不要向 Git 加入 `.env`、用户配置、日志、浏览器资料、数据库、备份或客户端二进制。
