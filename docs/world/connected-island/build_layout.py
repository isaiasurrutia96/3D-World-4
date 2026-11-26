"""Make the shared block, road, water and path layout for the two island views."""
from pathlib import Path
import json
import math

import numpy as np
from scipy.interpolate import CubicSpline
from scipy.ndimage import gaussian_filter1d
from scipy.spatial import cKDTree
from matplotlib.path import Path as Polygon

ROOT = Path(__file__).parent
CELL = 4.30
WATER_Z = 4.30
F1_WIDTH, S_WIDTH, SWIM_WIDTH = 13.76, 6.88, 10.32
TERRAIN = [
    (-269, 36), (-267, -7), (-243, -39), (-196, -40), (-168, -73),
    (-127, -85), (-109, -107), (-82, -127), (-48, -146), (-15, -149),
    (21, -142), (57, -133), (82, -109), (109, -82), (148, -68),
    (187, -57), (232, -49), (276, -21), (282, 20), (256, 62),
    (222, 87), (183, 91), (160, 108), (141, 147), (112, 159), (83, 148),
    (59, 117), (36, 115), (15, 114), (-44, 107), (-79, 122), (-127, 128),
    (-163, 126), (-197, 118), (-228, 113), (-251, 93), (-265, 67),
]
GATES = {
    "full golf": [-193, 13],
    "frisbee golf": [-156, 72],
    "carnival": [-105, 53],
    "conservatory": [-103, -39],
    "mini golf": [-84, 50],
    "skiing": [157, 106],
    "ice skating race": [75, 62],
    "sports": [148, 1],
    "adventure": [154, -22],
    "swimming": [-38, -50],
    "swim east": [57, -50],
    "S kart staging": [-150, 17],
    "F1 staging": [185, -36],
}
ACTIVITIES = {
    "full golf": [-203, 48],
    "frisbee golf": [-160, 78],
    "mini golf": [-83, 49],
    "bowling": [-119, 63],
    "skee-ball": [-104, 63],
    "billiards": [-89, 63],
    "darts": [-74, 63],
    "basketball shooting": [108, 23],
    "soccer penalties": [135, 23],
    "baseball batting": [161, 23],
    "football throwing": [185, 23],
    "archery": [211, 23],
    "paintball": [220, 49],
    "obstacle course": [175, -40],
    "long jump": [110, -42],
    "high jump": [139, -39],
    "skate racing": [216, -23],
    "skiing": [128, 123],
    "ice skating race": [77, 76],
    "S kart racing and time trial": [-148, 38],
    "F1 racing and time trial": [285, -93],
    "swimming and diving": [-43, -75],
}
# Shared footpaths connect every public district. One raised arcade crossing
# passes over the S loop, and a path above the swim tunnel links its basins.
WALKS_XY = [
 ["golf-garden",[[-235,47],[-221,22],[-193,13],[-170,15],[-153,24],[-132,35],[-100,19],[-78,15],[-56,12]]],
 ["garden-sports",[[-56,12],[-26,17],[4,22],[41,42],[73,53],[93,43],[96,14],[118,5],[148,1],[184,1],[224,5]]],
 ["garden-arcade",[[-56,12],[-71,26],[-90,34],[-104,43],[-105,53],[-110,61],[-116,75],[-125,96],[-109,99],[-93,97]]],
 ["terrace-lower",[[-148,16],[-137,0],[-113,-15],[-94,-34],[-73,-44],[-54,-49],[-38,-50],[-21,-49],[-4,-46],[14,-44],[32,-47],[57,-50],[79,-41],[104,-24],[129,-21],[154,-22],[187,-17],[217,-17]]],
 ["adventure-sports",[[154,-22],[151,-12],[148,1]]],
 ["alpine",[[4,22],[8,52],[32,73],[56,73],[75,62],[96,60],[113,64],[135,74],[151,87],[157,106]]],
 ["golf-stage",[[-170,15],[-148,16],[-150,17]]],
 ["disc-golf",[[-170,15],[-177,39],[-162,60],[-156,72],[-146,91],[-125,96]]],
 ["mini-golf",[[-105,53],[-96,45],[-84,50]]],
 ["F1 hill garage",[[154,-22],[166,-30],[185,-36]]],
 ["conservatory approach",[[-113,-15],[-108,-27],[-103,-39],[-94,-34]]],
 ["north wall",[[-125,96],[-117,111],[-95,113],[-82,108],[-75,101],[-93,97]]],
 ["paintball",[[224,5],[239,23],[229,42],[220,49]]],
]
S_ANCHORS = [
    (-87,-19),(-80,-31),(-62,-36),(-39,-36),(-16,-34),(4,-27),
    (16,-16),(18,-2),(11,12),(2,23),(-13,29),(-36,27),(-48,21),
    (-58,22),(-74,26),(-85,16),(-90,1),
]
WATER_ANCHORS = [
    (-52,-78),(-35,-79),(-18,-78),(-6,-76),(7,-72),(17,-70),
    (28,-67),(40,-64),(52,-66),
]
BASINS = [(-43,-81, 35,25),(44,-65,25,20)]
F1_PORT_X = [80.0,146.0]
SWIM_PORT_X = [4.65,21.85]


