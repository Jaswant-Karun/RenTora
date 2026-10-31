import os
import re

with open('client/public/hackathon_report.html', 'r', encoding='utf-8') as f:
    txt = f.read()

# Let's count pages
page_starts = [m.start() for m in re.finditer(r'<div class="page', txt)]
print(f"Total page starts: {len(page_starts)}")
for i, pos in enumerate(page_starts):
    end_pos = page_starts[i+1] if i+1 < len(page_starts) else len(txt)
    page_txt = txt[pos:end_pos]
    title_match = re.search(r'<(?:h1|h2|h3)[^>]*>(.*?)</', page_txt)
    title = title_match.group(1) if title_match else "Cover"
    print(f"Page {i+1}: length={len(page_txt)} chars, approx title='{title.strip()[:40]}'")
