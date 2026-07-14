#Requires -Version 5.1
# ---------------------------------------------------------------------------
# bump-release-version-windows.ps1
# Updates the release version in:
#   • VERSION              — global replace, all occurrences
#   • **/package.json      — replace within first 11 lines only (skips node_modules)
#   • **/package-lock.json — same
# ---------------------------------------------------------------------------

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot  = (Resolve-Path (Join-Path $ScriptDir "..\..\")).Path.TrimEnd('\')

$VersionFile = Join-Path $RepoRoot "VERSION"

# ---------------------------------------------------------------------------
# Read current version
# ---------------------------------------------------------------------------
if (-not (Test-Path $VersionFile)) {
    Write-Host "ERROR: VERSION file not found at $VersionFile" -ForegroundColor Red
    Read-Host "Press Enter to close"
    exit 1
}

$CurrentRaw     = ([IO.File]::ReadAllText($VersionFile)).Trim()
$CurrentVersion = $CurrentRaw -replace '^v', ''

Write-Host "Repo root      : $RepoRoot"
Write-Host "Current version: $CurrentVersion"
Write-Host ""

# ---------------------------------------------------------------------------
# Prompt for new version (GUI InputBox; fall back to Read-Host if unavailable)
# ---------------------------------------------------------------------------
$NewVersion          = $null
$UseTerminalFallback = $false

try {
    Add-Type -AssemblyName 'Microsoft.VisualBasic' -ErrorAction Stop
    $NewVersion = [Microsoft.VisualBasic.Interaction]::InputBox(
        "This tool updates the release version across all module package.json, package-lock.json, and the root VERSION file in this repository.`n`nCurrent version: $CurrentVersion`nEnter the new release version:",
        "Version Bump",
        $CurrentVersion
    )
} catch {
    $UseTerminalFallback = $true
}

if ($UseTerminalFallback) {
    $raw        = Read-Host "Enter new version [$CurrentVersion]"
    $NewVersion = if ([string]::IsNullOrWhiteSpace($raw)) { $CurrentVersion } else { $raw }
}

# Strip leading v and whitespace; InputBox Cancel returns empty string
$NewVersion = $NewVersion.Trim() -replace '^v', ''

if ([string]::IsNullOrEmpty($NewVersion)) {
    Write-Host "Cancelled."
    Read-Host "Press Enter to close"
    exit 0
}

# ---------------------------------------------------------------------------
# Validate: X.Y.Z or X.Y.Z-<alphanumeric>
# ---------------------------------------------------------------------------
if ($NewVersion -notmatch '^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9]+)?$') {
    Write-Host "ERROR: Invalid version '$NewVersion'." -ForegroundColor Red
    Write-Host "       Must match X.Y.Z or X.Y.Z-<alphanumeric suffix> (e.g. 8.4.0, 8.4.0-rc)."
    Read-Host "Press Enter to close"
    exit 1
}

if ($NewVersion -eq $CurrentVersion) {
    Write-Host "No change needed — version is already $CurrentVersion."
    Read-Host "Press Enter to close"
    exit 0
}

Write-Host "Bumping: $CurrentVersion  ->  $NewVersion"
Write-Host ""

$Updated = 0
$Skipped = 0
$Failed  = 0

# ---------------------------------------------------------------------------
# Discover all package.json and package-lock.json (exclude node_modules)
# ---------------------------------------------------------------------------
$PkgJsonFiles  = Get-ChildItem -Path $RepoRoot -Recurse -Filter "package.json" |
                    Where-Object { $_.FullName -notlike "*\node_modules\*" } |
                    Sort-Object FullName

$PkgLockFiles  = Get-ChildItem -Path $RepoRoot -Recurse -Filter "package-lock.json" |
                    Where-Object { $_.FullName -notlike "*\node_modules\*" } |
                    Sort-Object FullName

$Total = 1 + $PkgJsonFiles.Count + $PkgLockFiles.Count

$Utf8NoBom = New-Object System.Text.UTF8Encoding $false

# ---------------------------------------------------------------------------
# Update VERSION — global replace using ReadAllText / WriteAllText
# ---------------------------------------------------------------------------
Write-Host "-- VERSION -----------------------------------------------"
$content = [IO.File]::ReadAllText($VersionFile)
if ($content -notlike "*$CurrentVersion*") {
    Write-Host "  [SKIPPED] VERSION (version string not found)"
    $Skipped++
} else {
    try {
        [IO.File]::WriteAllText($VersionFile, $content.Replace($CurrentVersion, $NewVersion), $Utf8NoBom)
        Write-Host "  [UPDATED] VERSION"
        $Updated++
    } catch {
        Write-Host "  [FAILED]  VERSION: $_" -ForegroundColor Red
        $Failed++
    }
}

# ---------------------------------------------------------------------------
# Helper — update JSON manifest (lines 1-11) using ReadAllLines / WriteAllLines
# ---------------------------------------------------------------------------
function Update-JsonTop11 {
    param([string]$FilePath, [string]$Label)

    $lines  = [IO.File]::ReadAllLines($FilePath)
    $maxIdx = [Math]::Min(10, $lines.Length - 1)   # 0-based → covers lines 1..11

    $found = $false
    for ($i = 0; $i -le $maxIdx; $i++) {
        if ($lines[$i] -like "*$script:CurrentVersion*") { $found = $true; break }
    }

    if (-not $found) {
        Write-Host ("  [SKIPPED] {0} (version string not found in first 11 lines)" -f $Label)
        $script:Skipped++
        return
    }

    try {
        for ($i = 0; $i -le $maxIdx; $i++) {
            $lines[$i] = $lines[$i].Replace($script:CurrentVersion, $script:NewVersion)
        }
        [IO.File]::WriteAllLines($FilePath, $lines, $script:Utf8NoBom)
        Write-Host ("  [UPDATED] {0}" -f $Label)
        $script:Updated++
    } catch {
        Write-Host ("  [FAILED]  {0}: {1}" -f $Label, $_) -ForegroundColor Red
        $script:Failed++
    }
}

# ---------------------------------------------------------------------------
# Process all package.json files
# ---------------------------------------------------------------------------
Write-Host ""
Write-Host ("-- package.json ({0} files found) ------------------------" -f $PkgJsonFiles.Count)
foreach ($file in $PkgJsonFiles) {
    $rel = $file.FullName.Substring($RepoRoot.Length + 1)
    Update-JsonTop11 $file.FullName $rel
}

# ---------------------------------------------------------------------------
# Process all package-lock.json files
# ---------------------------------------------------------------------------
Write-Host ""
Write-Host ("-- package-lock.json ({0} files found) -------------------" -f $PkgLockFiles.Count)
foreach ($file in $PkgLockFiles) {
    $rel = $file.FullName.Substring($RepoRoot.Length + 1)
    Update-JsonTop11 $file.FullName $rel
}

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
Write-Host ""
Write-Host "Summary: $Updated / $Total file(s) updated ($Skipped skipped)"
Write-Host ""
Read-Host "Press Enter to close"
