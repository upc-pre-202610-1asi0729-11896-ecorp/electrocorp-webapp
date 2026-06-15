$ErrorActionPreference = "Stop"

$output = "frontend-code-clean.txt"
$outputPath = Join-Path (Get-Location) $output

if (Test-Path $outputPath) {
  Remove-Item $outputPath -Force
}

$allowedExtensions = @(
  ".ts",
  ".html",
  ".scss",
  ".css",
  ".json",
  ".md",
  ".yml",
  ".yaml"
)

$allowedFiles = @(
  ".gitignore",
  ".gitattributes",
  ".editorconfig",
  ".prettierrc",
  "angular.json",
  "package.json",
  "tsconfig.json",
  "tsconfig.app.json",
  "tsconfig.spec.json",
  "Dockerfile",
  "nginx.conf"
)

$excludedFolders = @(
  "\node_modules\",
  "\dist\",
  "\.angular\",
  "\.idea\",
  "\.git\",
  "\coverage\",
  "\.vscode\",
  "\out-tsc\"
)

$excludedFiles = @(
  "package-lock.json",
  "frontend-code.txt",
  "frontend-code-clean.txt",
  "frontend-structure.txt",
  "frontend-structure-clean.txt",
  "export-frontend-code.ps1",
  "export-frontend-code-clean.ps1",
  "export-frontend-structure.ps1",
  "export-frontend-structure-clean.ps1"
)

function Is-ExcludedPath {
  param ([string]$path)

  foreach ($folder in $excludedFolders) {
    if ($path -like "*$folder*") {
      return $true
    }
  }

  return $false
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$writer = [System.IO.StreamWriter]::new($outputPath, $false, $utf8NoBom)

try {
  $writer.WriteLine("============================================================")
  $writer.WriteLine("ELECTROCORP FRONTEND CLEAN CODE EXPORT")
  $writer.WriteLine("Generated at: $(Get-Date)")
  $writer.WriteLine("Root: $(Get-Location)")
  $writer.WriteLine("============================================================")
  $writer.WriteLine("")

  Get-ChildItem -Path . -Recurse -File |
  Where-Object {
    $_.FullName -ne $outputPath -and
    -not (Is-ExcludedPath $_.FullName) -and
    -not ($excludedFiles -contains $_.Name) -and
    (
      $allowedExtensions -contains $_.Extension -or
      $allowedFiles -contains $_.Name
    )
  } |
  Sort-Object FullName |
  ForEach-Object {
    $relativePath = $_.FullName.Replace((Get-Location).Path + "\", "")

    $writer.WriteLine("")
    $writer.WriteLine("============================================================")
    $writer.WriteLine("FILE: $relativePath")
    $writer.WriteLine("============================================================")
    $writer.WriteLine("")
    $writer.WriteLine([System.IO.File]::ReadAllText($_.FullName))
  }
}
finally {
  $writer.Dispose()
}

Write-Host "Frontend clean code exported to $output"