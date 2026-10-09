$port = 8000
$localIP = [System.Net.IPAddress]::Any
$server = New-Object System.Net.Sockets.TcpListener($localIP, $port)

try {
    $server.Start()
    Write-Host "Servidor ativo em todas as interfaces na porta $port!"
    Write-Host "Disponivel localmente em http://localhost:$port"
    
    # Mostrar IPs locais para facilitar o acesso no celular
    $ips = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -ne "127.0.0.1" -and $_.InterfaceAlias -notlike "*Loopback*" }
    foreach ($ip in $ips) {
        Write-Host "Acesse no seu telemovel: http://$($ip.IPAddress):$port"
    }
} catch {
    Write-Error "Nao foi possivel iniciar o servidor TCP: $_"
    exit 1
}

$currentDir = $PSScriptRoot

while ($server.Server.IsBound) {
    try {
        $client = $server.AcceptTcpClient()
        $stream = $client.GetStream()
        
        $buffer = New-Object System.Byte[] 4096
        $read = $stream.Read($buffer, 0, $buffer.Length)
        if ($read -gt 0) {
            $reqText = [System.Text.Encoding]::UTF8.GetString($buffer, 0, $read)
            
            if ($reqText -match "GET ([^ ]+) HTTP") {
                $urlPath = $Matches[1]
                if ($urlPath.Contains("?")) {
                    $urlPath = $urlPath.Split("?")[0]
                }
                
                if ($urlPath -eq "/") { $urlPath = "/index.html" }
                $urlPath = $urlPath.Replace("..", "")
                
                $localFile = Join-Path $currentDir $urlPath
                
                if (Test-Path $localFile -PathType Leaf) {
                    $bytes = [System.IO.File]::ReadAllBytes($localFile)
                    
                    $contentType = "text/plain"
                    if ($localFile -like "*.html") { $contentType = "text/html; charset=utf-8" }
                    elseif ($localFile -like "*.css") { $contentType = "text/css; charset=utf-8" }
                    elseif ($localFile -like "*.js") { $contentType = "application/javascript; charset=utf-8" }
                    elseif ($localFile -like "*.json") { $contentType = "application/json; charset=utf-8" }
                    elseif ($localFile -like "*.png") { $contentType = "image/png" }
                    elseif ($localFile -like "*.ico") { $contentType = "image/x-icon" }
                    
                    $header = "HTTP/1.1 200 OK`r`nContent-Type: $contentType`r`nContent-Length: $($bytes.Length)`r`nAccess-Control-Allow-Origin: *`r`nConnection: close`r`n`r`n"
                    $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($header)
                    
                    $stream.Write($headerBytes, 0, $headerBytes.Length)
                    $stream.Write($bytes, 0, $bytes.Length)
                } else {
                    $errText = "Arquivo nao encontrado."
                    $errBytes = [System.Text.Encoding]::UTF8.GetBytes($errText)
                    $header = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain; charset=utf-8`r`nContent-Length: $($errBytes.Length)`r`nConnection: close`r`n`r`n"
                    $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($header)
                    
                    $stream.Write($headerBytes, 0, $headerBytes.Length)
                    $stream.Write($errBytes, 0, $errBytes.Length)
                }
            }
        }
        $client.Close()
    } catch {
        # Ignorar erros de conexao
    }
}
