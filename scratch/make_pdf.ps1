$pdfTarget = "c:\Users\jaswant karun\Rentora\RENTORA_Hackathon_Submission_StormBreakerz.pdf"
if (Test-Path $pdfTarget) {
    Remove-Item $pdfTarget -Force
}
$proc = Start-Process -FilePath "C:\Program Files\Google\Chrome\Application\chrome.exe" -ArgumentList @("--headless=new", "--disable-gpu", "--print-to-pdf=`"$pdfTarget`"", "--no-pdf-header-footer", "http://localhost:5173/hackathon_report.html") -PassThru
$proc.WaitForExit(20000)
Write-Output "ExitCode: $($proc.ExitCode)"
if (Test-Path $pdfTarget) {
    $size = (Get-Item $pdfTarget).Length
    Write-Output "Generated PDF successfully. Size: $size bytes"
} else {
    Write-Output "PDF Generation Failed."
}
