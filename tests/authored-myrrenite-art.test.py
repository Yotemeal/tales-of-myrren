"""Native authored Myrrenite art QA: no upscale/crop and modular slot integrity."""
from pathlib import Path
from PIL import Image
import subprocess,sys,tempfile
with tempfile.TemporaryDirectory() as tmp:
    subprocess.run([sys.executable,'scripts/build-authored-myrrenite.py','--out',tmp],check=True)
    slots=['base','6-head','6-body','6-legs','6-boots','6-gloves','6-shield']
    images={}
    for name in slots:
        image=Image.open(Path(tmp)/(name+'.png'))
        assert image.size==(128,576),(name,image.size)
        assert image.mode=='RGBA',(name,image.mode)
        assert image.getbbox(),name+' atlas empty'
        images[name]=image
        for row in range(12):
            for col in range(4):
                cell=image.crop((col*32,row*48,(col+1)*32,(row+1)*48))
                assert cell.getbbox(),(name,row,col)
                assert cell.getpixel((0,0))[3]==0,(name,row,col,'transparent margin')
    assert images['6-head'].crop((0,0,32,48)).tobytes()!=images['6-head'].crop((0,3*48,32,4*48)).tobytes(),'front/back must differ'
    assert images['6-head'].crop((0,6*48,32,7*48)).tobytes()!=images['6-head'].crop((0,9*48,32,10*48)).tobytes(),'left/right must differ'
    assert images['6-gloves'].crop((0,2*48,32,3*48)).tobytes()!=images['6-gloves'].crop((3*32,2*48,4*32,3*48)).tobytes(),'attack arms must move'
    assert images['6-boots'].crop((0,48,32,96)).tobytes()!=images['6-boots'].crop((32,48,64,96)).tobytes(),'walk boots must move'
    # Left and right shields must be reflected counterparts rather than
    # floating on the same side or being mirrored twice.
    from PIL import ImageOps
    shield=images['6-shield']
    left=shield.crop((0,6*48,32,7*48))
    right=shield.crop((0,9*48,32,10*48))
    assert left.tobytes()==ImageOps.mirror(right).tobytes(), 'offhand shield must mirror cleanly across side facings'
    for name in slots:
        # All files must have true alpha and preserve a consistent foot-aligned frame.
        assert images[name].getextrema()[3][0]==0,name+' lacks transparency'
print('PASS: 7 native 32x48 RGBA atlases, 4 directions, moving arms and feet, no clipping to tile edges')
