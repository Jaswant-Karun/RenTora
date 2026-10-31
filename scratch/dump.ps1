$process = Start-Process -FilePath "C:\Program Files\Google\Chrome\Application\chrome.exe" -ArgumentList @("--headless=new", "--disable-gpu", "--dump-dom", "http://localhost:5173/hackathon_report.html") -PassThru -NoNewWindow -RedirectStandardOutput "scratch/dom_dump.txt"
$process.WaitForExit(10000)
$content = Get-Content "scratch/dom_dump.txt" -Raw
if ($content -match '<div id="page-gap-indicator">(.*?)</div>') {
    Write-Output $matches[1]
} else {
    Write-Output "Indicator not found"
}
