"""Outline the site's fonts for a consistent raster link preview.

Usage: python scripts/outline-invitation-preview.py DYNAPUFF_LATIN_WOFF2
Outputs SVG to stdout; render it with Sharp to public/invitation-preview.png.
Requires fontTools and brotli. No system-font substitution.
"""
import sys
import xml.etree.ElementTree as ET
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen

ns = "http://www.w3.org/2000/svg"
ET.register_namespace("", ns)
root = ET.parse("public/invitation-preview.svg").getroot()
fonts = {
    "DynaPuff": TTFont(sys.argv[1]),
    "Glacial Indifference": TTFont("public/fonts/glacial-indifference/GlacialIndifference-Regular.woff2"),
}
for parent in list(root.iter()):
    for element in list(parent):
        if element.tag != f"{{{ns}}}text":
            continue
        font = fonts[element.get("font-family")]
        if "fvar" in font:
            font = instantiateVariableFont(font, {"wght": int(element.get("font-weight", "400"))})
        glyphs = font.getGlyphSet()
        cmap = font.getBestCmap()
        scale = float(element.get("font-size")) / font["head"].unitsPerEm
        spacing = float(element.get("letter-spacing", "0"))
        names = [cmap[ord(c)] for c in element.text]
        width = sum(glyphs[n].width * scale for n in names) + spacing * (len(names) - 1)
        cursor = float(element.get("x")) - width / 2
        group = ET.Element(f"{{{ns}}}g", {"fill": element.get("fill"), "aria-label": element.text})
        for name in names:
            pen = SVGPathPen(glyphs)
            glyphs[name].draw(pen)
            ET.SubElement(group, f"{{{ns}}}path", {
                "d": pen.getCommands(),
                "transform": f"translate({cursor} {element.get('y')}) scale({scale} {-scale})",
            })
            cursor += glyphs[name].width * scale + spacing
        index = list(parent).index(element)
        parent.remove(element)
        parent.insert(index, group)
sys.stdout.buffer.write(ET.tostring(root, encoding="utf-8"))
