<#
.SYNOPSIS
    Launches alcops-mcp with BCDEVELOPMENTTOOLSPATH resolved at every start.

.DESCRIPTION
    alcops-mcp cannot locate the AL DevTools on its own and depends on
    BCDEVELOPMENTTOOLSPATH, which goes stale each time VS Code updates the AL
    extension. Resolution order (first folder containing
    Microsoft.Dynamics.Nav.CodeAnalysis.dll wins):
      1. $env:BCDEVELOPMENTTOOLSPATH
      2. newest ms-dynamics-smb.al-*\bin under ~/.vscode then ~/.vscode-insiders
      3. newest microsoft.dynamics.businesscentral.development.tools dotnet tool

    The variable is set for the child process only. stdout is reserved for the
    MCP protocol: every diagnostic goes to stderr.
#>

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$MarkerDll = 'Microsoft.Dynamics.Nav.CodeAnalysis.dll'

function Write-Diag([string]$Message) {
    [Console]::Error.WriteLine("[start-alcops-mcp] $Message")
}

function Test-DevToolsPath([string]$Path) {
    return [bool]$Path -and (Test-Path -LiteralPath (Join-Path $Path $MarkerDll) -PathType Leaf)
}

# '18.0.37.11445-beta' -> [version]'18.0.37.11445'; $null if unparsable.
function ConvertTo-Version([string]$Text) {
    $parsed = $null
    if ([version]::TryParse(($Text -replace '[-+].*$', ''), [ref]$parsed)) { return $parsed }
    return $null
}

function Find-VsCodeDevTools {
    foreach ($root in @('.vscode', '.vscode-insiders')) {
        $extensions = Join-Path $HOME "$root\extensions"
        if (-not (Test-Path -LiteralPath $extensions)) { continue }

        $best = Get-ChildItem -LiteralPath $extensions -Directory -Filter 'ms-dynamics-smb.al-*' -ErrorAction SilentlyContinue |
            ForEach-Object {
                [pscustomobject]@{
                    Version = ConvertTo-Version ($_.Name -replace '^ms-dynamics-smb\.al-', '')
                    Bin     = Join-Path $_.FullName 'bin'
                }
            } |
            Where-Object { $_.Version -and (Test-DevToolsPath $_.Bin) } |
            Sort-Object Version -Descending |
            Select-Object -First 1

        if ($best) { return $best.Bin }
    }
    return $null
}

function Find-DotnetToolDevTools {
    $store = Join-Path $HOME '.dotnet\tools\.store\microsoft.dynamics.businesscentral.development.tools'
    if (-not (Test-Path -LiteralPath $store)) { return $null }

    $versions = Get-ChildItem -LiteralPath $store -Directory -ErrorAction SilentlyContinue |
        ForEach-Object { [pscustomobject]@{ Version = ConvertTo-Version $_.Name; Dir = $_ } } |
        Where-Object { $_.Version } |
        Sort-Object Version -Descending

    foreach ($entry in $versions) {
        # Layout: <ver>\<pkg>\<ver>\tools\<tfm>\any\ — prefer the newest TFM.
        $dll = Get-ChildItem -LiteralPath $entry.Dir.FullName -Recurse -File -Filter $MarkerDll -ErrorAction SilentlyContinue |
            Sort-Object { ConvertTo-Version ($_.Directory.Parent.Name -replace '^net', '') } -Descending |
            Select-Object -First 1
        if ($dll) { return $dll.DirectoryName }
    }
    return $null
}

$devTools = $null
if (Test-DevToolsPath $env:BCDEVELOPMENTTOOLSPATH) {
    $devTools = $env:BCDEVELOPMENTTOOLSPATH
} else {
    if ($env:BCDEVELOPMENTTOOLSPATH) {
        Write-Diag "BCDEVELOPMENTTOOLSPATH ignored (no $MarkerDll): $env:BCDEVELOPMENTTOOLSPATH"
    }
    $devTools = Find-VsCodeDevTools
    if (-not $devTools) { $devTools = Find-DotnetToolDevTools }
}

if (-not $devTools) {
    Write-Diag "BC DevTools not found. Install the AL Language extension in VS Code, or set BCDEVELOPMENTTOOLSPATH to a folder containing $MarkerDll."
    exit 1
}

$alcops = Get-Command 'alcops-mcp' -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $alcops) {
    Write-Diag "alcops-mcp not found in PATH. Install it with: dotnet tool install -g alcops.mcp --prerelease"
    exit 1
}

# Process scope only: user/machine variables are left untouched.
$env:BCDEVELOPMENTTOOLSPATH = $devTools

& $alcops.Source @args
exit $LASTEXITCODE
