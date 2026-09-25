# Installs the Clipboard New Tab mod into every Zen profile that has Sine.
# Close Zen first: Sine rewrites mods.json while the browser runs.
$ErrorActionPreference = 'Stop'
if (Get-Process zen -ErrorAction SilentlyContinue) { Write-Host 'Close Zen Browser first, then run this again.'; exit 1 }

$src = $PSScriptRoot
$id = 'zen-clipboard-newtab'
$meta = Get-Content (Join-Path $src 'theme.json') -Raw -Encoding UTF8 | ConvertFrom-Json

$profiles = Get-ChildItem (Join-Path $env:APPDATA 'zen\Profiles') -Directory |
  Where-Object { Test-Path (Join-Path $_.FullName 'chrome\sine-mods\mods.json') }
if (-not $profiles) { Write-Host 'No Zen profile with Sine found.'; exit 1 }

foreach ($p in $profiles) {
  $mods = Join-Path $p.FullName 'chrome\sine-mods'
  $dest = Join-Path $mods $id
  if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
  New-Item -ItemType Directory $dest | Out-Null
  Copy-Item (Join-Path $src 'JS') $dest -Recurse
  Copy-Item (Join-Path $src 'theme.json') $dest

  $file = Join-Path $mods 'mods.json'
  Copy-Item $file "$file.bak" -Force
  $list = Get-Content $file -Raw -Encoding UTF8 | ConvertFrom-Json
  $entry = [ordered]@{
    id = $id; name = $meta.name; description = $meta.description; version = $meta.version; author = $meta.author
    tags = $meta.tags; fork = $meta.fork; scripts = $meta.scripts
    style = [ordered]@{ chrome = ''; content = '' }; preferences = ''
    'no-updates' = $true; enabled = $true
  }
  $list | Add-Member -NotePropertyName $id -NotePropertyValue ([pscustomobject]$entry) -Force
  [IO.File]::WriteAllText($file, ($list | ConvertTo-Json -Depth 32), (New-Object Text.UTF8Encoding $false))
  Write-Host "Installed into $($p.Name) (backup: mods.json.bak)"
}
Write-Host ''
Write-Host 'Last step: in Zen open about:config and set sine.allow-unsafe-js = true, then restart Zen.'