def sample_route(points, closed, interval, blur):
    points = np.asarray(points, dtype=float)
    if closed and np.linalg.norm(points[-1] - points[0]) > .001:
        points = np.vstack((points, points[0]))
    s = np.r_[0., np.cumsum(np.linalg.norm(np.diff(points, axis=0), axis=1))]
    count = int(s[-1] / interval) + 1
    query = np.linspace(0, s[-1], count, endpoint=not closed)
    # The survey uses long straight segments and dense points around corners.
    # Resampling then filtering locally keeps the actual straight lines.
    if blur:
        xy = np.column_stack([np.interp(query, s, points[:, k]) for k in range(2)])
        xy = gaussian_filter1d(xy, blur / interval, axis=0, mode='wrap' if closed else 'nearest')
    else:
        xy = CubicSpline(s, points, bc_type='periodic' if closed else 'natural')(query)
    return xy, (query / s[-1]) * (2 * math.pi)


F1_DATA = json.loads((ROOT / 'nurburgring-projected.json').read_text())
f1xy, phase = sample_route(F1_DATA['coordinates'], True, .97, 1.5)
f1 = np.column_stack([f1xy, 53.75 + 4.8 * np.sin(phase + .8) + 2.9 * np.sin(2 * phase + .3)])
sxy, phase = sample_route(np.asarray(S_ANCHORS)+[-62,60], True, .60, 0.)
s_track = np.column_stack([sxy, 18.06 + .80 * np.sin(phase - .35) + .32 * np.sin(2 * phase)])
wxy, _ = sample_route(WATER_ANCHORS, False, .48, 0.)
swim = np.column_stack([wxy, np.full(len(wxy), WATER_Z)])
f1_tree, s_tree, w_tree = (cKDTree(a[:, :2]) for a in (f1, s_track, swim))


def f1_port_indices():
    useful = np.flatnonzero((f1[:,1]>93) & (f1[:,0]>67) & (f1[:,0]<159))
    return [int(useful[np.argmin(np.abs(f1[useful,0]-x))]) for x in F1_PORT_X]


f1_ports = f1_port_indices()
w_ports = [int(np.argmin(np.abs(swim[:,0]-x))) for x in SWIM_PORT_X]


def ellipse(x, y, cx, cy, rx, ry):
    return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2


def walk_level(x, y):
    if x > 90 and y > 4:
        return 24.08
    if x > 78 and y < -16:
        return 14.62
    if x < -108:
        return 23.22
    if y < -47:
        return 12.90
    if y > 41:
        return 22.36
    return 17.63


def hill(x, y):
    # Snow-bearing terrain forms a broad alpine shoulder with two summit knobs.
    large = 99 * math.exp(-ellipse(x,y,110,123,54,39)*1.55)
    small = 31 * math.exp(-ellipse(x,y,136,128,26,22)*1.7)
    shoulder = 17 * math.exp(-ellipse(x,y,78,109,40,38)*1.3)
    return max(0, large + small + shoulder - 14) if y > 62 else 0


def mask_water(x, y, extension=0.0):
    return any(ellipse(x,y,cx,cy,a+extension,b+extension)<1 for cx,cy,a,b in BASINS) or (
        w_tree.query([x,y])[0] < SWIM_WIDTH/2+extension
        and -52.5-extension < x < 52.7+extension
    )


