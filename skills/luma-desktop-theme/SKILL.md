---
name: luma-desktop-theme
description: Launch the Luma-themed ChatGPT desktop window from this plugin on macOS or Windows when explicitly requested. Windows support is experimental and requires real-device verification.
---

# Luma desktop theme

Launch the theme only when the user asks to open or start it. Find this plugin's root two directories above this file and read its `README.md` for current prerequisites and limitations.

- On macOS run `start-macos.command` from the plugin root. On Windows run `start-windows.cmd`. The launcher needs the new official ChatGPT desktop app and Node.js 18+; do not install dependencies silently.
- The theme launches a separate client instance using a private debugging pipe and does not modify the installed app. The separate browser profile does not guarantee account or conversation isolation. Do not read, log, or screenshot the user's conversations.
- Keep the launcher process alive while its themed window is in use. A successful process spawn alone does not prove the theme loaded; check its startup output or run the documented diagnostic in a separate instance if needed. Do not close the user's existing app or active themed window.
- On Windows the MSIX package identity and actual messaging compatibility have not yet been verified; report the result honestly and do not claim acceptance from path or synthetic pipe tests alone.
