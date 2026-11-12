#!/usr/bin/env python3
"""Review-only comparison sheets from REAL game screenshots.
Do not produce or alter any sprite, game module, save, or world geometry.
"""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

NAMES = ["bank_chest","jobs_board","blacksmith_anvil","open_furnace","lantern"]
VIEW_WIDTH, VIEW_HEIGHT = 560, 410
HEADER = 92
ROW_HEIGHT = VIEW_HEIGHT + 58

def font(size,bold=False):
    try:
        return ImageFont.truetype("DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf",size)
    except OSError:
        return ImageFont.load_default()

def crop_real_screen(path,scene):
    img=Image.open(path).convert("RGB")
    pixel_ratio=2 if scene["device"]=="mobile" else 1
    point=scene["position"]["target"]
    player=scene["position"]["player"]
    px=img.width/2 + (point["x"]-player["x"])*pixel_ratio
    py=img.height*.47 + (point["y"]-player["y"])*pixel_ratio
    native_crop_w=250*pixel_ratio
    native_crop_h=182*pixel_ratio
    bounds=tuple(round(n) for n in (
        px-native_crop_w/2,py-native_crop_h/2,
        px+native_crop_w/2,py+native_crop_h/2
    ))
    assert bounds[0]>=0 and bounds[1]>=0
    assert bounds[2]<=img.width and bounds[3]<=img.height,(path,bounds,img.size)
    # Pixel nearest-neighbour only; original source imagery is unchanged.
    return img.crop(bounds).resize((VIEW_WIDTH,VIEW_HEIGHT),Image.Resampling.NEAREST)

def build(folder,device,scenes):
    w=(VIEW_WIDTH+20)*2
    h=HEADER+ROW_HEIGHT*len(NAMES)+20
    image=Image.new("RGB",(w,h),(27,39,35))
    draw=ImageDraw.Draw(image)
    draw.text((17,12),"MYRREN / NATIVE CRATER CAMP PROPS — "+device.upper(),
              font=font(21,True),fill=(245,224,189))
    draw.text((17,44),"ACTUAL GAME — original vs native PNG. Same camera and Kez position.",
              font=font(14),fill=(183,208,193))
    draw.text((17,67),"Review-only Chromium substitution; these sprites are NOT installed.",
              font=font(13),fill=(232,174,135))
    for index,kind in enumerate(NAMES):
        scene=scenes[(device,kind)]
        y=HEADER+index*ROW_HEIGHT
        for side,(tag,title) in enumerate((("before","CURRENT GAME"),("after","NATIVE PNG PROPOSAL"))):
            x=10+side*(VIEW_WIDTH+20)
            draw.rounded_rectangle((x,y,x+VIEW_WIDTH+5,y+VIEW_HEIGHT+46),
                                   radius=7,outline=(100,134,115),width=2)
            draw.text((x+10,y+9),kind.replace("_"," ").title()+" / "+title,
                      font=font(15,True),fill=(242,223,191))
            screenshot=folder/scene[tag]
            assert screenshot.exists(),screenshot
            crop=crop_real_screen(screenshot,scene)
            image.paste(crop,(x+2,y+38))
    filename=f"CRATER_CAMP_{device.upper()}_ACTUAL_GAME_COMPARISON.png"
    image.save(folder/filename,optimize=True)
    print("WROTE",filename)
    return filename

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--out",type=Path,default=Path("/tmp/myrren-camp-props-gameplay-proof"))
    folder=parser.parse_args().out
    data=json.loads((folder/"qa-report.json").read_text())
    assert data["productionGameChanged"] is False
    scenes={(x["device"],x["kind"]):x for x in data["scenes"]}
    assert len(scenes)==10,"Expected 5 props x desktop/mobile"
    assert all(scene["replacementCount"]>0 for scene in scenes.values())
    files=[build(folder,d,scenes) for d in ("desktop","mobile")]
    (folder/"CONTACT_SHEETS_README.md").write_text(
      "# Native Crater Camp props — current-versus-new gameplay QA\n\n"
      "These are crops of REAL browser canvas screenshots. Source PNGs and game code were **not** edited. "
      "Only the specified prop in each row is replaced inside Chromium's test-only network response. "
      "Original Kez, surrounding props, locations and interactions remain intact.\n\n"
      "The campfire has no verified current world position, and is therefore **not** claimed as installed "
      "or rendered in real game. Its standalone source PNG is separately validated.\n\n"
      + "\n".join("- "+name for name in files)+"\n"
    )
    print("PASS: two real-game contact sheets, 10 verified selected-prop comparisons")

if __name__=="__main__":
    main()
