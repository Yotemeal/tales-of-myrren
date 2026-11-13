#!/usr/bin/env python3
"""Audit existing resource source art only; never rewrite gameplay or original PNGs.

Requires Pillow. Intended for CI review artifacts, not in-game rendering.
"""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "design" / "starter-region-v1.json"
RESOURCES = ROOT / "public" / "assets" / "resources"


def inspect_source(asset):
    filename = RESOURCES / asset["file"]
    original = Image.open(filename)
    original.load()
    rgba = original.convert("RGBA")
    alpha = rgba.getchannel("A")
    mask = alpha.point(lambda v: 255 if v > 8 else 0)
    bounds = mask.getbbox()
    if bounds is None:
        raise ValueError(f"Entirely transparent asset: {filename.name}")
    width, height = rgba.size
    left, top, right, bottom = bounds
    edges = {
        "left": left == 0,
        "right": right == width,
        "top": top == 0,
        "bottom": bottom == height,
    }
    alpha_extrema = alpha.getextrema()
    raw_mode = original.mode
    return {
        "name": asset["name"],
        "file": asset["file"],
        "sourceWidth": width,
        "sourceHeight": height,
        "imageMode": raw_mode,
        "hasTransparentPixels": alpha_extrema[0] < 255,
        "contentBounds": {"left": left, "top": top, "right": right, "bottom": bottom},
        "contentWidth": right-left,
        "contentHeight": bottom-top,
        "sourceMargins": {"left": left, "top": top, "right": width-right, "bottom": height-bottom},
        "touchesImageEdges": [k for k,v in edges.items() if v],
        "edgeCropRisk": sum(edges.values()) >= 2,
        "alphaExtrema": list(alpha_extrema),
        "image": rgba,
    }


def make_sheet(rows, target):
    """Review-only contact sheet of exact source pixels. This is NOT production art."""
    columns=4
    cw,ch=330,295
    header=90
    height=header+((len(rows)+columns-1)//columns)*ch+40
    sheet=Image.new("RGBA",(columns*cw,height),(22,26,35,255))
    draw=ImageDraw.Draw(sheet)
    font=ImageFont.load_default()
    draw.text((24,12),"TALES OF MYRREN | EXISTING SOURCE RESOURCE AUDIT",font=font,fill=(248,225,179,255))
    draw.text((24,34),"Cropped to transparent bounds for PREVIEW ONLY; original PNGs are unchanged.",font=font,fill=(230,222,198,255))
    draw.text((24,51),"NOT NATIVE GAME ASSETS. Do not import this sheet as a sprite atlas.",font=font,fill=(252,155,119,255))
    draw.line((24,73,columns*cw-24,73),fill=(128,116,93,255),width=1)
    for i,row in enumerate(rows):
        col,gridrow=i%columns,i//columns
        x,y=col*cw+8,header+gridrow*ch
        draw.rounded_rectangle((x,y,x+cw-16,y+ch-8),radius=9,outline=(140,120,89,255),width=2)
        draw.text((x+12,y+10),row["name"]+"  ("+row["file"]+")",font=font,fill=(247,232,196,255))
        flags=[]
        if not row["hasTransparentPixels"]:flags.append("NO ALPHA")
        if row["edgeCropRisk"]:flags.append("EDGE CHECK")
        bounds=row["contentBounds"]
        left,top,right,bottom=bounds["left"],bounds["top"],bounds["right"],bounds["bottom"]
        cut=row["image"].crop((left,top,right,bottom))
        scale=min(1.5,240/cut.width,197/cut.height)
        # Nearest-neighbour only: the contact sheet is a zoom reference, not new art.
        factor=max(0.1,scale)
        dims=(max(1,round(cut.width*factor)),max(1,round(cut.height*factor)))
        scaled=cut.resize(dims,Image.Resampling.NEAREST)
        canvas=Image.new("RGBA",(280,204),(34,41,48,255))
        on=ImageDraw.Draw(canvas)
        for yy in range(0,204,12):
            for xx in range(0,280,12):
                if (xx//12+yy//12)%2==0:
                    on.rectangle((xx,yy,xx+11,yy+11),fill=(43,50,55,255))
        canvas.alpha_composite(scaled,((280-scaled.width)//2,(204-scaled.height)//2))
        sheet.alpha_composite(canvas,(x+16,y+38))
        draw.text((x+12,y+251),
                  f"{row['sourceWidth']}x{row['sourceHeight']} source | visible {row['contentWidth']}x{row['contentHeight']}",
                  font=font,fill=(215,222,213,255))
        if flags:
            draw.text((x+12,y+271)," / ".join(flags),font=font,fill=(248,164,122,255))
    sheet.convert("RGB").save(target,optimize=True)


def main():
    p=argparse.ArgumentParser()
    p.add_argument("--out",type=Path,default=Path("/tmp/myrren-resource-source-audit"))
    args=p.parse_args()
    args.out.mkdir(parents=True,exist_ok=True)
    contract=json.loads(CONTRACT.read_text())
    items=contract["approvedArtReferences"]["trees"]+contract["approvedArtReferences"]["ores"]
    records=[inspect_source(x) for x in items]
    summary=[{k:v for k,v in x.items() if k!="image"} for x in records]
    (args.out/"resource_source_audit.json").write_text(json.dumps({
        "kind":"source-image-audit-only",
        "productionAssetStatus":"not-approved",
        "records":summary
    },indent=2)+"\n")
    lines=["# Existing PNG asset audit — reference only","","Asset inputs were inspected, **not edited**.",
           "The contact sheet is a preview with independent nearest-neighbour zoom; never import it as an atlas.","",
           "| File | Source size | Visible bounds | Alpha | Edge risk |",
           "|---|---:|---:|---|---|"]
    for x in summary:
        lines.append(
          f"| {x['file']} | {x['sourceWidth']}×{x['sourceHeight']} "
          f"| {x['contentWidth']}×{x['contentHeight']} "
          f"| {'partial' if x['hasTransparentPixels'] else 'solid'} "
          f"| {','.join(x['touchesImageEdges']) or 'none'} |")
    lines+=["","## Interpretation","- Edge touches are **review flags**, not proof that the artist clipped the sprite.",
            "- A source asset's pixel size is not its actual gameplay draw size.",
            "- Runtime tree art is currently set to 144 px wide; ore source draws at 24 px in the environment loader, then passes through a separate rock drawing scale; see PR #77 for full scale ratios.",
            "- Existing art does not become production-ready merely because this audit passes.",
            ""]
    (args.out/"resource_source_audit.md").write_text("\n".join(lines))
    make_sheet(records,args.out/"resource_source_contact_sheet.png")
    for r in summary:
        issues=[]
        if not r["hasTransparentPixels"]: issues.append("no transparency")
        if r["touchesImageEdges"]:issues.append("touches "+",".join(r["touchesImageEdges"]))
        print(f"{r['file']}: {r['sourceWidth']}x{r['sourceHeight']} "
              f"visible {r['contentWidth']}x{r['contentHeight']} "
              +("CHECK "+", ".join(issues) if issues else "OK"))
    print(f"PASS: reviewed {len(records)} existing source PNGs; originals untouched; "
          f"saved review report to {args.out}")

if __name__=="__main__":
    main()
