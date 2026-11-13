@echo off
setlocal EnableDelayedExpansion

echo ============================================================================
echo JPG / JPEG FILE METADATA REPORT - %CD%
echo ============================================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Add-Type -AssemblyName System.Drawing; " ^
  "$files = Get-ChildItem -File | Where-Object { $_.Extension -match '^\.(jpg|jpeg)$' } | Sort-Object LastWriteTime; " ^
  "if ($files.Count -eq 0) { Write-Host 'No JPG or JPEG files found in this directory.' -ForegroundColor Yellow; exit } " ^
  "$results = foreach ($f in $files) { " ^
  "    try { " ^
  "        $fs = [System.IO.File]::OpenRead($f.FullName); " ^
  "        $img = [System.Drawing.Image]::FromStream($fs, $false, $false); " ^
  "        [PSCustomObject]@{ " ^
  "            FileName     = $f.Name; " ^
  "            Dimensions   = \"$($img.Width) x $($img.Height)\"; " ^
  "            DPI          = \"$([math]::Round($img.HorizontalResolution))x$([math]::Round($img.VerticalResolution))\"; " ^
  "            PixelFormat  = $img.PixelFormat -replace '^Format', ''; " ^
  "            SizeKB       = [math]::Round($f.Length / 1KB, 2); " ^
  "            ModifiedDate = $f.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss') " ^
  "        }; " ^
  "        $img.Dispose(); " ^
  "        $fs.Close(); " ^
  "    } catch { " ^
  "        Write-Host ('Error reading: ' + $f.Name) -ForegroundColor Red; " ^
  "    } " ^
  "}; " ^
  "$results | Format-Table -AutoSize; " ^
  "Write-Host ('Total JPG/JPEG Files: ' + $results.Count) -ForegroundColor Cyan"

echo.
pause
