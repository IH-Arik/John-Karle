Add-Type -AssemblyName System.Drawing
$sourcePath = "C:\Users\thasa\.gemini\antigravity\brain\5f3fdc0b-dcda-4020-bfaa-5faaf4e854c5\splash_logo_1778785216376.png"
$destPath = "E:\projects\LineageAI\assets\images\splash-logo.png"

$img = [System.Drawing.Image]::FromFile($sourcePath)
$img.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
$img.Dispose()
Write-Host "Image successfully copied and converted to true PNG at $destPath"
