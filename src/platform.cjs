'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

function queryWindowsPackage() {
  const script = "$p = Get-AppxPackage -Name 'OpenAI.Codex' -ErrorAction SilentlyContinue | Sort-Object Version -Descending | Select-Object -First 1; if ($p) { Join-Path $p.InstallLocation 'app\\ChatGPT.exe' }";
  const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { encoding:'utf8', windowsHide:true, timeout:10000 });
  if (result.error || result.status !== 0) return '';
  return (result.stdout || '').trim();
}

function resolveDesktop({ platform = process.platform, env = process.env, home = os.homedir(), exists = fs.existsSync, query = queryWindowsPackage } = {}) {
  if (platform !== 'darwin' && platform !== 'win32') throw new Error('当前只支持 macOS 和 Windows。');
  const app = env.MAID_CHATGPT_EXE || (platform === 'darwin' ? '/Applications/ChatGPT.app/Contents/MacOS/ChatGPT' : query());
  if (!app || !exists(app)) {
    throw new Error(platform === 'win32'
      ? '找不到新版 ChatGPT 桌面应用。请安装官方 OpenAI.Codex Windows 应用，或将 MAID_CHATGPT_EXE 指向其 ChatGPT.exe。'
      : '找不到 /Applications/ChatGPT.app；请安装新版官方 ChatGPT 桌面应用，或设置 MAID_CHATGPT_EXE。');
  }
  const profile = env.MAID_PROFILE_DIR || (platform === 'win32'
    ? path.win32.join(env.LOCALAPPDATA || path.win32.join(home, 'AppData', 'Local'), 'Luma Codex Theme', 'profile')
    : path.join(home, 'Library', 'Application Support', 'Luma Codex Theme', 'profile'));
  return { app, profile };
}
module.exports = { resolveDesktop, queryWindowsPackage };
