"""One constructed LetsGo island, with two exactly opposed review cameras."""
import bpy
import bmesh
import json
import math
import random
import sys
from pathlib import Path
from collections import defaultdict
from mathutils import Vector, Matrix

ROOT = Path(__file__).parent
data = json.loads((ROOT / 'layout.json').read_text())
C = data['cell']
LZ = data['water_z']
F1, KART, SWIM = (data[key] for key in ('f1','s_track','swim'))
CELLS = {(i,j):(h,intervals,wet,land) for i,j,h,intervals,wet,land in data['cells']}
A = data['activities']
GATES = data['gates']
SKI_PATH = data['ski_path']
R = random.Random(781024)
bpy.ops.wm.read_factory_settings(use_empty=True)

def hex_color(value):
    h = value.lstrip('#')
    srgb=[int(h[k:k+2],16)/255 for k in (0,2,4)]
    return tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in srgb)

def material(name, col, rough=.63, metal=0., light=0.):
    m=bpy.data.materials.new(name)
    m.use_nodes=True
    color=hex_color(col)
    m.diffuse_color=(*color,1)
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Roughness'].default_value=rough
    p.inputs['Metallic'].default_value=metal
    if light:
        p.inputs['Emission Color'].default_value=(*color,1)
        p.inputs['Emission Strength'].default_value=light
    return m

def pal(name, shades, rough=.68):
    return [material(f'{name} {i+1}', color, rough) for i,color in enumerate(shades.split())]

rock=pal('Rounded slate bedrock','686a77 7e7f8c 787681 959199 747580 8c8791 5f6270 797484')
rimrock=pal('Cliff sandstone','a78978 b89882 ae9382 c0a28a 9f877c b49b8a')
dirt=pal('Soil','705c47 83704d 937750 745d48 896d54')
grass=pal('Merged grass blocks','80a23a 84a83c 83a23c 8eab40 7c9e3c 91ab3d 84a73e 82a63d 88ab3e')
fairway=pal('Mown fairway','93bc51 81aa3f 9ac252 8bb54a')
snow=pal('Alpine snow','d7eaf5 e4eef9 eaf5ff ccdfea e1eaf5 daebf6',.86)
scree=pal('Snow ridge stone','748798 8396aa 91a4b3 65778b 9da9b6')
sand=pal('Sand and pool bottom','d5ac70 e6bc7e f1d098 c6a476')
ice=pal('Skating ice','8bd8ef bce9fb 9fdef5',.24)
leaf=pal('Garden leaf clusters','4c8044 6b9f44 55933c 3f7945 8dae4c 9caf49 6d963b')
pine=pal('Conifers','23534e 315d57 457456 397052 3c6f64 4a8062')
pink=pal('Flowering tree blocks','f991b9 df4e9b fba6cc fcc6de d65a9b c64b9c f68fc1')
floral=pal('Flower blocks','f36e92 d42161 a05ec6 e4aa48 f5c856 f192ad 85a9e4 dbde9f f3efce 7d5bb3')
flowergreen=pal('Flower leaves','47824c 659849 7aa247')
treebark=material('Trunk and separate roots','6b4d38',.8)
limestone=material('Pale limestone','e5d2b2',.75)
mediumstone=material('Masonry shade','c3ae98',.76)
creamm=material('Ivory trim','fff0d3',.62)
stoneblue=material('Bridge slate','a2adad',.7)
darkstone=material('Tunnel wall and interior','37434e',.83)
skirting=material('Bridge warm base','898889',.73)
pathmat=material('Warm sandstone walking path','dcbf95',.78)
pebbl=material('Gravel turnout','a89b8a',.89)
wood=material('Baked cedar posts','774d41',.83)
maple=material('Polished maple','d69b60',.42)
roofm=pal('Glazed roof tiles','a14f40 507282 4d837a 8d494a b66855 776789',.55)
white=material('Traffic white','fff6df',.63)
red=material('Red race paint','e54f4e',.54)
coral=material('Fairground coral','ef6a69',.53)
gold=material('Brass and gold paint','d5a65f',.42,.15)
amber=material('Amber lanterns','ffd28b',.32,0.0,2.0)
cold_lamp=material('Blue-white race beacons','92e6f7',.25,0,1.8)
cyanrail=material('Blue enamel rail','3ea7c2',.32,.27)
greylane=material('F1 asphalt','283a4c',.78)
kartlane=material('S circuit asphalt','44464d',.78)
rail=material('Rail brushed alloy','c3ccd0',.38,.35)
tyre=material('Tire and aperture black','19232d',.57)
steel=material('Steel frame','4c6874',.42,.35)
window=material('Window lit through glass','ffc389',.32,0,1.10)
glass=material('Conservatory blue glass','72c6ce',.14,.16)
glass.node_tree.nodes.get('Principled BSDF').inputs['Transmission Weight'].default_value=.3
mint=material('Putting green','7cbe59',.68)
felt=material('Pool table green','2e8260',.78)
tenblue=material('Court blue','729dc4',.61)
terracotta=material('Athletics clay','cc7660',.72)
lilac=material('Lilac details','b988c5',.46)
blue=material('Flag blue','4f8fc8',.5)
courseorange=material('Course cones','f7a35f',.53)
tiny_people=pal('People clothes','3b85aa bf554d 7e5589 eeb75c 567f69 2e5c8c e77d64 56546e',.59)
skin=material('People olive warm','f0b38d',.57)
fallwhite=material('Waterfall froth','e1f6f8',.31,0,.19)
fallblue=pal('Waterfall sheet','6fd2e5 93e4ef b8edf5 83dbe8 7dd2e2',.28)
walk_wood=material('Wooden footbridge','b58860',.67)

wat=material('Moving lagoon water','38bac7',.22,.13)
wt=wat.node_tree
node=wt.nodes.get('Principled BSDF')
node.inputs['Coat Weight'].default_value=.42
node.inputs['IOR'].default_value=1.333
node.inputs['Transmission Weight'].default_value=.09
uv=wt.nodes.new('ShaderNodeTexCoord')
noise=wt.nodes.new('ShaderNodeTexNoise')
noise.inputs['Scale'].default_value=.72
noise.inputs['Detail'].default_value=3.3
noise.inputs['Roughness'].default_value=.58
wt.links.new(uv.outputs['Object'],noise.inputs['Vector'])
ramp=wt.nodes.new('ShaderNodeValToRGB')
ramp.color_ramp.elements[0].position=.18
ramp.color_ramp.elements[0].color=(*hex_color('187ca3'),1)
ramp.color_ramp.elements[1].position=.83
ramp.color_ramp.elements[1].color=(*hex_color('6bdece'),1)
wt.links.new(noise.outputs['Fac'],ramp.inputs[0])
wt.links.new(ramp.outputs[0],node.inputs['Base Color'])
bump=wt.nodes.new('ShaderNodeBump')
bump.inputs['Strength'].default_value=.29
bump.inputs['Distance'].default_value=.21
wt.links.new(noise.outputs['Fac'],bump.inputs['Height'])
wt.links.new(bump.outputs[0],node.inputs['Normal'])

def add_noise(mat, scale, colors, normal=.09):
    t=mat.node_tree; pt=t.nodes.get('Principled BSDF')
    coord=t.nodes.new('ShaderNodeTexCoord')
    n=t.nodes.new('ShaderNodeTexNoise')
    n.inputs['Scale'].default_value=scale
    n.inputs['Detail'].default_value=2.8
    n.inputs['Roughness'].default_value=.67
    ramp=t.nodes.new('ShaderNodeValToRGB')
    for i,color in enumerate(colors):
        ramp.color_ramp.elements[i].color=(*hex_color(color),1)
        ramp.color_ramp.elements[i].position=(.20,.82)[i]
    t.links.new(coord.outputs['Object'],n.inputs['Vector'])
    t.links.new(n.outputs['Fac'],ramp.inputs['Fac'])
    t.links.new(ramp.outputs[0],pt.inputs['Base Color'])
    b=t.nodes.new('ShaderNodeBump')
    b.inputs['Distance'].default_value=normal
    b.inputs['Strength'].default_value=.23
    t.links.new(n.outputs['Fac'],b.inputs['Height'])
    t.links.new(b.outputs[0],pt.inputs['Normal'])

add_noise(greylane,1.07,('283545','425462'),.043)
add_noise(kartlane,1.3,('34363e','4d5259'),.055)
for m in glass,window:
    m.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.2

# Batch by named material so thousands of rounded blocks share a small draw list.
BATCH={}
def geo(mat, vertices, faces):
    verts, polys = BATCH.setdefault(mat,([],[]))
    off=len(verts)
    verts.extend(vertices)
    polys.extend(tuple(off+i for i in face) for face in faces)

def quad(mat, p):
    geo(mat,p,[(0,1,2,3)])

def cube_template(r):
    bm=bmesh.new()
    bmesh.ops.create_cube(bm,size=1)
    if r:
        bmesh.ops.bevel(bm,geom=list(bm.edges),offset=r,segments=1,affect='EDGES')
    bm.verts.index_update()
    out=([tuple(v.co) for v in bm.verts],[tuple(v.index for v in f.verts) for f in bm.faces])
    bm.free()
    return out

CUBES=[cube_template(b) for b in (0,.033,.095)]
def box(x,y,z,a,b,c,mat,rot=0.,soft=1):
    if min(a,b,c)<=.001: return
    cs,sn=math.cos(rot),math.sin(rot)
    pts,fs=CUBES[soft]
    geo(mat,[(x+u*a*cs-v*b*sn,y+u*a*sn+v*b*cs,z+w*c) for u,v,w in pts],fs)

def beam(a,b, wide, deep, mat, soft=1):
    a,b=Vector(a),Vector(b); d=b-a
    if d.length<.01: return
    matrix=Vector((0,0,1)).rotation_difference(d.normalized()).to_matrix()
    cp=(a+b)*.5
    v,fs=CUBES[soft]
    geo(mat,[tuple(cp+matrix@Vector((x*wide,y*deep,z*d.length))) for x,y,z in v],fs)

def cyl(a,b,r,mat,sides=10,r2=None,caps=True):
    a,b=Vector(a),Vector(b); d=b-a
    if d.length<.001: return
    rot=Vector((0,0,1)).rotation_difference(d.normalized()).to_matrix()
    r2=r if r2 is None else r2
    ring=[Vector((math.cos(2*math.pi*i/sides),math.sin(2*math.pi*i/sides),0)) for i in range(sides)]
    verts=[tuple(end+rot@(p*rad)) for end,rad in [(a,r),(b,r2)] for p in ring]
    f=[(i,(i+1)%sides,(i+1)%sides+sides,i+sides) for i in range(sides)]
    if caps: f.extend([tuple(range(sides-1,-1,-1)),tuple(range(sides,2*sides))])
    geo(mat,verts,f)

def poly_disk(x,y,z,r1,r2,mat,n=38):
    pts=[(x+r1*math.cos(2*math.pi*i/n),y+r2*math.sin(2*math.pi*i/n),z) for i in range(n)]
    geo(mat,pts,[tuple(range(n))])

