# Kiểm tra Ollama local (Docker) và pull model nhẹ
# Chạy: .\scripts\ollama-check.ps1

$OllamaHost = if ($env:OLLAMA_PORT) { "http://localhost:$env:OLLAMA_PORT" } else { "http://localhost:11434" }

Write-Host "=== 1. Kiểm tra Ollama đang chạy ===" -ForegroundColor Cyan
try {
    $tags = Invoke-RestMethod -Uri "$OllamaHost/api/tags" -Method Get -ErrorAction Stop
    Write-Host "OK. Ollama đang chạy tại $OllamaHost" -ForegroundColor Green
    if ($tags.models) {
        Write-Host "Models đã cài: $($tags.models.Count)"
        $tags.models | ForEach-Object { Write-Host "  - $($_.name)" }
    } else {
        Write-Host "Chưa có model nào. Chạy lệnh pull bên dưới." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Ollama chưa chạy hoặc không truy cập được $OllamaHost" -ForegroundColor Red
    Write-Host "Chạy: docker compose up -d ollama" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n=== 2. Gợi ý model nhẹ (pull bằng Docker) ===" -ForegroundColor Cyan
Write-Host @"
  docker exec -it app-ollama ollama pull nomic-embed-text   # ~274MB - embedding, tìm SP tương tự
  docker exec -it app-ollama ollama pull qwen2.5:0.5b       # ~377MB - chat rất nhẹ
  docker exec -it app-ollama ollama pull llama3.2:1b        # ~1.3GB - chat 1B
  docker exec -it app-ollama ollama pull phi3:mini          # ~2.3GB - chat 3.8B
"@

Write-Host "`n=== 3. Test API embedding (cần đã pull nomic-embed-text) ===" -ForegroundColor Cyan
$body = @{ model = "nomic-embed-text"; prompt = "Laptop gaming ASUS" } | ConvertTo-Json
try {
    $emb = Invoke-RestMethod -Uri "$OllamaHost/api/embeddings" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-Host "Embedding OK. Vector length: $($emb.embedding.Count)" -ForegroundColor Green
} catch {
    Write-Host "Chưa pull nomic-embed-text hoặc lỗi: $_" -ForegroundColor Yellow
}

Write-Host "`nXem thêm: docs\ollama-local.md" -ForegroundColor Gray