def make_cells():
    poly = Polygon(TERRAIN)
    coords = [(i,j,i*CELL,j*CELL) for i in range(-65,67) for j in range(-36,39)]
    centers = np.array([(x,y) for _,_,x,y in coords])
    occupancy = poly.contains_points(centers)
    fb_dist, fb_i = f1_tree.query(centers)
    kart_dist, kart_i = s_tree.query(centers)
    river_dist, river_i = w_tree.query(centers)
    slots = {}
    f1_pad = F1_WIDTH/2 + CELL * .84
    river_pad = SWIM_WIDTH/2 + CELL * .77
    for k,(i,j,x,y) in enumerate(coords):
        if not occupancy[k]:
            continue
        hx = hill(x,y)
        variation = (.65*math.cos(x*.083+y*.027) + .54*math.sin(y*.11-x*.035))
        level = walk_level(x,y)
        h = round((level + hx + (variation if hx > 4 or x < -218 or x > 249 else 0))/.86)*.86
        land = "snow" if hx > 37 or (y>87 and x>60 and x<160 and hx>9) else "grass"
        if x < -134 and y > 4 and y < 68:
            land = "fairway"
        if kart_dist[k] < S_WIDTH/2+CELL*.84:
            h = min(h, s_track[kart_i[k],2]-.12)
            h = max(h, s_track[kart_i[k],2]-.45)
            land = "grass"
        ocean = mask_water(x,y,CELL*.51) or ((abs(x+43)<7.4 and -150.4<y<-95) or (abs(x-47)<5.5 and -137<y<-80))
        # Preserve a real basin floor. The entire water surface shares one datum.
        if ocean:
            h = -1.29
            land = "sand"
        upper_water = (
            (ellipse(x,y,-65,106,12.5,8.25)<1 or (abs(x+65)<4.0 and y>109))
            and kart_dist[k]>8.9 and fb_dist[k]>14 and y>102
        )
        if upper_water:
            h=20.64
            land="rock"

        body = f1[fb_i[k]]
        tunnel_any = f1_ports[0] <= fb_i[k] <= f1_ports[1]
        tunnel_z_min, tunnel_z_max = body[2]-2.35, body[2]+9.0
        intervals = None
        if fb_dist[k] < f1_pad:
            if tunnel_any:
                h = max(h, tunnel_z_max+6.5)
                intervals = [(None,tunnel_z_min,"rock"),(tunnel_z_max,h,land)]
            else:
                h = min(h, body[2]-2.2)
        river_tunnel = (w_ports[0] <= river_i[k] <= w_ports[1]) and river_dist[k] < river_pad
        if river_tunnel:
            h = max(18.06, level)
            intervals = [(None,-1.29,"sand"),(9.46,h,"grass")]
        envelope=(1.0-((x+2)/279.0)**2-((y-2)/155.0)**2*.67)
        mass=max(.13,min(1.0,envelope))
        furrow=(.69+.21*math.sin(x*.024-1.2)+.12*math.cos(y*.052+x*.033))
        depth=22+72*mass*furrow+7*(math.sin(x*.061+y*.085)+1)
        depth-= 7*(i%3==0 and j%3==0)
        bottom= -round(depth/4.30)*4.30
        iv = [(bottom if a is None else a,b,m) for a,b,m in intervals] if intervals else [(bottom,h,land)]
        slots[i,j] = (h, iv, 22.36 if upper_water else (WATER_Z if ocean else 0.), land)
    return slots


cells = make_cells()


def surface(x,y):
    cell = cells.get((round(x/CELL),round(y/CELL)))
    return cell[0] if cell else -100.0


def sample_walk(points):
    xy, _ = sample_route(points, False, 1.1, 0)
    z = np.array([surface(x,y) for x,y in xy])
    d,b=s_tree.query(xy)
    # The two paths that cross S asphalt are elevated on pedestrian bridges.
    # Widen the rise before the carriageway and blend into the plaza stairs.
    fade=np.clip((18.-d)/12.,0.,1.)
    bridge=s_track[b,2]+(5.0 if points[0][0]>-125 else 4.0)
    z=np.where(z<-50,walk_level(*points[0]),z)
    z=np.maximum(z,walk_level(*points[0])-0.8 if points[0][1]<-25 else -20.)
    z=np.maximum(z,z*(1.-fade)+bridge*fade)
    z=gaussian_filter1d(z,2.5,mode='nearest')
    return np.column_stack([xy,z + .18])