def torus_ring(cen,r,thick,mat,tilt=None,n=28):
    T=Matrix.Identity(3) if tilt is None else tilt
    pts=[Vector(cen)+T@Vector((r*math.cos(i*2*math.pi/n),r*math.sin(i*2*math.pi/n),0)) for i in range(n)]
    for i,a in enumerate(pts):
        cyl(a,pts[(i+1)%n],thick,mat,6)

def panel_rect(x,y,z,a,b,mat):
    quad(mat,[(x-a/2,y-b/2,z),(x+a/2,y-b/2,z),(x+a/2,y+b/2,z),(x-a/2,y+b/2,z)])

def path_line(points,w,mat,closed=False,zadd=0):
    if len(points)<2:return
    edges=[]
    for i,p in enumerate(points):
        q=points[(i-1)%len(points)] if closed or i else points[i]
        r=points[(i+1)%len(points)] if closed or i<len(points)-1 else points[i]
        dx,dy=r[0]-q[0],r[1]-q[1]; s=math.hypot(dx,dy)
        if s<=.001:s=1.
        nx,ny=-dy*w/(2*s),dx*w/(2*s)
        edges.extend(((p[0]+nx,p[1]+ny,p[2]+zadd),(p[0]-nx,p[1]-ny,p[2]+zadd)))
    indices=[(2*i,2*i+1,2*((i+1)%len(points))+1,2*((i+1)%len(points))) for i in range(len(points)-(0 if closed else 1))]
    geo(mat,edges,indices)

def at(x,y,default=-120):
    return CELLS.get((round(x/C),round(y/C)),(default,None,False,None))[0]

def nearest_road(x,y,track,width,step=6):
    return min((x-p[0])**2+(y-p[1])**2 for p in track[::step]) < width**2

def basis(points,i,wrap):
    p=points[i]
    a=points[(i-1)%len(points)] if wrap or i else p
    b=points[(i+1)%len(points)] if wrap or i<len(points)-1 else p
    tx,ty=b[0]-a[0],b[1]-a[1]
    n=math.hypot(tx,ty)
    return p,(tx/n,ty/n),(-ty/n,tx/n)

