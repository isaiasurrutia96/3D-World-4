"""Extract SM64's original walk channels and high-detail Mario mesh for a reference render."""
import argparse,collections,hashlib,json,math,pathlib,re,urllib.request
REVISION='9921382a68bb0c865e5e45eb594d9c64db59b1af'
FILES={'model':'actors/mario/model.inc.c','animation':'assets/anims/anim_48.inc.c','geo':'actors/mario/geo.inc.c'}
ROOT=pathlib.Path('/tmp/sm64-walk-source')
NUM=re.compile(r'-?0x[0-9a-fA-F]+|-?\d+')
def numbers(s):return [int(x,0) for x in NUM.findall(s)]
def clean(s):return re.sub(r'/\*.*?\*/|//[^\n]*','',s,flags=re.S)
def extract(output):
 ROOT.mkdir(parents=True,exist_ok=True)
 source={};hashes={}
 for name,path in FILES.items():
  cached=ROOT/(name+'-pinned.c')
  if cached.exists():data=cached.read_bytes()
  else:
   data=urllib.request.urlopen(f'https://raw.githubusercontent.com/n64decomp/sm64/{REVISION}/{path}',timeout=30).read();cached.write_bytes(data)
  source[name]=clean(data.decode());hashes[path]=hashlib.sha256(data).hexdigest()
 model=source['model'];animation=source['animation']
 lights={name:numbers(body)[3:6] for name,body in re.findall(r'const Lights1\s+(\w+)\s*=\s*gdSPDefLights1\((.*?)\);',model,re.S)}
 vertices={}
 for name,body in re.findall(r'const Vtx\s+(\w+)\[\]\s*=\s*\{(.*?)\};',model,re.S):
  vertices[name]=[numbers(line) for line in body.splitlines() if '{{{' in line]
  assert all(len(v)==10 for v in vertices[name]),name
 lists=dict(re.findall(r'const Gfx\s+(\w+)\[\]\s*=\s*\{(.*?)\};',model,re.S))
 state={'color':[0,0,255],'texture':None,'enabled':False,'slots':{}};meshes={}
 commands=re.compile(r'(gsSPVertex|gsSP1Triangle|gsSP2Triangles|gsSPDisplayList|gsSPLight|gsSPTexture|gsDPSetTextureImage)\(([^\)]*)\)')
 def mesh(name):
  batches=collections.OrderedDict()
  def execute(dl):
   for command,arguments in commands.findall(lists[dl]):
    args=[s.strip() for s in arguments.split(',')]
    if command=='gsSPLight' and args[1]=='1':state['color']=lights[re.search(r'&(\w+)\.l',args[0]).group(1)]
    elif command=='gsSPTexture':state['enabled']=args[-1]=='G_ON'
    elif command=='gsDPSetTextureImage':state['texture']=args[-1]
    elif command=='gsSPDisplayList':execute(args[0])
    elif command=='gsSPVertex':
     match=re.match(r'(\w+)(?:\s*\+\s*(\d+))?',args[0]);group=vertices[match[1]];offset=int(match[2] or 0)
     for j in range(int(args[1])):state['slots'][int(args[2])+j]=group[offset+j]
    elif command in ('gsSP1Triangle','gsSP2Triangles'):
     ids=numbers(arguments);triangles=[ids[:3]]+([ids[4:7]] if command=='gsSP2Triangles' else [])
     texture=state['texture'] if state['enabled'] else None;key=(tuple(state['color']),texture)
     batch=batches.setdefault(key,{'color':state['color'][:],'texture':texture,'position':[],'normal':[],'uv':[]})
     for tri in triangles:
      for i in tri:
       v=state['slots'][i];batch['position']+=v[:3];batch['normal'] += [(x-256 if x>127 else x)/127 for x in v[6:9]];batch['uv'] += [v[4]/1024,1-v[5]/1024]
  execute(name);return list(batches.values())
 bones=[
  ('root',-1,[0,0,0],None),('pelvis',0,[0,0,0],'mario_butt'),('torso',1,[68,0,0],'mario_torso'),('head',2,[87,0,0],'mario_cap_on_eyes_front'),
  ('left_shoulder',2,[67,-10,79],None),('left_upper_arm',4,[0,0,0],'mario_left_arm'),('left_forearm',5,[65,0,0],'mario_left_forearm_shared_dl'),('left_hand',6,[60,0,0],'mario_left_hand_closed'),
  ('right_shoulder',2,[68,-10,-79],None),('right_upper_arm',8,[0,0,0],'mario_right_arm'),('right_forearm',9,[65,0,0],'mario_right_forearm_shared_dl'),('right_hand',10,[60,0,0],'mario_right_hand_closed'),
  ('left_hip',1,[13,-8,42],None),('left_thigh',12,[0,0,0],'mario_left_thigh'),('left_shin',13,[89,0,0],'mario_left_leg_shared_dl'),('left_foot',14,[67,0,0],'mario_left_foot'),
  ('right_hip',1,[13,-8,-42],None),('right_thigh',16,[0,0,0],'mario_right_thigh'),('right_shin',17,[89,0,0],'mario_right_leg_shared_dl'),('right_foot',18,[67,0,0],'mario_right_foot')]
 for _,_,_,name in bones:
  if name:meshes[name]=mesh(name)
 def array(name):return numbers(re.search(name+r'\[\]\s*=\s*\{(.*?)\};',animation,re.S)[1])
 indices=array('anim_48_indices');values=array('anim_48_values');values=[v-65536 if v>=32768 else v for v in values]
 assert len(indices)==126 and len(bones)==20
 data={'source':{'repository':'n64decomp/sm64','revision':REVISION,'files_sha256':hashes,'animation':'MARIO_ANIM_WALKING (0x48)','frame_count':77,'game_fps':30,'reference_forward_speed':12,'animation_frames_per_game_frame':3,'render_note':'Original geometry and walk joint channels. Face texture graphics are simplified for this reference.'},'bones':[{'name':n,'parent':p,'offset':o,'mesh':m} for n,p,o,m in bones],'meshes':meshes,'animation':{'indices':indices,'values':values,'frames':77},'scale':.25}
 output.parent.mkdir(parents=True,exist_ok=True);output.write_text(json.dumps(data,separators=(',',':')))
 print(json.dumps({'bones':len(bones),'mesh_parts':len(meshes),'triangles':sum(len(b['position'])//9 for batches in meshes.values() for b in batches),'values':len(values),'bytes':output.stat().st_size}))
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--output',type=pathlib.Path,default=pathlib.Path('/tmp/sm64-reference-render/data.json'));args=parser.parse_args();extract(args.output)