walks={name:sample_walk(points) for name,points in WALKS_XY}
xplan=['skiing','ice skating race','frisbee golf','full golf','mini golf','carnival','sports','adventure','swimming','swim east']


def ribbon_hit(a,i,j,width,levels):
    x,y=a[i,:2]
    side=a[(i+1)%len(a),:2]-a[(i-1)%len(a),:2]
    n=np.array([-side[1],side[0]])/np.linalg.norm(side)
    for offset in np.linspace(-width*.48,width*.48,7):
        px,py=np.array([x,y])+n*offset
        slot=cells.get((round(px/CELL),round(py/CELL)))
        if not slot: continue
        for z in levels:
            for bot,top,_ in slot[1]:
                if bot+.04 < a[i,2]+z < top-.04:
                    return [i,j,float(px),float(py),float(a[i,2]+z),[bot,top]]
    return None


def xy_intersections(a):
    min_gaps=[]
    for i in range(len(a)):
        d=a[(i+1)%len(a),:2]-a[i,:2]
        r=a[i+2:,:2]-a[i,:2]
        q=np.concatenate((a[i+3:,:2],a[:1,:2]),axis=0)-a[i,:2] if len(r) else r
        if not len(r): continue
        cross=lambda x,y: x[...,0]*y[...,1]-x[...,1]*y[...,0]
        ds=q-r
        denom=cross(d,ds)
        t=np.divide(cross(r,ds),denom,out=np.full_like(denom,np.nan),where=np.abs(denom)>1e-10)
        u=np.divide(cross(r,d),denom,out=np.full_like(denom,np.nan),where=np.abs(denom)>1e-10)
        inds=np.flatnonzero((t>.001)&(t<.999)&(u>.001)&(u<.999))
        if len(inds): min_gaps.extend((i,int(j+i+2)) for j in inds)
    return min_gaps


def measure(track):
    dif=np.diff(np.vstack([track,track[0]]),axis=0)
    horiz=np.linalg.norm(dif[:,:2],axis=1)
    return float(np.linalg.norm(dif,axis=1).sum()), float(np.max(np.abs(dif[:,2])/horiz)*100)


