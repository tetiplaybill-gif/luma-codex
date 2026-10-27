[CmdletBinding()]
param([switch]$Verify, [switch]$VerifySound)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$node = Get-Command node.exe -ErrorAction SilentlyContinue | Select-Object -First 1
$nodePath = if ($node) { $node.Source } else { $null }
if (-not $nodePath) {
  $pkg = Get-AppxPackage -Name 'OpenAI.Codex' -ErrorAction SilentlyContinue | Sort-Object Version -Descending | Select-Object -First 1
  if ($pkg) {
    $candidate = Join-Path $pkg.InstallLocation 'app\resources\cua_node\bin\node.exe'
    if (Test-Path -LiteralPath $candidate -PathType Leaf) { $nodePath = $candidate }
  }
}
if (-not $nodePath) {
  Write-Error '未找到 Node.js。请自行安装 Node.js 18 或更高版本并重新运行；不会自动下载安装。'
  exit 1
}
$version = & $nodePath --version
if ($version -notmatch '^v(\d+)\.') { Write-Error '无法识别 Node.js 版本。'; exit 1 }
if ([int]$Matches[1] -lt 18) { Write-Error '需要 Node.js 18 或更高版本。'; exit 1 }
Write-Host 'Windows 适配尚待实机验收；如启动失败，关闭此窗口并参阅 README。'
$arguments = @((Join-Path $root 'src\launcher.cjs'))
if ($VerifySound) { $arguments += '--verify-sound' } elseif ($Verify) { $arguments += '--verify' }
& $nodePath @arguments
exit $LASTEXITCODE
