# Restore agent skills (sangkan-clean)

# Run from repo root after clone on a new machine:
#   powershell -ExecutionPolicy Bypass -File .\scripts\restore-agent-skills.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "==> Installing external skills into .agents/skills (Cursor)"

npx --yes skills add vercel-labs/agent-skills --skill vercel-react-best-practices -a cursor -y
npx --yes skills add wshobson/agents --skill nextjs-app-router-patterns -a cursor -y
npx --yes skills add AsyrafHussin/agent-skills --skill typescript-react-patterns -a cursor -y
npx --yes skills add prisma/skills --skill prisma-cli --skill prisma-client-api --skill prisma-database-setup --skill prisma-upgrade-v7 -a cursor -y
npx --yes skills add https://github.com/ulpi-io/skills --skill docker -a cursor -y
npx --yes skills add testdino-hq/playwright-skill -a cursor -y

Write-Host "==> Syncing custom Sangkan skills to user ~/.cursor/skills"
$src = Join-Path (Get-Location) ".cursor\skills"
$dst = Join-Path $env:USERPROFILE ".cursor\skills"
New-Item -ItemType Directory -Force -Path $dst | Out-Null
Get-ChildItem $src -Directory -Filter "sangkan-*" | ForEach-Object {
  $target = Join-Path $dst $_.Name
  if (Test-Path $target) { Remove-Item -Recurse -Force $target }
  Copy-Item $_.FullName $target -Recurse -Force
  Write-Host "  synced $($_.Name)"
}

Write-Host "==> Done. Reload Cursor Window."
