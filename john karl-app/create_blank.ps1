Add-Type -AssemblyName System.Drawing
$bitmap = New-Object System.Drawing.Bitmap(1, 1)
$bitmap.MakeTransparent()
$bitmap.Save("E:\projects\LineageAI\assets\images\blank.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bitmap.Dispose()