def model_terrain():
    for (i,j),(h,segments,wet,land) in CELLS.items():
        x,y=i*C,j*C
        for start,end,top in segments:
            if end-start<.12: continue
            # Buried columns share internal block faces. The exposed layers
            # change in whole vertical courses rather than textured seams alone.
            exposed=any((i+di,j+dj) not in CELLS or
                  CELLS[(i+di,j+dj)][0] < end-.8
                  for di,dj in [(1,0),(-1,0),(0,1),(0,-1)])
            if start<-3 and not exposed: # visible undersides use larger intact stone masses
                bottom_thick=min(8.6,end-start)
                box(x,y,start+bottom_thick/2,C+.018,C+.018,bottom_thick,rock[(i*11+j*7)%len(rock)],soft=0)
                start+=bottom_thick
            stripe=end-2.25 if top in ('grass','fairway','sand') else end
            stripe=max(start,stripe)
            z=start
            while z<stripe-.11:
                depth=stripe-z
                height=min(depth, (8.60 if z<-12 else 4.30) if exposed else depth)
                colors=scree if top=='snow' and z>26 else (rimrock if z>-19 else rock)
                block=colors[(i*71+j*31+int(z//4.3)*13)%len(colors)]
                size=C + .018 if not exposed else C+.035
                box(x,y,z+height/2,size,size,height,block,soft=0 if not exposed else 1)
                z+=height
            if end>stripe+.1:
                under=sand if top=='sand' else dirt
                box(x,y,stripe+(end-stripe)*.47,C+.025,C+.025,(end-stripe)*.94,under[(i+3*j)%len(under)],soft=0)
                cl=sand if top=='sand' else (fairway if top=='fairway' else grass)
                index=(i//3+j%4)%len(cl) if top=='fairway' else (i*71+j*53+(i//4)*37)%len(cl)
                box(x,y,end-.095,C+.035,C+.035,.19,cl[index],soft=0)
            elif top=='snow':
                # A thin rounded snow overhang follows each exposed voxel.
                cl=snow[(i//3+3*j)%len(snow)]
                box(x,y,end-.08,C+.10,C+.10,.25,cl,soft=1)
            if top=='rock' and end>22:
                box(x,y,end-.07,C+.016,C+.016,.13,darkstone,soft=0)
        if wet:
            panel_rect(x,y,wet,C+.008,C+.008,wat)

def s_pit_open(p):
    x,y,_=p
    return GATES['S kart staging'][0]-17 < x < GATES['S kart staging'][0]+8 and y < -71


def road(points,width,f1):
    mat=greylane if f1 else kartlane
    # Flatten azimuth only. Adjacent sections share endpoints including the
    # explicit last-to-first faces, so the same road is used in each render.
    path_line(points,width,mat,True)
    path_line(points,width+1.26,stoneblue if f1 else mediumstone,True,-.14)
    path_line(points,width+.9,skirting,True,-1.66 if f1 else -.72)
    for sign in (-1,1):
        inner=[]; outer=[]; posts=[]
        for i in range(len(points)):
            (x,y,z),t,n=basis(points,i,True)
            dx,dy=n
            offset=sign*(width*.5+.46)
            inner.append((x+dx*offset,y+dy*offset,z+.18))
            top=z+(1.25 if f1 else .64)
            if i%4==0:
                outer.append(((x+dx*offset,y+dy*offset,top),not f1 and s_pit_open((x+dx*offset,y+dy*offset,z)) and dy*sign<0))
            if i%(9 if f1 else 14)==0 and (f1 or not s_pit_open((x+dx*offset,y+dy*offset,z)) or dy*sign>0):
                posts.append((x+dx*offset,y+dy*offset,z,top))
        path_line(inner,.33,cyanrail if f1 else creamm,True)
        for k,a in enumerate(inner):
            b=inner[(k+1)%len(inner)]
            da,db=(a[0],a[1],a[2]-(1.85 if f1 else .90)),(b[0],b[1],b[2]-(1.85 if f1 else .90))
            quad(stoneblue if f1 else mediumstone,[a,b,db,da])

        for i,(edge,skip) in enumerate(outer):
            next_edge, next_skip=outer[(i+1)%len(outer)]
            if not skip and not next_skip:
                cyl(edge,next_edge,.12 if f1 else .08,rail if f1 else creamm,7)
        for x,y,z,top in posts:
            box(x,y,(z+top)/2,.23,.21,top-z+.14,rail if f1 else stoneblue,soft=1)
        # Painted curbs are shallow and leave the asphalt smooth.
        road_side=[((p[0]-n[0]*sign*.58,p[1]-n[1]*sign*.58,p[2]+.02),p)
                   for i,p in enumerate(inner) for _,_,n in [basis(points,i,True)]]
        block=5 if f1 else 4
        for i in range(len(road_side)):
            a,b=road_side[i]; c,d=road_side[(i+1)%len(road_side)]
            if not f1 or i//5%7 in (0,1,2):
                quad((white if (i//block)%2==0 else (cyanrail if f1 else red)),[a,c,d,b])
    j=118 if f1 else 12
    p,t,n=basis(points,j,True)
    stripe=width/10
    for i in range(2):
        for k in range(10):
            length=stripe*(i-.5)
            across=stripe*(k-4.5)
            box(p[0]+t[0]*length+n[0]*across,p[1]+t[1]*length+n[1]*across,p[2]+.075,stripe,stripe,.08,
                white if (i+k)%2==0 else tyre,math.atan2(t[1],t[0]),0)
    if not f1:
        return

    decorate_f1(points,width)


def decorate_f1(points,width):
    edge = [(i*C,j*C,h) for (i,j),(h,_,_,_) in CELLS.items()
            if any((i+u,j+v) not in CELLS for u,v in [(1,0),(-1,0),(0,1),(0,-1)])]
    port_start,port_end=data['f1_ports']
    for i in range(0,len(points),16):
        if port_start-10 < i < port_end+10:
            continue
        p,t,n=basis(points,i,True)
        x,y,z=p
        heading=math.atan2(t[1],t[0])
        for side in [-1,1]:
            off=side*(width*.5+.52)
            box(x+n[0]*off,y+n[1]*off,z-.46,10.6,.23,.31,cold_lamp,heading,0)
        if i%48:
            continue
        h=at(x,y)
        if h>=z-2.7:
            continue
        if h>-100:
            pier_base=h-.40
        else:
            ax,ay,top=min(edge,key=lambda v:(x-v[0])**2+(y-v[1])**2)
            pier_base=z-24.0
            # A diagonal masonry rib ties each offshore pier back to rock.
            anchor=(ax,ay,min(top-8.60,pier_base-9.1))
            pivot=(x,y,pier_base+1.0)
            curve=[tuple(Vector(anchor).lerp(Vector(pivot),u/9)) for u in range(10)]
            for a,b in zip(curve,curve[1:]):
                beam(a,b,3.2,2.5,mediumstone)
            box(*anchor,5.8,5.8,4.3,limestone,soft=1)
        shaft_top=z-1.42
        box(x,y,(pier_base+shaft_top)*.5,3.45,5.1,shaft_top-pier_base,limestone,heading)
        for h1,w,d in [(z-6.3,5.55,5.98),(z-1.7,5.33,width+.40)]:
            if h1>pier_base:
                box(x,y,h1,w,d,.88,creamm,heading)

        for sign in (-1,1):
            drop=min(14.3,z-pier_base-.31)
            curve=[]
            for j in range(12):
                u=j/11
                q=points[(i+sign*2*j)%len(points)]
                curve.append((q[0],q[1],q[2]-1.24-drop*(1-u)**2.7))
            for a,b in zip(curve,curve[1:]):
                beam(a,b,2.78,1.68,limestone)

def arch_ring(mat, center, t, half, spring, rise, depth, thickness):
    x,y,z=center
    tx,ty=t; nx,ny=-ty,tx
    def point(r,z,q):return (x+nx*r+tx*q,y+ny*r+ty*q,z)
    for side in [-1,1]:
        for h in range(math.ceil(spring/1.2)):
            hh=spring/math.ceil(spring/1.2)
            u=side*(half+thickness*.5)
            box(x+nx*u,y+ny*u,z+hh*(h+.5),depth,thickness,hh-.035,mat,math.atan2(ty,tx),1)
    for k in range(15):
        a=(k+.022)*math.pi/15; b=(k+.978)*math.pi/15; points=[]
        for q in [-depth/2,depth/2]:
            points.extend([point(half*math.cos(a),z+spring+rise*math.sin(a),q),
                           point(half*math.cos(b),z+spring+rise*math.sin(b),q),
                           point((half+thickness)*math.cos(b),z+spring+(rise+thickness)*math.sin(b),q),
                           point((half+thickness)*math.cos(a),z+spring+(rise+thickness)*math.sin(a),q)])
        geo(mat,points,[(0,1,2,3),(4,7,6,5),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)])

def tunnels():
    for k,idx in enumerate(data['f1_ports']):
        p,t,n=basis(F1,idx,True)
        out=-1 if k==0 else 1
        arch_ring(limestone,(p[0],p[1],p[2]-.85),t,8.75,4.97,4.15,3.05,1.38)
        arch_ring(stoneblue,(p[0]+out*t[0]*1.71,p[1]+out*t[1]*1.71,p[2]-.85),t,8.82,4.93,4.37,.5,.5)
        for side in [-1,1]:
            x,y=p[0]+n[0]*side*8.67,p[1]+n[1]*side*8.67
            box(x,y,p[2]+5.1,3,.61,.7,amber,math.atan2(t[1],t[0]))
            box(x,y,p[2]+1.25,2.5,.58,.53,cold_lamp,math.atan2(t[1],t[0]))
    for i in range(data['f1_ports'][0]+5,data['f1_ports'][1],8):
        p,t,n=basis(F1,i,True)
        for side in [-1,1]:
            x,y=p[0]+n[0]*side*6.65,p[1]+n[1]*side*6.65
            box(x,y,p[2]+7.4,2.1,.48,.15,amber,math.atan2(t[1],t[0]))
    for k,idx in enumerate(data['swim_ports']):
        p,t,n=basis(SWIM,idx,False)
        p=(p[0]+(-1 if k==0 else 1)*t[0]*1.43,p[1]+(-1 if k==0 else 1)*t[1]*1.43,p[2])
        arch_ring(limestone,(p[0],p[1],LZ-2.0),t,6.15,3.0,3.79,2.22,1.07)
        for side in [-1,1]:
            x,y=p[0]+n[0]*side*6.0,p[1]+n[1]*side*6.0
            box(x,y,LZ+2.12,1.95,.64,.5,amber,math.atan2(t[1],t[0]))

def walkway(points,mat=pathmat,w=3.5):
    path_line(points,w,mat)
    path_line(points,w+.47,mediumstone,False,-.26)
    for a,b in zip(points,points[1:]):
        length=math.dist(a[:2],b[:2])
        rise=b[2]-a[2]
        if length<.05 or abs(rise)<length*.25:
            continue
        heading=math.atan2(b[1]-a[1],b[0]-a[0])
        for k in range(3):
            u=(k+.5)/3
            z=min(a[2]+rise*k/3,a[2]+rise*(k+1)/3)+abs(rise)/3
            box(a[0]*(1-u)+b[0]*u,a[1]*(1-u)+b[1]*u,z+.02,length/3+.07,w+.045,.17,limestone,heading,0)
    for j,p in enumerate(points):
        x,y,z=p
        if j%8==0 and at(x,y)<z-1.1 and not nearest_road(x,y,KART,5.) and not nearest_road(x,y,SKI_PATH,10.,2):
            h=at(x,y)
            if h<-20:h=z-9
            box(x,y,h+(z-h)/2,.87,1.03,z-h,mediumstone,soft=1)
            for side in [-1,1]:
                _,t,n=basis(points,j,False)
                edge=(x+n[0]*side*w/2,y+n[1]*side*w/2,z)
                box(edge[0],edge[1],z+.63,.19,.19,1.28,wood)
        if j%5==0 and at(x,y)<z-1.1 and j+5<len(points):
            for side in [-1,1]:
                a,t,n=basis(points,j,False); b,_,m=basis(points,j+5,False)
                start=(a[0]+n[0]*side*w*.5,a[1]+n[1]*side*w*.5,a[2]+1.22)
                end=(b[0]+m[0]*side*w*.5,b[1]+m[1]*side*w*.5,b[2]+1.22)
                beam(start,end,.18,.20,wood)


def waterfall_sheet(x,y,start,end,width,reach):
    for band in range(10):
        sx=x+width*((band+.5)/10-.5)
        wide=width/10*(1.23 if band%2 else 1.07)
        coords=[]
        for k in range(53):
            u=k/52
            yy=y-reach*u**.60
            zz=start+(end-start)*u
            xx=sx+.14*math.sin(k*.83+band)+.21*math.sin(u*16+band)
            w=wide*(1+.22*u+.12*math.sin(k*.33+band))
            coords.extend([(xx-w/2,yy,zz),(xx+w/2,yy+.09,zz-.05)])
        geo(fallblue[band%len(fallblue)],coords,[(i*2,i*2+1,i*2+3,i*2+2) for i in range(52)])
    for i in range(30):
        xx=x+R.uniform(-width*.56,width*.56)
        yy=y-reach+R.uniform(-1.3,.67)
        start_z=end+R.uniform(-.3,2.4)
        cyl((xx,yy,start_z),(xx+R.uniform(-.25,.25),yy-.35,start_z+.56),
            R.uniform(.04,.26),fallwhite,6)
    for i in range(8):
        yy=y-reach-i*.39
        poly_disk(x,yy,end+.11,width*.49+i*.12,.22,fallwhite,23)


def draw_waterfalls():
    for spill in data['outfalls']:
        col=round(spill['x']/C)
        edge=min(j for (i,j),(_,_,wet,_) in CELLS.items() if i==col and wet==LZ)
        waterfall_sheet(col*C,(edge-.5)*C,LZ,-84.,spill['width'],6.7)
    for pool in data['cascades']:
        x,y,z=pool['x'],pool['lip'],pool['surface']
        # A mountain pool is inset in the slope at each step.
        lip=max(at(x,y+2.1),z+5.16)
        waterfall_sheet(x,y+2.1,lip,z,min(9.0,pool['a']*.74),3.15)
    # Stone-lined spill shelf at the rear of the diving pool.
    x,y=-52,-91.8
    box(x,y,16.55,13.2,3.95,5.4,limestone,soft=1)
    panel_rect(x,y,19.32,12.2,3.6,wat)
    waterfall_sheet(x,y-1.7,19.3,LZ,12.1,5.6)


model_terrain()
road(F1,data['f1_width'],True)
road(KART,data['s_width'],False)
tunnels()
for name,points in data['walks'].items():
    walkway(points,walk_wood if name in {'mini golf bridge','adventure to carnival','upper terraces'} else pathmat)
draw_waterfalls()

PAD_AREAS=[]
def occupied(cx,cy,a,b):
    PAD_AREAS.append((cx,cy,a/2,b/2))

def pad(x,y,a,b,color,base=None,detail=True):
    # Every play pad has its own stepped modular foundation.
    samples=[at(x+dx*a*.46,y+dy*b*.46) for dx in (-1,0,1) for dy in (-1,0,1)]
    z=(max(samples)+.16) if base is None else base
    h=max(1., min(z-min(samples),8.6))
    box(x,y,z-h*.5-.19,a+.8,b+.8,h,mediumstone,soft=1)
    box(x,y,z-.12,a,b,.24,color,soft=1)
    if detail:
        for t in range(math.ceil(a/2.15)):
            xx=x-a/2+(t+.5)*a/math.ceil(a/2.15)
            box(xx,y-b/2-.19,z-.62,a/math.ceil(a/2.15)-.085,.63,1.27,limestone)
    occupied(x,y,a+1,b+1)
    return z

def paint(x,y,z,a,b,c=white,rot=0.):
    box(x,y,z+.037,a,b,.072,c,rot,soft=0)

def lamppost(x,y,z,h=3.7, col=amber):
    box(x,y,z+.20,.73,.73,.40,mediumstone)
    cyl((x,y,z+.23),(x,y,z+h-.6),.13,steel,7)
    box(x,y,z+h-.37,.7,.7,.49,col)
    box(x,y,z+h-.015,.85,.85,.24,steel)

def person(x,y,z,mode='walk',heading=0,col=None,scale=1.0):
    m=col or R.choice(tiny_people)
    sc=scale
    rot=math.atan2(math.sin(heading),math.cos(heading))
    def p(a,b,c):
        return (x+sc*(a*math.cos(rot)-b*math.sin(rot)),y+sc*(a*math.sin(rot)+b*math.cos(rot)),z+sc*c)
    if mode=='swim':
        box(x,y,z+.10,.55*sc,.85*sc,.29*sc,m,rot,2)
        cyl(p(0,.48,-.07),p(0,.48,.25),.22*sc,skin,8)
        cyl(p(.19,.09,.03),p(.43,.55,.23),.095*sc,skin,6)
        cyl(p(-.19,.1,.04),p(-.40,-.30,.04),.095*sc,skin,6)
        return
    box(x,y,z+1.04*sc,.46*sc,.38*sc,.66*sc,m,rot,2)
    cyl(p(0,0,1.32),p(0,0,1.75),.186*sc,skin,8)
    box(x,y,z+1.77*sc,.39*sc,.40*sc,.15*sc,m,rot,2)
    stride=.37 if mode!='stand' else .07
    for side in (-1,1):
        cyl(p(.115*side,0,.84),p(.15*side,stride*side,.13),.092*sc,tyre,6)
        end=p(.41*side, .31 if side==1 else -.25,1.24 if mode in ('throw','ski','paint') else .88)
        cyl(p(.21*side,0,1.23),end,.079*sc,m,7)
    if mode=='ski':
        for side in (-1,1):
            beam(p(side*.23,-.8,.08),p(side*.23,1,.08),.12,.14,blue)
            cyl(p(side*.40,-.32,.10),p(side*.40,.26,.99),.023,rail,5)
    if mode=='skate':
        beam(p(0,-.65,.04),p(0,.6,.07),.38,.10,coral,2)

def roof(x,y,z,a,b,rise,mat):
    x0,x1=x-a/2,x+a/2; y0,y1=y-b/2,y+b/2
    v=[(x0,y0,z),(x1,y0,z),(x1,y1,z),(x0,y1,z),(x,y0,z+rise),(x,y1,z+rise)]
    geo(mat,v,[(0,1,4),(1,2,5,4),(2,3,5),(3,0,4,5),(0,3,2,1)])
    for i in range(1,6):
        t=i/6
        for sign in (-1,1):
            xx=x+sign*a*.5*(1-t)
            yy=z+rise*t
            beam((xx,y0-.03,yy),(xx,y1+.03,yy),.18,.5,creamm if mat==snow[0] else mat)
    beam((x,y0-.33,z+rise+.10),(x,y1+.33,z+rise+.1),.47,.36,stoneblue if mat==snow[0] else wood)

def house(x,y,a=9,b=8,h=7,kind='garden',levels=1):
    z=max(at(x+dx*a*.37,y+dy*b*.38) for dx in (-1,0,1) for dy in (-1,0,1))
    if z<-50:return
    occupied(x,y,a+2,b+2)
    box(x,y,z+.40,a+1,b+1,.8,mediumstone)
    winter=kind=='alpine'
    mat=wood if winter else R.choice([limestone,creamm,floral[5],leaf[4]])
    roofmat=R.choice(roofm)
    mult=h*levels
    box(x,y,z+mult/2+.62,a,b,mult,mat,soft=1)
    for k in range(levels):
        for side in (-1,1):
            gy=y+side*(b*.5+.089)
            for i in [-1,0,1]:
                if i==0 and k==0:
                    box(x,gy,z+1.5,1.7,.28,2.45,wood)
                    box(x,gy-.035,z+2.16,.98,.31,.61,window)
                else:
                    box(x+i*a*.298,gy,z+k*h+h*.58,a*.16,.28,h*.31,creamm)
                    box(x+i*a*.298,gy+side*.16,z+k*h+h*.58,a*.126,.18,h*.25,window)
                    box(x+i*a*.298,gy+side*.22,z+k*h+h*.58,.095,.14,h*.25,wood,soft=0)
            gx=x+side*(a*.5+.1)
            for off in [-.25,.25]:
                box(gx,y+off*b,z+k*h+h*.61,.23,1.18,h*.25,window)
        if winter or levels>1:
            box(x,y,z+k*h+.69,a+.6,b+.6,.27,wood)
    ytop=z+mult+.57
    roof(x,y,ytop,a+.87,b+.85,a*.43,roofmat)
    if winter:
        roof(x,y,ytop+.18,a+1.06,b+1.02,a*.44,snow[0])
    box(x+a*.25,y+b*.19,ytop+a*.36,1.05,1.08,2.55,mediumstone)
    box(x+a*.25,y+b*.19,ytop+a*.36+1.27,1.25,1.22,.22,roofmat)
    for side in [-1,1]:
        lamppost(x+a*.58, y+b*.48*side,z,2.8)

def conservatory(x,y):
    z=pad(x,y,38,27,limestone,detail=True)
    box(x,y,z+.51,29,22,1.01,creamm)
    box(x,y,z+3.25,27,20,4.52,glass)
    for side in (-1,1):
        for n in range(9):
            xx=x+(n-4)*3.26
            gy=y+side*10.5
            box(xx,gy,z+3.45,.84,.84,6.06,limestone,soft=2)
            box(xx,gy,z+.84,1.22,1.22,.48,creamm)
            box(xx,gy,z+6.25,1.33,1.33,.58,creamm)
        for n in range(6):
            box(x+side*13.65,y+(n-2.5)*4.,z+3.5,.83,.85,6.24,limestone,soft=2)
    box(x,y,z+6.76,29.2,22.5,1.10,creamm)
    a,b,hh=12.7,9.3,10.2
    grid=[]
    for v in range(7):
        t=math.pi*.5*v/6.
        grid.extend([(x+a*math.cos(t)*math.cos(u*math.pi/12),y+b*math.cos(t)*math.sin(u*math.pi/12),
                      z+7.25+hh*math.sin(t)) for u in range(24)])
    geo(glass,grid,[(i*24+j,i*24+(j+1)%24,(i+1)*24+(j+1)%24,(i+1)*24+j) for i in range(6) for j in range(24)])
    for i in range(7):
        for j in range(24):
            ix=i*24+j
            cyl(grid[ix],grid[i*24+(j+1)%24],.12,gold,6)
            if i<6:cyl(grid[ix],grid[(i+1)*24+j],.16 if j%3 else .25,creamm,7)
    cyl((x,y,z+16.95),(x,y,z+19.43),.34,gold,10,r2=.09)
    torus_ring((x,y,z+18.54),.69,.19,gold,n=12)
    for side in [-1,1]:
        arch_ring(creamm,(x,y+side*10.8,z+.6),(0,1),2.2,3.9,1.82,.72,.43)
    for n in range(4):
        box(x,y-12.5-n*1.25,z-.07-n*.27,10.4+n*.46,1.25,.38,limestone)
    fx,fy=x,y-17.5
    atf=at(fx,fy)
    if atf>-40:
        cyl((fx,fy,atf),(fx,fy,atf+.89),4.25,creamm,18)
        poly_disk(fx,fy,atf+.92,3.73,3.73,wat)
        torus_ring((fx,fy,atf+1.04),3.72,.24,limestone,n=24)
        cyl((fx,fy,atf+.62),(fx,fy,atf+3.13),.62,limestone,12,r2=.34)
        for i in range(8):
            a=i*math.pi/4
            pts=[]
            for j in range(6):
                t=j/5
                pts.append((fx+math.cos(a)*2.78*t,fy+math.sin(a)*2.78*t,atf+3.43+1.07*math.sin(t*math.pi)-2.4*t))
            for p,q in zip(pts,pts[1:]):cyl(p,q,.062,fallwhite,6)

def conservatory_arcade(x,y):
    z=at(x,y)+.07
    if z < 8:
        return
    a=13.2
    box(x,y,z-.62,a,6.38,1.28,limestone)
    for i in range(3):
        xx=x+(i-1)*4.35
        arch_ring(creamm,(xx,y-2.40,z),(0,1),1.61,3.35,1.59,1.12,.47)
        arch_ring(creamm,(xx,y+2.40,z),(0,1),1.61,3.35,1.59,1.12,.47)
        for j in range(6):
            yy=y+R.uniform(-2.87,2.87)
            zz=z+5.55-R.uniform(0,1.50)
            box(xx+R.uniform(-1.6,1.6),yy,zz,.59,.48,.72,R.choice(pink),soft=2)
    box(x,y,z+5.40,a+.40,6.15,.34,limestone)
    occupied(x,y,a+1,7)


def garden_pergola(x,y):
    z=at(x,y)
    if z<-70:return
    for dx in [-5,-1.7,1.7,5]:
        for dy in [-2.2,2.2]:
            box(x+dx,y+dy,z+2.4,.66,.66,4.8,wood,soft=2)
            box(x+dx,y+dy,z+.46,.98,.98,.92,limestone)
    for dy in [-2.2,2.2]:
        beam((x-5.8,y+dy,z+4.8),(x+5.8,y+dy,z+4.8),.52,.48,wood)
    for dx in range(-5,6):
        beam((x+dx,y-2.8,z+5.),(x+dx,y+2.8,z+5.),.16,.18,wood)
    for dx in [-3,0,3]:
        for dy in [-1.3,.72]:
            box(x+dx,y+dy,z+5.24,3,1.72,.51,R.choice(leaf))
            for i in range(4):
                box(x+dx+R.uniform(-1,1),y+dy+R.uniform(-.5,.5),z+4.94-R.uniform(0,1.91),.37,.37,.58,
                    R.choice([floral[2],floral[5],floral[6]]),soft=2)
    occupied(x,y,12,6)

def striped_roof(x,y,z,a,b,s):
    for i in range(10):
        xx=x+(i-4.5)*a/10.
        for j in range(5):
            py=y-b/2+(j+.5)*b/5
            pz=z+1.4*math.sin(math.pi*(j+.5)/5)
            box(xx,py,pz,a/10+.019,b/5+.10,.23,s if i%2==0 else creamm,soft=2)
    box(x,y-b/2-.12,z-.24,a+.06,.31,.45,s)

def arcade(name,x,y,kton):
    sizes={mat:len(v) for mat,(v,faces) in BATCH.items()}
    z=pad(x,y,12.4,9.65,maple,base=min(max(at(x,y)+.20,18.3),23.8),detail=False)
    for dx in [-5.43,5.43]:
        for dy in [-4.30,4.30]:
            box(x+dx,y+dy,z+2.16,.48,.48,4.33,wood)
    box(x,y+4.5,z+1.06,12.1,.36,2.05,wood)
    striped_roof(x,y+1.56,z+4.3,12.62,6.5,kton)
    for dx in [-3.7,0,3.7]:
        box(x+dx,y+3.84,z+3.63,.83,.41,.37,window)
    if name=='bowling':
        for i in range(3):
            xx=x+(i-1)*3.48
            box(xx,y-.33,z+.13,2.46,7.35,.24,maple)
            for t in (-1,1):
                box(xx+t*1.26,y-.33,z+.17,.15,7.4,.29,tyre)
            for dx,dy in [(0,0),(-.35,.45),(.35,.45),(-.68,.85),(0,.85),(.68,.85)]:
                cx,cy=xx+dx,y+2.4+dy
                cyl((cx,cy,z+.25),(cx,cy,z+.65),.12,white,7,r2=.084)
                cyl((cx,cy,z+.65),(cx,cy,z+.74),.078,coral,7)
            poly_disk(xx,y-2.07,z+.26,.28,.28,R.choice(tiny_people),10)
    elif name=='skee-ball':
        for i in range(3):
            xx=x+(i-1)*3.53
            beam((xx,y-3.8,z+.57),(xx,y+2.25,z+1.32),2.52,.43,gold)
            for t in (-1,1):
                beam((xx+t*1.27,y-3.73,z+.44),(xx+t*1.25,y+2.27,z+1.48),.18,.27,coral)
            box(xx,y+2.86,z+1.69,2.69,.61,2.67,kton)
            for r,u,off in [(.73,0,0),(.35,.55,-.28),(.35,.55,.28),(.27,-.52,0)]:
                torus_ring((xx+off,y+2.51,z+1.83+u),r,.076,creamm,Matrix.Rotation(math.pi/2,3,'X'),18)
    elif name=='billiards':
        for dx in [-2.86,2.86]:
            cx=x+dx
            for l in range(2):
                for t in range(2):
                    box(cx+(l-.5)*1.66,y+(t-.5)*3.7,z+.55,.35,.42,1.12,wood)
            box(cx,y,z+1.2,2.81,4.83,.46,wood)
            box(cx,y,z+1.45,2.46,4.46,.076,felt)
            for t in [-1,0,1]:
                for l in [-1,1]:
                    poly_disk(cx+l*1.14,y+t*2.13,z+1.50,.16,.166,tyre,12)
            for i in range(7):
                poly_disk(cx+R.uniform(-.58,.58),y+R.uniform(-.64,.42),z+1.50,.087,.088,R.choice(tiny_people),7)
    else:
        for dx in [-2.83,2.83]:
            cen=(x+dx,y+3.73,z+2.29)
            target(cen[0],cen[1],cen[2],1.04,['dark','cream','dark','coral'])
            paint(x+dx,y+.1,z,2.,.20,creamm)
    person(x+R.uniform(-4,4),y-4.06,z,heading=0,scale=1.1)
    for mat,(vertices,_) in BATCH.items():
        for j in range(sizes.get(mat,0),len(vertices)):
            a,b,c=vertices[j]
            vertices[j]=(x+(a-x)*1.19,y+(b-y)*1.45,c)
    occupied(x,y,16,15.4)

def target(x,y,z,r,colors=('white','blue','red','gold')):
    table={'white':white,'blue':blue,'red':red,'gold':gold,'dark':tyre,'cream':creamm,'coral':coral}
    for i,c in enumerate(colors):
        radius=r*(1.-i*.23)
        cy=y-.070*i
        cyl((x,cy+.065,z),(x,cy-.098,z),radius,table[c],22)

def ferris(x,y):
    z=at(x,y)+.4
    r=13.4
    cc=(x,y,z+r+4.55)
    T=Matrix.Rotation(math.pi/2,3,'X')
    for off in [-.9,.9]:
        torus_ring((x,y+off,cc[2]),r,.21,gold,T,48)
        torus_ring((x,y+off,cc[2]),r-.58,.12,creamm,T,48)
    n=10
    for i in range(n):
        a=i*math.tau/n; wx=x+r*math.cos(a); wz=cc[2]+r*math.sin(a)
        for side in [-1,1]:
            cyl((x,y+side*.85,cc[2]),(wx,y+side*.85,wz),.096,gold,6)
        cyl((wx,y-1.13,wz),(wx,y+1.13,wz),.20,rail,8)
        body=([coral,blue,mint,lilac,gold])[i%5]
        cyl((wx,y,wz),(wx,y,wz-.62),.14,wood,6)
        box(wx,y,wz-1.13,1.87,2.32,1.23,body,soft=2)
        box(wx,y,wz-.39,1.98,2.52,.24,creamm,soft=2)
        for side in (-1,1):
            box(wx,y+side*1.17,wz-1.07,1.11,.12,.61,window,soft=1)
        if i%2==0: box(wx,y,wz+.01,.55,.30,.30,amber,soft=2)
    for side in [-1,1]:
        for end in [-1,1]:
            beam((x+5.63*end,y+side*1.55,z), (x,y+side*1.77,cc[2]),.68,.66,steel)
    cyl((x,y-2.17,cc[2]),(x,y+2.17,cc[2]),.69,creamm,16)
    occupied(x,y,31,9)

def golf_terrain():
    x,y=A['full golf']
    for off in [-19.0,4.2,25.9]:
        pts=[]
        for i in range(75):
            t=i/74; px=x-42+77*t
            py=y+off+4.1*math.sin(5*t+off)
            pts.append((px,py,at(px,py)+.085))
        for index in range(len(pts)-1):
            pix=pts[index:index+2]
            path_line(pix,19,fairway[index//6%len(fairway)])
        px,py=pts[-5][0],pts[-5][1]
        poly_disk(px-1,py+.32,at(px-1,py+.32)+.13,8.7,6.17,mint)
        golf_flag(px,py,at(px,py)+.15,1.15)
    for cx,cy,w,h in [(-183,24,7.7,4.3),(-133,8,6.0,4.6),(-169,47,9.1,3.5),(-130,49,6.1,4.5),(-201,14,4.6,5.1)]:
        box(cx,cy,at(cx,cy)+.035,w*.89,h*.9,.07,sand[2],soft=2)
        poly_disk(cx,cy,at(cx,cy)+.087,w,h,sand[2],32)
    for xy in [(-198,26),(-173,4),(-163,33),(-146,48)]:
        person(*xy,at(*xy),mode='throw',heading=R.random()*6.2,scale=1.12)
    x,y=A['frisbee golf']
    for dx,dy in [(-8,-1),(6,4),(14,-10)]:
        z=at(x+dx,y+dy)+.10
        frisbee_basket(x+dx,y+dy,z)
        poly_disk(x+dx,y+dy,z-.095,3.2,3.1,pebbl)
    occupied(*A['full golf'],105,63)
    occupied(x+2,y,33,23)

def golf_flag(x,y,z,scale=1):
    cyl((x,y,z),(x,y,z+3.3*scale),.058,white,7)
    poly_disk(x,y,z+.025,.2,.20,tyre,12)
    geo(coral,[(x,y,z+3.3*scale),(x+1.40*scale,y,z+3.04*scale),(x,y,z+2.68*scale)],[(0,1,2)])
def frisbee_basket(x,y,z):
    cyl((x,y,z),(x,y,z+3.23),.12,steel,8)
    cyl((x,y,z+3.07),(x,y,z+3.25),.81,gold,16)
    torus_ring((x,y,z+1.4),.94,.085,rail,n=20)
    torus_ring((x,y,z+1.21),.88,.078,rail,n=20)
    torus_ring((x,y,z+1.01),.72,.076,steel,n=20)
    for j in range(14):
        u=j*math.tau/14
        a=(x+math.cos(u)*.67,y+math.sin(u)*.67,z+3.08)
        b=(x+math.cos(u)*.30,y+math.sin(u)*.30,z+1.23)
        cyl(a,b,.026 if j%2 else .044,rail,5)

def putt_garden(x,y):
    z=pad(x,y,26,16,mint,base=max(22.48,at(x,y)+.12))
    for i in range(3):
        px=x+(i-1)*8.1
        pts=[(px+2.09*math.sin(j/13*math.pi*1.3+i),y-6.2+j/13*12.5,z+.12) for j in range(14)]
        path_line(pts,4.49,fairway[(i+1)%len(fairway)])
        for sign in [-1,1]:
            for p,q in zip(pts,pts[1:]):
                beam((p[0]+sign*2.16,p[1],p[2]+.21),(q[0]+sign*2.16,q[1],q[2]+.21),.3,.35,creamm)
        golf_flag(pts[-2][0],pts[-2][1],z+.14,.74)
        if i!=0:
            arch_ring(coral if i==1 else gold,(pts[5][0],pts[5][1],z+.15),(0,1),.73,.19,.76,.45,.48)
    person(x-8.6,y-5.65,z,heading=.7)

def railing_rect(x,y,z,a,b,h=1.16,top=wood):
    points=[(x-a/2,y-b/2),(x+a/2,y-b/2),(x+a/2,y+b/2),(x-a/2,y+b/2)]
    for idx in range(4):
        p,q=points[idx],points[(idx+1)%4]
        for i in range(2+int(math.dist(p,q)/2.9)):
            t=i/(1+int(math.dist(p,q)/2.9))
            box(p[0]*(1-t)+q[0]*t,p[1]*(1-t)+q[1]*t,z+h*.5,.20,.20,h,top)
        beam((*p,z+h*.86),(*q,z+h*.86),.14,.20,top)

def hoop(x,y,z):
    cyl((x,y+1.4,z),(x,y+1.4,z+4.9),.18,rail,9)
    box(x,y+1.2,z+4.16,2.78,.35,1.76,white)
    box(x,y+.99,z+4.07,1.16,.085,.634,coral)
    torus_ring((x,y+.05,z+3.73),.52,.08,coral,n=16)
    for j in range(10):
        a=j*math.tau/10
        cyl((x+.50*math.cos(a),y+.05+.49*math.sin(a),z+3.72),
            (x+.36*math.cos(a+.28),y+.05+.35*math.sin(a+.28),z+3.1),.027,white,5)

def soccer_goal(x,y,z,w=7,h=3.1,depth=2.48):
    for side in [-1,1]:
        xx=x+side*w/2
        cyl((xx,y,z),(xx,y,z+h),.12,white,8)
        cyl((xx,y,z+h),(xx,y+depth,z),.075,rail,8)
        cyl((xx,y+depth,z),(xx,y,z),.085,white,8)
    cyl((x-w/2,y,z+h),(x+w/2,y,z+h),.12,white,8)
    for i in range(13):
        xx=x+(i/12-.5)*w
        cyl((xx,y,z+h),(xx,y+depth,z+.06),.025,creamm,5)
    for i in range(1,8):
        t=i/8
        cyl((x-w/2,y+depth*t,z+h*(1-t)),(x+w/2,y+depth*t,z+h*(1-t)),.024,creamm,5)

def sports():
    specifications=[('basketball shooting',18,22,maple),('soccer penalties',21.7,21.8,mint),
     ('baseball batting',18.4,21.,terracotta),('football throwing',19.7,22.,fairway[0]),
     ('archery',21.0,21.8,fairway[1]),('paintball',33,18.5,pebbl)]
    for name,a,b,material_ in specifications:
        x,y=A[name]
        z=pad(x,y,a,b,material_)
        for side in [-1,1]:
            paint(x+side*(a*.5-.74),y,z,.16,b-1.5)
            paint(x,y+side*(b*.5-.74),z,a-1.48,.16)
        if name=='basketball shooting':
            hoop(x,y+6.6,z)
            paint(x-2.8,y+4.37,z,.14,7)
            paint(x+2.8,y+4.37,z,.14,7)
            paint(x,y+1.,z,5.7,.15)
            pts=[(x+6.29*math.cos(math.pi*i/24),y+3.64-6.29*math.sin(math.pi*i/24),z+.087) for i in range(25)]
            path_line(pts,.16,white)
            person(x+.47,y-3.56,z,'throw')
            poly_disk(x+1.4,y-3.84,z+.09,.30,.30,coral,12)
        elif name=='soccer penalties':
            soccer_goal(x,y+6.53,z)
            paint(x,y-1.04,z,.32,.32)
            paint(x,y+1.47,z,11,.13)
            for side in [-1,1]:paint(x+5.48*side,y+4.73,z,.13,6.56)
            person(x-.44,y-2.14,z,'throw')
        elif name=='baseball batting':
            for i in range(4):
                for side in (-1,1):
                    xx=x+side*6.32; yy=y-7+i*4.28
                    cyl((xx,yy,z),(xx,yy,z+5.96),.093,steel,7)
            for side in (-1,1):
                for row in range(7):
                    cyl((x+side*6.32,y-7,z+.84*row),(x+side*6.32,y+6,z+.84*row),.041,steel,6)
                for j in range(17):
                    yy=y-7+j*.80
                    cyl((x+side*6.32,yy,z+.1),(x+side*6.32,yy,z+5.91),.028,steel,5)
            for j in range(14):
                yy=y-7+j*.96
                cyl((x-6.32,yy,z+5.9),(x+6.32,yy,z+5.9),.040,steel,6)
            paint(x,y-4.37,z,.55,.59,white,.81)
            p=(x-1.7,y-3.9)
            person(*p,z,'throw',1.7)
            beam((p[0]-.47,p[1]-.15,z+1.18),(p[0]-1.06,p[1]+.50,z+2.15),.112,.13,wood)
        elif name=='football throwing':
            for k in [-1,0,1]:
                xx=x+k*4.32
                target(xx,y+7.1,z+2.12,1.24,('white','red','white','red'))
                cyl((xx,y+7.13,z+.08),(xx,y+7.13,z+1.34),.15,steel,8)
            for i in range(4):
                for k in [-1,0,1]:
                    paint(x+k*4.18,y+i*2.1-6.5,z,1.91,.13)
            person(x-.57,y-4.7,z,'throw',.2)
        elif name=='archery':
            for k in [-1,0,1]:
                xx=x+k*4.6
                target(xx,y+7.43,z+2.12,1.31)
                for side in [-1,1]:
                    beam((xx+side*.56,y+7.65,z+.14),(xx,y+7.64,z+2.13),.15,.19,wood)
            paint(x,y-5.4,z,17,.19)
            person(x-3.8,y-6.08,z,'throw',.26)
        else:
            railing_rect(x,y,z,a-1.2,b-1.6,1.9,steel)
            for i in range(15):
                px=x+R.uniform(-a*.42,a*.41); py=y+R.uniform(-b*.40,b*.40)
                q=R.choice([blue,coral,mint,gold]); ww=R.uniform(1.18,2.47)
                box(px,py,z+ww/2,ww,ww*.82,ww,q,R.uniform(0,.4),2)
                if i%3==0: poly_disk(px+ww*.8,py, z+.04,1.11,.42,q,12)
            for i in range(4):
                person(x+(i-1.5)*5.2,y+(-1)**i*3,z,'paint',i*.33)
        occupied(x,y,a+3,b+3)

def adventure():
    x,y=A['long jump']; z=pad(x,y,28,13,terracotta)
    for n in [-3.6,0,3.6]:
        paint(x-5.12,y+n,z,15,.18)
    box(x+9.17,y,z+.035,8.2,9.37,.09,sand[2],soft=2)
    paint(x+4.88,y,z,.23,9.35)
    person(x+.8,y+.4,z,'throw',-1.58)
    x,y=A['high jump']; z=pad(x,y,21.6,12.1,terracotta)
    box(x+4.8,y,z+.45,5.2,5.4,.9,blue,soft=2)
    for side in [-1,1]:
        cyl((x+1.8,y+side*2.9,z),(x+1.8,y+side*2.9,z+2.42),.12,steel,7)
    cyl((x+1.8,y-2.6,z+2.26),(x+1.8,y+2.6,z+2.26),.076,coral,6)
    person(x-2.84,y-1,z,'throw',-math.pi*.45)
    x,y=A['obstacle course']; z=pad(x,y,39,16,mint)
    for i in range(7):
        box(x-16+i*2.55,y-3.84,z+.36+(i%3)*.17,1.76,1.9,.70+(i%3)*.34,rock[i],soft=2)
    for side in [-1,1]:
        for off in [-5,4]:
            cyl((x+off,y+side*2.8,z),(x+off,y+side*2.8,z+4.29),.16,wood,8)
        cyl((x-5,y+side*2.8,z+4.18),(x+4,y+side*2.8,z+4.18),.11,wood,6)
    for i in range(8):
        cyl((x-5+i*1.26,y-2.7,z+4.18),(x-5+i*1.26,y+2.7,z+4.18),.084,wood,6)
    for dx in [-2.9,2.9]:
        beam((x+11+dx,y-3.65,z+.1),(x+11+dx,y+3.7,z+4.59),.24,.28,wood)
    for cy in range(8):
        t=cy/7; py=y-3.65+7.35*t
        cyl((x+8.1,py,z+.14+4.4*t),(x+13.9,py,z+.14+4.4*t),.050,gold,5)
    for cx in range(10):
        px=x+8.1+5.8*cx/9.
        cyl((px,y-3.65,z+.15),(px,y+3.7,z+4.60),.052,gold,6)
    person(x-12,y-4,z+1)
    x,y=A['skate racing']; z=pad(x,y,29.6,20.4,stoneblue)
    for side in [-1,1]:
        for i in range(8):
            t=i/8; u=(i+1)/8
            px=x+side*(7.1+5.31*t); qx=x+side*(7.1+5.31*u)
            z1=z+.09+3.85*t*t; z2=z+.09+3.85*u*u
            quad(limestone,[(px,y-8,z1),(qx,y-8,z2),(qx,y+7.9,z2),(px,y+7.9,z1)])
        beam((x+side*12.4,y-8,z+3.96),(x+side*12.4,y+7.9,z+3.96),.22,.23,rail)
    for i in range(4):
        px=x-4.3+i*2.7
        cy=y-2.+(-1)**i*2.2
        cyl((px,cy,z+.05),(px,cy,z+.87),.28,courseorange,8,r2=.048)
    cyl((x-4,y+5.22,z+.54),(x+4.4,y+5.22,z+.54),.079,steel,8)
    for i in range(3):box(x-4+i*4.2,y+5.22,z+.22,.10,.11,.47,steel)
    person(x+3.1,y+.42,z,'skate',heading=.7)


def winter_sport():
    guide=data['ski']
    center=[]
    for a,b in zip(guide,guide[1:]):
        n=math.ceil(math.dist(a,b)/1.5)
        for i in range(n):
            t=i/n
            x,y=Vector(a).lerp(Vector(b),t)
            z=max(at(x+u,y+v) for u in (-1.5,0,1.5) for v in (-1.5,0,1.5))
            center.append((x,y,z+.19))
    center.append((*guide[-1],at(*guide[-1])+.19))
    edges=[]
    for i,p in enumerate(center):
        p,t,n=basis(center,i,False)
        x,y,_=p
        for k in range(7):
            d=(k-3)*2.80
            px,py=x+n[0]*d,y+n[1]*d
            alt=max(at(px+v,py+w) for v in (-1.40,0,1.4) for w in (-1.4,0,1.4))+.16
            edges.append((px,py,alt))
        if i%9==3:
            col=red if i%2 else blue
            for sign in (-1,1):
                px,py=x+n[0]*sign*4.5,y+n[1]*sign*4.5
                h=at(px,py)+.16
                cyl((px,py,h),(px,py,h+3.6),.083,rail,7)
                box(px+.87,py,h+3.23,1.68,.13,.88,col,soft=0)
        if i%13==5:
            person(x,y,at(x,y)+.28,'ski',heading=-2.45,scale=1.27)
    geo(snow[2],edges,[(i*7+j,(i+1)*7+j,(i+1)*7+j+1,i*7+j+1)
                      for i in range(len(center)-1) for j in range(6)])
    for a,b in zip(guide,guide[1:]):
        occupied((a[0]+b[0])/2,(a[1]+b[1])/2,23,21.8)

    x,y=A['ice skating race']
    z=at(x,y-7)+1.10
    course=[(x+22.3*math.cos(t)+2.7*math.sin(t*2),y+9.7*math.sin(t),z)
             for t in (i*math.tau/96 for i in range(96))]
    poly_disk(x,y,z-.13,25.2,14.6,scree[2])
    poly_disk(x,y,z-.04,21.8,10.9,ice[1])
    path_line(course,7.6,ice[0],True)
    path_line(course,8.24,creamm,True,-.12)
    for i in (7,24,43,59,80):
        person(*course[i],'skate',heading=i*math.tau/96+.8,scale=1.2)
    for i in range(0,96,8):
        p,t,n=basis(course,i,True)
        x0,y0=p[0]+n[0]*3.8,p[1]+n[1]*3.8
        box(x0,y0,z+.42,.25,.25,.89,limestone)
        q,_,n2=basis(course,(i+8)%96,True)
        beam((x0,y0,z+.78),(q[0]+n2[0]*3.8,q[1]+n2[1]*3.8,z+.78),.16,.18,wood)
    occupied(x,y,55,31)
    for x,y,a,h in [(-47,67,10,6.4),(-46,87,9,5.2),(-41,110,9,6.7),(-34,133,9,6),
                    (0,141,10,6),(13,105,9,5.9),(38,138,9.5,6.7),(73,121,11,6.8),
                    (92,119,9,6),(129,113,10,5.4),(-115,125,10,7),(-144,118,10,6)]:
        if not nearest_road(x,y,F1,12):
            house(x,y,a,a*.83,h,'alpine')


def swim_basin():
    for x,y in [(-55,-118),(-67,-109),(-37,-119),(-25,-111),(47,-125),(52,-118),(30,-123)]:
        person(x,y,LZ+.02,'swim',R.uniform(0,6.),scale=1.16)
        for n in range(2):
            r=1.12+n*.69
            torus_ring((x,y,LZ+.055+n*.001),r,.035,fallwhite,n=20)
    for x,y in [(-74,-123),(-47,-104),(-19,-106),(31,-120),(49,-131),(61,-123)]:
        torus_ring((x,y,LZ+.21),.94,.26,gold,n=18)
        poly_disk(x,y,LZ+.14,.52,.51,tiny_people[3],12)
    for basin_x,basin_y,a,b in data['basins']:
        for i in range(29):
            phi=R.random()*math.tau
            ratio=R.uniform(.28,.82)
            x=basin_x+a*math.cos(phi)*ratio
            y=basin_y+b*math.sin(phi)*ratio
            d=R.uniform(.30,1.65)
            pts=[(x-d+2*d*k/5,y+.27*math.sin(k*1.14+i),LZ+.043) for k in range(6)]
            path_line(pts,.056,fallwhite)
    x,y=-82,-116
    for side in (-1,1):
        box(x-1.7,y+side*2.15,LZ+4.41,1.27,1.,9.06,limestone)
        for j in range(6):
            beam((x-2.5,y+side*2.15,LZ+j*1.1),(x-.8,y+side*2.15,LZ+j*1.1),.22,.24,steel)
    box(x-1.3,y,LZ+8.86,3.69,5.07,.52,limestone)
    box(x+2.8,y,LZ+9.08,5.9,2.08,.38,ice[0],soft=1)
    railing_rect(x-1.9,y,LZ+9.18,2.81,4.43,1.,steel)
    person(x+4.49,y,LZ+9.26,'throw',-math.pi/2,scale=1.19)
    for x,y in [(-34,-92),(72,-113),(51,-109)]:
        bank=at(x,y)
        count=10
        for k in range(count):
            z=LZ+.38+(bank-LZ)*((count-1-k)/count)
            box(x,y-k*.82,z,6.16,.85,.51,limestone,soft=1)
    for x,y in [(-85,-94),(-91,-104),(-100,-113),(-81,-129),(79,-105),(70,-113)]:
        h=at(x,y)
        if h<LZ:
            continue
        cyl((x,y,h),(x,y,h+3.32),.087,wood,7)
        for i in range(14):
            a,b=i*math.tau/14,(i+1)*math.tau/14
            geo(red if i%2 else creamm,[(x,y,h+3.39),(x+2.55*math.cos(a),y+2.55*math.sin(a),h+2.55),
                 (x+2.55*math.cos(b),y+2.55*math.sin(b),h+2.55)],[(0,1,2)])
        box(x+.40,y-1.12,h+.29,2.34,.89,.44,wood,rot=.25,soft=2)
        occupied(x,y,6,6)


def skyway_overlook():
    # A shaded overlook is accessible from the adventure and lagoon paths.
    x,y=GATES['Skyway overlook']
    h=at(x,y)
    z=pad(x,y,16.7,10.9,limestone,base=h+.14)
    for a in (-5.2,0.,5.2):
        box(x+a,y,z+2.56,.63,7.4,5.12,wood)
    striped_roof(x,y,z+5.13,16.9,10.1,blue)
    lamppost(x-6,y-3.6,z,4.15,cold_lamp)
    person(x+2.2,y-2.4,z,'walk')

def kart_model(p,t,is_f1,col):
    x,y,z=p
    ang=math.atan2(t[1],t[0]); n=(-t[1],t[0])
    L=4.315 if is_f1 else 2.45
    w=1.50 if is_f1 else 1.45
    def atp(a,b,c):return (x+a*t[0]+b*n[0],y+a*t[1]+b*n[1],z+c)
    def bn(a,b,d,aa,bb,cc,m,s=2):box(*atp(a,b,d),aa,bb,cc,m,ang,s)
    for side in (-1,1):
        for rank in [-1,1]:
            cx=rank*(1.325 if is_f1 else .745)
            yy=side*(.61 if is_f1 else .577)
            rad=(.283 if is_f1 else (.21 if rank<0 else .20))
            tyre_width=(.29 if rank<0 and is_f1 else .185)
            cyl(atp(cx,yy-tyre_width/2,rad),atp(cx,yy+tyre_width/2,rad),rad,tyre,12)
            cyl(atp(cx,yy+side*tyre_width/2,rad),atp(cx,yy+side*(tyre_width/2+.05),rad),rad*.62,rail,11)
    bn(0,0,.25,L*.85,w*.42,.35,col)
    bn(.73 if is_f1 else .42,0,.44,L*.30,w*.28,.23,col)
    bn(-.18,0,.43,L*.27,w*.14,.052,white)
    bn(-.34,0,.49,.49,.53,.32,tyre)
    bn(-.34,0,.8,.27,.28,.26,R.choice([white,blue,red,courseorange]))
    bn(-L*.35,0,.73,.30,w*(.91 if is_f1 else .70),.13,col)
    if is_f1:
        bn(L*.42,0,.23,.36,w*.93,.12,col)
        for side in [-1,1]:
            bn(L*.40,w*.43*side,.31,.34,.17,.22,col)
    else:
        bn(L*.42,0,.24,.24,w*.87,.15,tyre)


def traffic():
    for track,large,count in [(F1,True,21),(KART,False,12)]:
        for i in range(count):
            j=(25+int((i+.38)*len(track)/count))%len(track)
            if large and data['f1_ports'][0]+3 < j < data['f1_ports'][1]-3:
                continue
            p,t,n=basis(track,j,True)
            delta=(1.78 if large else 1.08)*(-1)**i
            p=(p[0]+n[0]*delta,p[1]+n[1]*delta,p[2]+.045)
            kart_model(p,t,large,[red,blue,gold,creamm,coral,mint][i%6])
    x,y=A['S kart racing and time trial']
    stage=pad(x,y-1.9,24,8.3,limestone,base=at(x,y)+.13)
    striped_roof(x+1.5,y-4.0,stage+4.25,16.7,5.8,red)
    for off in (-6.7,0,9.7):
        box(x+off,y-4.17,stage+2.08,.58,.66,4.16,wood)
    for i,col in enumerate([blue,red,gold]):
        kart_model((x-6+5.4*i,y+.18,stage+.12),(0.,1.),False,col)
    idx=min(range(len(KART)),key=lambda i: math.hypot(KART[i][0]-59,KART[i][1]+78))
    p,t,n=basis(KART,idx,True)
    pts=[(x-6.,y-1.2,stage+.10),(x-7,y+3.,stage+.12),(p[0],p[1],p[2]+.03)]
    path_line(pts,4.25,kartlane)
    walkway(pts,pebbl,4.5)
    watch_tower(88,-90)

def trees(x,y,z,h,kind):
    if kind=='pine' or kind=='snow':
        r=.31*h
        cyl((x,y,z+.04),(x,y,z+h*.72),h*.038,treebark,8,r2=h*.020)
        for i in range(5):
            q=i/5; rr=r*(1-.77*q); zz=z+h*(.25+.69*q)
            for side in [-1,0,1]:
                if side==0:
                    box(x,y,zz,rr*1.92,rr*1.75,h*.166,pine[(i+2)%len(pine)],.29,soft=2)
                else:
                    box(x+rr*.58*side,y+rr*.33*(-1)**i,zz-.09*h,rr,rr*.98,h*.134,pine[(i+side)%len(pine)],.64,soft=2)
            if kind=='snow':
                box(x,y,zz+h*.078,rr*1.75,rr*1.68,h*.072,snow[i%len(snow)],.29,2)
        return
    rot=R.random()*math.tau
    box(x,y,z+.33*h,h*.098,h*.103,h*.66,treebark,rot,2)
    for i in range(3):
        a=rot+i*math.tau/3
        dx,dy=math.cos(a),math.sin(a)
        beam((x,y,z+.32),(x+dx*h*.17,y+dy*h*.17,z+.12),h*.045,h*.054,treebark)
    for i,(a,b,c,s) in enumerate([(0,0,.84,.43),(-.23,.13,.71,.32),(.22,.1,.72,.34),
                                 (.04,-.24,.74,.32),(-.14,-.13,.9,.30),(.11,.19,.94,.31),(.02,-.01,1.10,.26),
                                 (-.13,.23,.88,.24)]):
        pp=x+h*(a*math.cos(rot)-b*math.sin(rot)); qq=y+h*(a*math.sin(rot)+b*math.cos(rot))
        colors=pink if kind=='blossom' else leaf
        box(pp,qq,z+h*c,h*s,h*s*.85,h*s*.76,R.choice(colors),rot+i*.19,soft=2)

def flowerbed(x,y,z,r=1.6,pick=None,amount=9):
    for n in range(amount):
        theta=R.random()*math.tau; t=math.sqrt(R.random())*r
        xx=x+t*math.cos(theta); yy=y+t*math.sin(theta)
        hh=R.uniform(.25,.63)
        box(xx,yy,z+hh*.36,hh*.84,hh*.84,hh*.72,R.choice(flowergreen),theta,2)
        box(xx,yy,z+hh*.79,hh*.74,hh*.71,hh*.33,pick or R.choice(floral),theta,2)

def soft_landscaping():
    all_walk=[p for walk in data['walks'].values() for p in walk[::4]]
    entries=list(CELLS.items()); R.shuffle(entries)
    for (i,j),(h,segments,wet,land) in entries:
        x,y=i*C,j*C
        edge=any((i+dx,j+dy) not in CELLS for dx,dy in [(1,0),(-1,0),(0,1),(0,-1)])
        if wet or h<=LZ:continue
        if any(abs(x-a)<w+2 and abs(y-b)<d+2 for a,b,w,d in PAD_AREAS):continue
        if nearest_road(x,y,KART,6.) or nearest_road(x,y,F1,10.0):continue
        if min((x-p[0])**2+(y-p[1])**2 for p in all_walk)<5.1**2:continue
        fx,fy=x+R.uniform(-.92,.92),y+R.uniform(-.94,.94)
        if land=='snow':
            # Leave a clear strip for the downhill route, its flag gates and tunnel roof.
            if any(abs(sx-x)<10 and abs(sy-y)<11 for sx,sy in data['ski']):continue
            if R.random()< (.36 if edge else .22):
                trees(fx,fy,h,R.uniform(4.0,8.3),'snow')
            else:
                if edge and R.random()<.42:box(fx,fy,h+.61,2.25,2.11,1.27,R.choice(scree),R.uniform(0,.2),2)
            continue
        if (x<-109 and -8<y<52) or (64<x<207 and 17<y<77):
            if edge and R.random()<.66:flowerbed(fx,fy,h,1.8,pick=R.choice(floral),amount=10)
            elif R.random()<.12:trees(fx,fy,h,R.uniform(3.8,5.5),'garden')
            continue
        if R.random()<(.77 if edge else .47):
            kind='blossom' if (y<5 or -90<x<90) and R.random()<.49 else ('pine' if y>62 else 'garden')
            if i%2 or j%2 or edge:trees(fx,fy,h,R.uniform(4.8,9.7),kind)
        elif edge or R.random()<.52:
            flowerbed(fx,fy,h,R.uniform(.85,2.01),pick=R.choice(floral),amount=R.randint(6,12))
        if edge and R.random()<.56:
            for di,dj in [(0,-1),(1,0),(-1,0),(0,1)]:
                if (i+di,j+dj) in CELLS:continue
                dx=x+di*(C*.48+.09); dy=y+dj*(C*.48+.09)
                for k in range(R.randint(5,13)):
                    r=R.uniform(.24,.48)
                    box(dx+dj*math.sin(k)*.26,dy+di*math.sin(k)*.26,h-k*.62,r*1.84,r*1.93,r*1.83,R.choice(leaf),soft=2)
    for name,walk in data['walks'].items():
        for i,p in enumerate(walk[4:-5:13]):
            x,y,z=p; h=at(x,y)
            if z-h > 2.1 or h<3 or nearest_road(x,y,KART,6):continue
            _,t,n=basis(walk,min(len(walk)-1,4+i*13),False)
            side=(-1)**i
            xx,yy=x+3.15*n[0]*side,y+3.15*n[1]*side
            if not nearest_road(xx,yy,KART,5.) and at(xx,yy)>3.1:
                lamppost(xx,yy,at(xx,yy),3.30 if y<80 else 2.8)
                if i%3==0:person(x+.42,y+.23,z,'walk',heading=math.atan2(t[0],t[1]))


def climb_terrace(a,b,width=3.9):
    p,q=Vector(a),Vector(b)
    h=q.z-p.z
    count=max(2,math.ceil(abs(h)/.46))
    heading=math.atan2(q.y-p.y,q.x-p.x)
    length=math.hypot(q.x-p.x,q.y-p.y)/count
    for i in range(count):
        t=(i+.5)/count
        r=p.lerp(q,t)
        actual=p.z+h*(i+1)/count
        floor=max(at(r.x,r.y),actual-2.4)
        height=max(actual-floor,.29)
        box(r.x,r.y,actual-height/2,length+.08,width,height,limestone,heading)
        if i%3==0:
            for side in [-1,1]:
                x=r.x-math.sin(heading)*side*width*.43
                y=r.y+math.cos(heading)*side*width*.43
                box(x,y,actual+.49,.18,.18,.98,mediumstone,soft=1)
    for side in [-1,1]:
        r=Vector((-math.sin(heading)*side*width*.43,math.cos(heading)*side*width*.43,.93))
        beam(p+r,q+r,.18,.23,limestone)


def admissions():
    for name in ('basketball shooting','soccer penalties','baseball batting','football throwing','archery'):
        x,y=A[name]
        a=(x,y-17.4,at(x,y-17.4)+.17)
        b=(x,y-11.1,at(x,y-11.1)+.22)
        if b[2]>a[2]+.4:
            climb_terrace(a,b)
        lamppost(x+4.5,y-12.5,at(x+4.5,y-12.5),3.22)
    for x,y in [(-59,-89),(-13,-89),(8,-93),(-125,-87),(-19,25),
                (24,41),(84,101),(89,-102),(93,-33),(117,15)]:
        if at(x,y)>5 and not nearest_road(x,y,KART,7.5):
            garden_pergola(x,y)

def watch_tower(x,y):
    z=pad(x,y,14,13,limestone)
    for i,(size,h) in enumerate([(9,5.1),(7.7,5.4),(5.7,6.3)]):
        box(x,y,z+h/2,size,size*.94,h,limestone)
        box(x,y,z+h-.33,size+.66,size*.94+.66,.66,creamm)
        for side in (-1,1):
            gu=y+side*size*.474
            for off in [-.25,.25]:
                box(x+size*off,gu,z+h*.60,size*.14,.19,h*.37,tyre)
                box(x+size*off,gu+side*.12,z+h*.60,size*.105,.22,h*.31,window)
            gx=x+side*size*.503
            box(gx,y,z+h*.61,.19,size*.22,h*.39,window)
        z+=h
    cylinder_r=2.78
    cyl((x,y,z),(x,y,z+1.29),cylinder_r,mediumstone,20)
    cyl((x,y,z+1.28),(x,y,z+4.69),cylinder_r,roofm[2],20,r2=.082)
    cyl((x,y,z+4.58),(x,y,z+6.),.11,gold,8)
    for side in [-1,1]:
        cy=y+side*2.70
        cyl((x,cy+side*.1,z-.94),(x,cy+side*.23,z-.94),.98,creamm,28)
        for az in [math.pi*.36,math.pi*1.04]:
            cyl((x,cy+side*.27,z-.94),(x+math.cos(az)*.68,cy+side*.27,z-.94+math.sin(az)*.68),.075,tyre,6)
    for dy in [-5.08,4.8]:
        lamppost(x+4.87,y+dy,at(x+4.87,y+dy),3.95)

def formal_gardens():
    for x,y,a,b in [(-98,8,19,12),(-61,22,28,12),(43,18,22,12),
                   (53,-51,17,11),(2,-88,16,9),(26,-83,16,9),(-186,70,19,9),(91,100,17,10)]:
        if at(x,y)<4.6 or nearest_road(x,y,KART,9):continue
        z=at(x,y)+.1
        occupied(x,y,a,b)
        for p,q in [
            ((x-a/2,y-b/2,z+.55),(x+a/2,y-b/2,z+.55)),
            ((x-a/2,y+b/2,z+.55),(x+a/2,y+b/2,z+.55)),
            ((x-a/2,y-b/2,z+.55),(x-a/2,y+b/2,z+.55)),
            ((x+a/2,y-b/2,z+.55),(x+a/2,y+b/2,z+.55))
        ]:
            beam(p,q,.69,.63,mediumstone)
        for i in range(7):
            a1=math.tau*i/7
            fx=x+a*.38*math.cos(a1);fy=y+b*.35*math.sin(a1)
            if at(fx,fy)>5:
                box(fx,fy,at(fx,fy)+.31,2.45,2.41,.66,R.choice(leaf),R.uniform(-.25,.25),2)
                flowerbed(fx,fy,at(fx,fy)+.38,1.02,R.choice(floral),18)
        poly_disk(x,y,z+.08,4.15,2.25,wat,n=30)
        for end in (-1,1):
            poly_disk(x+end*2.9,y,z+.115,1.17,.91,fallwhite,14)
    for x,y in [(-194,57),(189,69),(81,132)]:
        if not nearest_road(x,y,F1,13) and at(x,y)>8:watch_tower(x,y)

def mist_bank():
    material_=bpy.data.materials.new('Waterfall vapor'); material_.use_nodes=True
    nt=material_.node_tree
    nt.nodes.clear()
    o=nt.nodes.new('ShaderNodeOutputMaterial')
    volume=nt.nodes.new('ShaderNodeVolumePrincipled')
    volume.inputs['Color'].default_value=(.77,.90,.96,1)
    volume.inputs['Anisotropy'].default_value=.08
    uv=nt.nodes.new('ShaderNodeTexCoord')
    dist=nt.nodes.new('ShaderNodeVectorMath');dist.operation='DISTANCE'
    dist.inputs[1].default_value=(.5,.5,.5)
    ramp=nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position=.03
    ramp.color_ramp.elements[0].color=(.086,.086,.086,1)
    ramp.color_ramp.elements[1].position=.47
    ramp.color_ramp.elements[1].color=(0,0,0,1)
    nt.links.new(uv.outputs['Generated'],dist.inputs[0])
    nt.links.new(dist.outputs['Value'],ramp.inputs['Fac'])
    nt.links.new(ramp.outputs[0],volume.inputs['Density'])
    nt.links.new(volume.outputs[0],o.inputs['Volume'])
    for x,y,z,a,b,c in [(-52,-151,-79,24,16,14),(43,-147,-80,18,17,13)]:
        bpy.ops.mesh.primitive_cube_add(size=1.,location=(x,y,z))
        ob=bpy.context.object
        ob.name='Localized waterfall spray'
        ob.dimensions=(a,b,c)
        ob.data.materials.append(material_)


def alpine_chateau(x,y):
    z=pad(x,y,43,25,limestone)
    for side in (-1,1):
        xx=x+side*13.9
        box(xx,y+2.8,z+6.8,12.1,18.5,13.6,wood)
        box(xx,y+2.8,z+13.9,13.15,19.2,.60,creamm)
        roof(xx,y+2.8,z+14.1,14.0,20.65,7.0,roofm[0])
        for off in (-3.6,0.,3.6):
            box(xx+off,y-6.53,z+9.66,1.90,.21,3.01,window)
        cyl((xx,y+6.2,z+20.1),(xx,y+6.2,z+26.3),.105,gold,8)
        geo(red,[(xx,y+6.2,z+26.31),(xx+3.5,y+6.2,z+25.54),(xx,y+6.2,z+24.72)],[(0,1,2)])
    box(x,y+1.8,z+5.44,15.85,16.6,10.9,wood)
    box(x,y+1.8,z+11.05,16.2,17.25,.48,creamm)
    roof(x,y+1.8,z+11.23,16.8,18.25,5.6,roofm[0])
    for k in range(7):
        xx=x+5.42*(k-3)
        arch_ring(limestone,(xx,y-10.6,z+.1),(0,1),1.89,3.03,1.75,1.05,.43)
        lamppost(xx+2.55,y-11,z,4.32)
    box(x,y-10.61,z+5.52,41.2,4.32,.87,creamm)
    railing_rect(x,y-10.6,z+5.95,40.4,3.56,1.05,limestone)
    a=(x,y-20.4,at(x,y-20.4)+.29)
    b=(x,y-12.3,z+.23)
    if b[2]>a[2]+.2:
        climb_terrace(a,b,10.2)


def carousel(x,y):
    z=at(x,y)+.25
    cyl((x,y,z-.62),(x,y,z),6.15,limestone,30)
    cyl((x,y,z),(x,y,z+4.7),.40,gold,12)
    for i in range(24):
        t,u=i*math.tau/24,(i+1)*math.tau/24
        a=(x+6.18*math.cos(t),y+6.18*math.sin(t),z+4.6)
        b=(x+6.18*math.cos(u),y+6.18*math.sin(u),z+4.6)
        geo(creamm if i%2 else coral,[a,b,(x,y,z+7.65)],[(0,1,2)])
        if i%3==0:
            px=x+4.38*math.cos(t)
            py=y+4.38*math.sin(t)
            cyl((px,py,z+.43),(px,py,z+5.61),.12,gold,8)
            box(px,py,z+1.12,1.37,1.25,.84,creamm if i%2 else red,rot=t,soft=2)
    cyl((x,y,z+7.50),(x,y,z+8.6),.23,gold,10,r2=.09)
    occupied(x,y,13,13)


conservatory(13,21)
conservatory_arcade(-14,23)
conservatory_arcade(40,23)
alpine_chateau(116,100)
for point in [(-35,26),(-21,3),(-54,-58),(32,-34),(44,-12),
              (-105,41),(-157,47),(-177,-16),(-15,-115),(85,-97),(113,-98),(140,54)]:
    if not nearest_road(*point,KART,8.5):
        garden_pergola(*point)
for x,y,a,h in [(-177,51,10,6.4),(-201,55,9,6),(-187,38,7.5,5.9),(-190,-39,9,6),
                (-114,105,10,6),(174,93,11.5,6),(159,105,10,6),(137,125,9,6.3),
                (75,121,11,7),(-35,58,9,6),(50,102,11.9,6),(175,-56,8,7.5),
                (-174,-77,11,7.8),(-129,-101,9,5.9),(123,-101,8.5,5.2),
                (180,12,9,5.3),(-62,-38,9,5.5)]:
    if not nearest_road(x,y,F1,13) and not nearest_road(x,y,KART,9):
        house(x,y,a,a*.87,h,levels=1+int(a>11.5))
for name,color in zip(('bowling','skee-ball','billiards','darts'),(coral,blue,roofm[2],lilac)):
    arcade(name,*A[name],color)
ferris(-65,-20)
carousel(-87,-43)
putt_garden(*A['mini golf'])
golf_terrain()
sports()
adventure()
winter_sport()
swim_basin()
skyway_overlook()
traffic()
admissions()
formal_gardens()
soft_landscaping()
mist_bank()

for mat,(v,faces) in BATCH.items():
    if not faces:continue
    mesh=bpy.data.meshes.new(mat.name+' mesh')
    mesh.from_pydata(v,[],faces)
    mesh.update()
    obj=bpy.data.objects.new(mat.name,mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)

scene=bpy.context.scene
scene.render.engine='CYCLES'
scene.render.threads_mode='FIXED'
scene.render.threads=5
scene.cycles.samples=58
scene.cycles.use_denoising=False
scene.cycles.adaptive_threshold=.039
scene.cycles.max_bounces=5
scene.cycles.diffuse_bounces=3
scene.cycles.glossy_bounces=2
scene.cycles.transmission_bounces=3
scene.render.film_transparent=True
scene.view_settings.view_transform='AgX'
scene.view_settings.look='AgX - Medium High Contrast'
scene.view_settings.exposure=.52
scene.render.image_settings.file_format='PNG'
scene.render.image_settings.color_mode='RGBA'
scene.render.resolution_x=2160
scene.render.resolution_y=1440
scene.render.resolution_percentage=100
scene.render.image_settings.color_depth='8'

world=bpy.data.worlds.new('Mountain sky ambient')
world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.64,.79,1.,1.)
world.node_tree.nodes['Background'].inputs[1].default_value=.51
scene.world=world

def lamp(name,kind,pos,target,strength,col,sz=0):
    d=bpy.data.lights.new(name,kind)
    d.energy=strength;d.color=col
    if kind=='SUN':d.angle=math.radians(11)
    if kind=='AREA':d.shape='DISK';d.size=sz
    ob=bpy.data.objects.new(name,d)
    bpy.context.collection.objects.link(ob)
    ob.location=Vector(pos)
    ob.rotation_euler=(Vector(target)-ob.location).to_track_quat('-Z','Y').to_euler()

lamp('Golden afternoon key','SUN',(-460,-390,820),(0,0,0),2.44,(1.,.91,.81))
lamp('Cloud reflection','SUN',(420,780,510),(0,0,0),.31,(.63,.79,1.))
lamp('Snow rim','SUN',(370,210,350),(10,0,0),.24,(.85,.93,1.))

beacons=[p for route in (F1,KART,SWIM) for p in route[::4]]
beacons.extend((i*C,j*C,z) for (i,j),(h,vs,wet,land) in CELLS.items() for z in (h,vs[0][0]))
beacons.extend([(-52,-151,-90),(43,-146,-90),(-65,-20,49),(116,100,83)])
def viewer(name,direction):
    data=bpy.data.cameras.new(name)
    ob=bpy.data.objects.new(name,data)
    bpy.context.collection.objects.link(ob)
    ob.location=Vector((direction*138,-direction*1220,1180))
    aim=Vector((0,2,23))
    q=(aim-ob.location).to_track_quat('-Z','Y')
    ob.rotation_euler=q.to_euler()
    data.type='ORTHO';data.clip_end=4000.;data.clip_start=.6
    inv=q.inverted()
    proj=[inv@(Vector(p)-ob.location) for p in beacons]
    lowx,hix=min(p.x for p in proj),max(p.x for p in proj)
    lowy,hiy=min(p.y for p in proj),max(p.y for p in proj)
    ob.location += q@Vector(((hix+lowx)/2,(hiy+lowy)/2,0))
    return ob,max((hix-lowx)*1.093,(hiy-lowy)*1.50*1.116)

front,f1scale=viewer('Front · lagoon side',1)
back,b1scale=viewer('Back · alpine side',-1)
for camera in [front,back]:camera.data.ortho_scale=max(f1scale,b1scale)
scene.camera=front
preview='preview' in sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else False
if preview:
    scene.render.resolution_percentage=44
    scene.cycles.samples=12
    scene.cycles.adaptive_threshold=.052
scene.render.filepath=str(ROOT/'front-alpha.png')
if not preview and 'save-scene' in sys.argv:
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'island-scene.blend'),compress=True)
for name,camera in [('front',front),('back',back)]:
    scene.camera=camera
    scene.render.filepath=str(ROOT/(name+('-draft.png' if preview else '-alpha.png')))
    bpy.ops.render.render(write_still=True)
