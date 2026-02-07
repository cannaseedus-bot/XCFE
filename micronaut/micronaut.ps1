# MICRONAUT ORCHESTRATOR (SCO/1 projection only)

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$IO = Join-Path $Root "io"
$Chat = Join-Path $IO "chat.txt"
$Stream = Join-Path $IO "stream.txt"
$Object = Join-Path $Root "micronaut.s7"

Write-Host "Micronaut online."

function Invoke-ObjectOp {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Op,
        [Parameter(Mandatory = $true)]
        [string]$Input
    )

    if (-not (Test-Path $Object)) {
        throw "Missing object executable: $Object"
    }

    $payload = @{
        op = $Op
        input = $Input
    } | ConvertTo-Json -Compress

    $result = & $Object $payload
    if ($LASTEXITCODE -ne 0) {
        throw "Object operation failed: $Op"
    }

    return $result
}

function Test-CM1 {
    param([string]$Entry)

    $verdict = Invoke-ObjectOp -Op "cm1_verify" -Input $Entry
    return $verdict -eq "ok"
}

$lastSize = 0

while ($true) {
    if (Test-Path $Chat) {
        $size = (Get-Item $Chat).Length
        if ($size -gt $lastSize) {
            $entry = Get-Content $Chat -Raw
            $lastSize = $size

            if (-not (Test-CM1 -Entry $entry)) {
                Write-Host "CM-1 violation"
                continue
            }

            $signal = Invoke-ObjectOp -Op "kuhul_tsg" -Input $entry
            $response = Invoke-ObjectOp -Op "scxq2_infer" -Input $signal

            Add-Content $Stream ">> $response"
        }
    }

    Start-Sleep -Milliseconds 200
}
