import json, os

def load_config(path="config.json"):
    with open(path) as f:
        return json.load(f)

def load_template(page_type, ext):
    path = f"templates/{page_type}/template.{ext}"
    if not os.path.exists(path):
        return ""
    with open(path, encoding="utf-8") as f:
        return f.read()

def save_outputs(page_id, html, css, ts, out="output"):
    folder = f"{out}/{page_id}"
    os.makedirs(folder, exist_ok=True)
    open(f"{folder}/index.html", "w").write(html)
    open(f"{folder}/styles.css", "w").write(css)
    open(f"{folder}/{page_id}.component.ts", "w").write(ts)
    print(f"Saved -> {folder}/")
