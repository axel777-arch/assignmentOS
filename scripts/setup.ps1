$ErrorActionPreference = "Stop"
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw "Docker Desktop is required. Install/start Docker, then run this script again." }
if (-not (Test-Path .env)) { Copy-Item .env.example .env; Write-Host "Created .env from .env.example." }
$lines = [System.Collections.Generic.List[string]]::new()
$lines.AddRange([System.IO.File]::ReadAllLines((Join-Path (Get-Location) ".env")))
$secretsChanged = $false
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
		if ($key -eq "POSTGRES_PASSWORD") { $secretsChanged = $true }
	}
}
[System.IO.File]::WriteAllLines((Join-Path (Get-Location) ".env"), $lines, [System.Text.UTF8Encoding]::new($false))
if ($secretsChanged) {
	$runningServices = docker compose ps --services --status running
	if ($LASTEXITCODE -eq 0 -and $runningServices -contains "db") {
		$userLine = $lines | Where-Object { $_ -match '^POSTGRES_USER=' } | Select-Object -First 1
		$databaseLine = $lines | Where-Object { $_ -match '^POSTGRES_DB=' } | Select-Object -First 1
		$user = if ($userLine) { $userLine.Substring("POSTGRES_USER=".Length) } else { "assignmentos" }
		$database = if ($databaseLine) { $databaseLine.Substring("POSTGRES_DB=".Length) } else { "assignmentos" }
		if ($user -notmatch '^[A-Za-z_][A-Za-z0-9_]*$') { throw "POSTGRES_USER must be a simple SQL role name to rotate its password safely." }
		$passwordLine = $lines | Where-Object { $_ -match '^POSTGRES_PASSWORD=' } | Select-Object -First 1
		$password = $passwordLine.Substring("POSTGRES_PASSWORD=".Length)
		$sql = 'ALTER ROLE "' + $user + '" WITH PASSWORD ''' + $password + ''';'
		docker compose exec -T db psql -U $user -d $database -v ON_ERROR_STOP=1 -c $sql
		if ($LASTEXITCODE -ne 0) { throw "Could not rotate the existing local database password; Compose was not restarted." }
	}
}
Write-Host "Local database and session secrets are configured in .env."
docker compose up --build
