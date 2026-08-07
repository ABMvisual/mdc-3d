import os
import urllib.parse

html_template = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{name}</title>
    <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js"></script>
    <style>
        body {{ margin: 0; padding: 0; background-color: #000; overflow: hidden; }}
        model-viewer {{ width: 100vw; height: 100vh; --poster-color: transparent; }}
    </style>
</head>
<body>
    <model-viewer 
        src="{filename}" 
        auto-rotate 
        rotation-per-second="30deg" 
        camera-controls 
        disable-zoom>
    </model-viewer>
</body>
</html>"""

glb_files = [f for f in os.listdir('.') if f.endswith('.glb')]
urls = []

for glb in glb_files:
    name = os.path.splitext(glb)[0]
    html_filename = f"{name}.html"
    
    safe_glb = urllib.parse.quote(glb)
    safe_html = urllib.parse.quote(html_filename)
    
    with open(html_filename, "w", encoding="utf-8") as f:
        f.write(html_template.format(name=name, filename=safe_glb))
        
    urls.append(f"{name}:\nhttps://abmvisual.github.io/mdc-3d/{safe_html}\n")

with open("Captur3d_URLs.txt", "w", encoding="utf-8") as f:
    f.writelines(urls)