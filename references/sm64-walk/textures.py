"""Simple reference-render face graphics; the motion and mesh use original data."""
import pathlib
from PIL import Image,ImageDraw,ImageFont
root=pathlib.Path('/tmp/sm64-reference-render/textures');root.mkdir(parents=True,exist_ok=True)
skin=(254,193,121,255);brown=(58,25,11,255)
for name in ['mario_texture_m_logo','mario_texture_eyes_front','mario_texture_hair_sideburn','mario_texture_mustache','mario_texture_yellow_button']:
 im=Image.new('RGBA',(32,32),skin);d=ImageDraw.Draw(im)
 if name=='mario_texture_m_logo':
  d.rectangle((0,0,31,31),fill=(255,0,0,255));d.ellipse((2,1,30,31),fill='white');f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',23);d.text((5,1),'M',fill='red',font=f)
 elif name=='mario_texture_eyes_front':
  for x in [3,19]:
   d.ellipse((x,7,x+10,26),fill='white');d.ellipse((x+4,10,x+10,24),fill=(25,111,225));d.ellipse((x+6,11,x+9,23),fill=(8,12,20));d.line((x-1,5,x+10,4),fill=brown,width=3)
 elif name=='mario_texture_hair_sideburn':d.polygon([(16,0),(31,0),(31,27),(24,30),(16,20)],fill=brown)
 elif name=='mario_texture_mustache':
  d.polygon([(0,7),(10,6),(18,4),(28,3),(31,10),(29,17),(23,20),(17,19),(12,22),(6,20),(0,17)],fill=(38,18,7));d.ellipse((3,19,17,23),fill=(156,67,35))
 elif name=='mario_texture_yellow_button':
  d.rectangle((0,0,31,31),fill=(0,0,255));d.ellipse((2,2,29,29),fill=(255,223,31));d.ellipse((6,4,23,13),fill=(255,242,115))
 im.save(root/(name+'.png'))
print('Wrote reference face textures')
