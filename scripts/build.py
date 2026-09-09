"""Build the two self-contained entrypoints. No third-party dependencies."""
from pathlib import Path
import argparse
import zipfile

ROOT = Path(__file__).resolve().parents[1]
VERSION = '2.0.1'

def build():
    source = ROOT / 'src'
    html = (source / 'shell.html').read_text(encoding='utf-8')
    css = '\n'.join((source / p).read_text(encoding='utf-8') for p in ['styles.css', 'editor.css'])
    js = '\n'.join((source / p).read_text(encoding='utf-8') for p in ['app.js', 'features.js'])
    html = html.replace('/* STYLES */', css).replace('/* APPLICATION */', js)
    html = '\n'.join(line.rstrip() for line in html.splitlines()) + '\n'
    for name in ['ComfyUI.html', 'index.html']:
        (ROOT / name).write_text(html, encoding='utf-8')
    return html

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--package', action='store_true')
    args = parser.parse_args()
    build()
    if args.package:
        destination = ROOT / 'downloads'
        destination.mkdir(exist_ok=True)
        package = destination / f'ComfyUI-Demo-v{VERSION}.zip'
        with zipfile.ZipFile(package, 'w', zipfile.ZIP_DEFLATED) as archive:
            for name in ['ComfyUI.html', 'index.html', 'README.md', '使用说明.md', 'CHANGELOG.md', '启动演示.bat']:
                archive.write(ROOT / name, f'ComfyUI-Demo-v{VERSION}/{name}')
        print(package)
    else:
        print('Built index.html and ComfyUI.html')
