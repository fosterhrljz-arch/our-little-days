"""Independently validate browser-exported PDF and PNG pages against captured previews.

Usage: python tests/verify-exports.py PATH_TO_BOOK_BROWSER_OUTPUT
Requires pypdf and PyMuPDF; no network access is used.
"""
import hashlib
import json
from pathlib import Path
import sys
import zipfile
import pymupdf as fitz
from pypdf import PdfReader

root = Path(sys.argv[1]).resolve()
document = json.loads((root / 'export-document.json').read_text(encoding='utf-8'))
reader = PdfReader(root / 'edited-book.pdf')
assert len(reader.pages) == len(document['pages'])
results = []

def rgb(data):
    pix = fitz.Pixmap(data)
    if pix.alpha:
        pix = fitz.Pixmap(pix, 0)
    assert pix.width == 2400 and pix.height == 3200
    assert pix.n == 3
    return pix.samples

with zipfile.ZipFile(root / 'edited-pages.zip') as archive:
    assert archive.testzip() is None
    assert archive.namelist() == [f'page-{i + 1:02}.png' for i in range(len(reader.pages))]
    for i, page in enumerate(reader.pages):
        png = archive.read(f'page-{i + 1:02}.png')
        png_rgb = rgb(png)
        preview_rgb = rgb(str(root / f'preview-{i + 1:02}.png'))
        image = page['/Resources']['/XObject']['/Im0'].get_object()
        assert image['/Width'] == 2400 and image['/Height'] == 3200
        assert image['/ColorSpace'] == '/DeviceRGB'
        assert image['/Filter'] == '/FlateDecode'
        pdf_rgb = image.get_data()
        assert png_rgb == preview_rgb, f'PNG differs from preview on page {i + 1}'
        assert pdf_rgb == preview_rgb, f'PDF differs from preview on page {i + 1}'
        assert list(page.mediabox) == [0, 0, 600, 800]
        results.append({'page': i + 1, 'pixels': '2400 x 3200', 'preview_png_pdf': 'pixel-identical', 'rgb_sha256': hashlib.sha256(preview_rgb).hexdigest()})

pdf = fitz.open(root / 'edited-book.pdf')
for i, page in enumerate(pdf):
    # A second PDF engine verifies that the complete PDF page actually renders.
    pix = page.get_pixmap(matrix=fitz.Matrix(1.2, 1.2), alpha=False)
    pix.save(root / f'pdf-render-{i + 1:02}.png')
summary = {'page_count': len(reader.pages), 'zip_crc': 'passed', 'pdf_parse_and_render': 'passed', 'pages': results}
(root / 'export-verification.json').write_text(json.dumps(summary, indent=2), encoding='utf-8')
print(json.dumps(summary, indent=2))
