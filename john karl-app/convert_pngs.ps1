Add-Type -AssemblyName System.Drawing
$files = Get-ChildItem -Path "E:\projects\LineageAI\assets\images" -Filter "*.png" -Recurse
foreach ($file in $files) {
    try {
        $stream = [System.IO.File]::OpenRead($file.FullName)
        $buffer = New-Object Byte[] 2
        $bytesRead = $stream.Read($buffer, 0, 2)
        $stream.Close()
        if ($bytesRead -eq 2 -and $buffer[0] -eq 0xFF -and $buffer[1] -eq 0xD8) {
            Write-Host "Converting "($file.FullName)" from JPEG to true PNG..."
            $img = [System.Drawing.Image]::FromFile($file.FullName)
            $tempPath = $file.FullName + ".tmp.png"
            $img.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
            $img.Dispose()
            Remove-Item -Path $file.FullName -Force
            Rename-Item -Path $tempPath -NewName $file.Name
        }
    } catch {
        Write-Host "Error processing "($file.FullName)": $_"
    }
}
