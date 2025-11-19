$port = 8000
$path = Get-Location

Write-Host "Запуск сервера на порту $port" -ForegroundColor Green
Write-Host "Откройте в браузере: http://localhost:$port" -ForegroundColor Yellow
Write-Host "Для остановки нажмите Ctrl+C" -ForegroundColor Gray
Write-Host ""

# Создаем простой HTTP сервер
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host "Сервер запущен!" -ForegroundColor Green
Write-Host ""

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    
    $localPath = $request.Url.LocalPath
    if ($localPath -eq "/") {
        $localPath = "/index.html"
    }
    
    $filePath = Join-Path $path $localPath.TrimStart('/')
    
    if (Test-Path $filePath -PathType Leaf) {
        $content = [System.IO.File]::ReadAllBytes($filePath)
        $extension = [System.IO.Path]::GetExtension($filePath)
        
        $contentType = "text/html"
        switch ($extension) {
            ".css" { $contentType = "text/css" }
            ".js" { $contentType = "application/javascript" }
            ".png" { $contentType = "image/png" }
            ".jpg" { $contentType = "image/jpeg" }
            ".jpeg" { $contentType = "image/jpeg" }
        }
        
        $response.ContentType = $contentType
        $response.ContentLength64 = $content.Length
        $response.StatusCode = 200
        $response.OutputStream.Write($content, 0, $content.Length)
    } else {
        $response.StatusCode = 404
        $notFound = [System.Text.Encoding]::UTF8.GetBytes("404 - File Not Found")
        $response.ContentLength64 = $notFound.Length
        $response.OutputStream.Write($notFound, 0, $notFound.Length)
    }
    
    $response.Close()
}

