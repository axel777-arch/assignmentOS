$ErrorActionPreference = "Stop"
if (-not (Test-Path .env)) {
	Copy-Item .env.example .env;
	Write-Host "Created .env from .env.example."
}
$lines = [System.Collections.Generic.List[string]]::new()
$lines.AddRange([System.IO.File]::ReadAllLines((Join-Path (Get-Location) ".env")))
foreach ($key in @("POSTGRES_PASSWORD", "JWT_SECRET")) {
	$index = -1
	for ($lineIndex = 0; $lineIndex -lt $lines.Count; $lineIndex++) { if ($lines[$lineIndex] -match "^$key=") { $index = $lineIndex; break } }
	$current = if ($index -ge 0) { $lines[$index].Substring($key.Length + 1) } else { "" }
	if (-not $current -or $current -match "replace|change-this") {
		$generator = [Security.Cryptography.RandomNumberGenerator]::Create()
		$bytes = New-Object byte[] 48
		$generator.GetBytes($bytes)
		$generator.Dispose()
		$secret = if ($key -eq "JWT_SECRET") { [Convert]::ToBase64String($bytes).TrimEnd("=").Replace("+", "-").Replace("/", "_") } else { [System.BitConverter]::ToString($bytes).Replace("-", "") }
		if ($index -ge 0) { $lines[$index] = "$key=$secret" } else { $lines.Add("$key=$secret") }
	}
}
[System.IO.File]::WriteAllLines((Join-Path (Get-Location) ".env"), $lines, [System.Text.UTF8Encoding]::new($false))
Write-Host "Environment and secrets configured in .env."
Write-Host "To run AssignmentOS services directly:"
Write-Host "  1. npm run dev:api   (Start Express API server on port 4000)"
Write-Host "  2. npm run dev:web   (Start Next.js frontend on port 3000)"