def validate():
    fail={}
    fail['F1 terrain clearance']=[r for i in range(len(f1)) if (r:=ribbon_hit(f1,i,'f1',F1_WIDTH,[.10,1.4,4.3,7.0]))][:10]
    fail['S terrain clearance']=[r for i in range(len(s_track)) if (r:=ribbon_hit(s_track,i,'s',S_WIDTH,[.09,1.2,2.2]))][:10]
    fail['Swim tunnel clearance']=[r for i in range(1,len(swim)-1) if (r:=ribbon_hit(swim,i,'water',SWIM_WIDTH,[-2.8,-.9,.04,1.8,3.0]))][:10]
    fail['F1 centerline crossings']=xy_intersections(f1)
    fail['S centerline crossings']=xy_intersections(s_track)
    fail['Unsupported S samples']=[i for i,(x,y,z) in enumerate(s_track) if not 0 <= z-surface(x,y) <= 1.7]
    for name,track,width in [('F1',f1,F1_WIDTH),('S',s_track,S_WIDTH)]:
        edge=np.linalg.norm(np.diff(np.vstack([track[:,:2],track[0,:2]]),axis=0),axis=1)
        distance=np.r_[0.,np.cumsum(edge)]
        pairs=cKDTree(track[:,:2]).query_pairs(width + .25,output_type='ndarray')
        distance_between=np.abs(distance[pairs[:,0]]-distance[pairs[:,1]])
        separate=np.minimum(distance_between,distance[-1]-distance_between)>2.4*width
        fail[name+' distant swept strips'] = pairs[separate].tolist()[:10]
    connections={}
    for _,points in WALKS_XY:
        for p,q in zip(points,points[1:]):
            a,b=tuple(p),tuple(q)
            connections.setdefault(a,set()).add(b)
            connections.setdefault(b,set()).add(a)
    open_nodes=[(-56,12)]
    connected=set(open_nodes)
    while open_nodes:
        for node in connections[open_nodes.pop()]:
            if node not in connected:
                connected.add(node)
                open_nodes.append(node)
    fail['Disconnected venue gates']=[name for name,pos in GATES.items() if tuple(pos) not in connected]
    fail['Dry swim samples']=[i for i,(x,y,_) in enumerate(swim) if not mask_water(x,y)]
    # Check the connected wet surface using the exact terrain cells the model exports.
    from collections import deque
    wet={(i,j) for (i,j),slot in cells.items() if slot[2]==WATER_Z}
    start=(round(swim[0,0]/CELL),round(swim[0,1]/CELL))
    end=(round(swim[-1,0]/CELL),round(swim[-1,1]/CELL))
    queue=deque([start])
    reached={start}
    while queue:
        i,j=queue.popleft()
        for node in ((i-1,j),(i+1,j),(i,j-1),(i,j+1)):
            if node in wet and node not in reached:
                reached.add(node)
                queue.append(node)
    fail['Disconnected swim basin'] = [] if end in reached and start in wet else [start,end]

    # An actual closed asphalt strip is exported to the stage, not an implied lap.
    f_len,f_grade=measure(f1)
    s_len,s_grade=measure(s_track)
    dist,indx=s_tree.query(f1[:,:2])
    common=dist<(S_WIDTH+F1_WIDTH)/2
    min_vertical=float(np.min(np.abs(f1[common,2]-s_track[indx[common],2]))) if common.any() else None
    w_dist=float(np.linalg.norm(np.diff(swim[w_ports[0]:w_ports[1]+1],axis=0),axis=1).sum())
    def count_roof(a, interval, clearance):
        return sum(surface(x,y)>z+clearance for x,y,z in a[interval[0]:interval[1]+1])
    f_covered=count_roof(f1,f1_ports,9.)
    w_covered=count_roof(swim,w_ports,4.1)
    assert min_vertical is None or min_vertical>9
    assert f_covered >= .85*(f1_ports[1]-f1_ports[0])
    assert w_covered >= .8*(w_ports[1]-w_ports[0])
    fail={key:value for key,value in fail.items() if value}
    if fail:
        raise RuntimeError(json.dumps(fail,indent=2))
    return {
        'f1_lap_m':round(f_len,2),'s_lap_m':round(s_len,2),
        'f1_max_centerline_grade_percent':round(f_grade,2),
        's_max_centerline_grade_percent':round(s_grade,2),
        'min_vertical_clearance_at_projected_road_overlap_m':round(min_vertical,2) if min_vertical is not None else None,
        'swim_portal_span_m':round(w_dist,2),
        'f1_portal_span_m':round(float(np.linalg.norm(np.diff(f1[f1_ports[0]:f1_ports[1]+1],axis=0),axis=1).sum()),2),
        'shortest_road_centerline_plan_separation_m':round(float(dist.min()),2),
        'f1_external_sky_fraction':round(sum((round(x/CELL),round(y/CELL)) not in cells for x,y,_ in f1)/len(f1),3),
        'terrain_grid_m':CELL,
        'connected_venue_gates':len(GATES),
        'continuous_open_bores':2,
    }


checks=validate()
tables={
    'cell':CELL,'water_z':WATER_Z,'f1_width':F1_WIDTH,'s_width':S_WIDTH,'swim_width':SWIM_WIDTH,
    'outline':TERRAIN,'sources':F1_DATA,'f1':f1,'s_track':s_track,'swim':swim,
    'f1_ports':f1_ports,'swim_ports':w_ports,
    'basins':BASINS,'walks':walks,'activities':ACTIVITIES,'gates':GATES,
    'cells':[[i,j,slot[0],slot[1],slot[2],slot[3]] for (i,j),slot in cells.items()],
    'checks':checks,
}
def encode(v):
    if isinstance(v,np.ndarray): return np.round(v,5).tolist()
    raise TypeError(type(v))
(ROOT/'layout.json').write_text(json.dumps(tables,default=encode,separators=(',',':')))
(ROOT/'checks.json').write_text(json.dumps(checks,indent=2)+'\n')
print(checks)
