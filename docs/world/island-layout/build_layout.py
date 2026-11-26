"""Translate the approved island illustration into one measured review layout."""
from collections import defaultdict, deque
from heapq import heapify, heappop, heappush
import json
import math
from pathlib import Path

from matplotlib.path import Path as Polygon
import numpy as np
from scipy.interpolate import CubicSpline
from scipy.spatial import cKDTree

ROOT = Path(__file__).resolve().parent
CELL, WATER_Z, WATER_BOTTOM = 4.30, 4.30, -1.29
F1_WIDTH, S_WIDTH, SWIM_WIDTH = 13.76, 6.88, 10.32
F1_HEADROOM, SWIM_HEADROOM = 9.46, 5.16

OUTLINE = [
    (-217, 26), (-214,-24), (-202,-66), (-178,-103), (-143,-125),
    (-95,-140), (-48,-146), (2,-150), (54,-143), (102,-130),
    (150,-115), (183,-94), (208,-62), (218,-22), (216,18), (213,52),
    (203,85), (180,110), (143,130), (100,148), (56,156), (14,157),
    (-36,155), (-86,155), (-130,147), (-168,132), (-194,108), (-207,75),
]

# One lap in driving order. Long perimeter sweepers lead to a slow left-hand
# combination at the rock spur and the climb behind the ski ridge.
F1_ANCHORS = [
    (96,-148), (41,-159), (-15,-164), (-70,-163), (-122,-152),
    (-169,-137), (-208,-114), (-231,-82), (-239,-49), (-232,-22),
    (-239,7), (-241,34), (-232,61), (-212,77), (-191,78), (-173,81),
    (-155,88), (-138,91), (-123,86), (-109,75), (-94,69), (-83,77),
    (-77,101), (-75,126), (-64,148), (-44,164), (-12,171), (26,173),
    (75,170), (124,161), (170,144), (208,118), (230,88), (233,55),
    (227,23), (227,0), (235,-29), (232,-62), (217,-91),
    (190,-112), (148,-130),
]
S_ANCHORS = [
    (70,-77),(45,-82),(13,-82),(-23,-79),(-52,-80),(-89,-77),
    (-115,-67),(-123,-54),(-112,-42),(-96,-34),(-87,-19),
    (-75,-4),(-60,3),(-41,-1),(-20,-9),(1,-11),(24,-8),(48,0),
    (69,4),(90,-1),(103,-13),(98,-26),(82,-34),(73,-46),(85,-55),(88,-67),
]
WATER_ANCHORS = [
    (-53,-112),(-38,-105),(-24,-102),(-11,-102),(2,-103),(12,-109),
    (21,-118),(35,-121),(52,-121),
]
BASINS = [(-49,-114,42,23),(43,-125,29,15)]
OUTFALLS = [
    {"x": -52, "y_start": -126, "width": 11.2},
    {"x": 43, "y_start": -132, "width": 8.6},
]
# Decorative mountain spillways feed small stepped basins above the garden.
CASCADES = [
    {"x": 43, "y": 88, "a": 12, "b": 11, "surface": 66.22, "lip": 79.55},
    {"x": 43, "y": 65, "a": 12, "b": 10, "surface": 51.60, "lip": 57.55},
    {"x": 42, "y": 43, "a": 11, "b": 10, "surface": 37.84, "lip": 35.55},
]
SKI = [(5,135),(-6,122),(-17,111),(-17,96),(-26,81),(-31,66)]

ACTIVITIES = {
    "full golf": [-157,20], "frisbee golf": [-113,26], "mini golf": [-93,-57],
    "bowling": [-50,-45], "skee-ball": [-32,-45], "billiards": [-14,-45], "darts": [4,-45],
    "basketball shooting": [67,26], "soccer penalties": [95,31], "baseball batting": [123,34],
    "football throwing": [151,34], "archery": [179,36], "paintball": [148,71],
    "obstacle course": [151,-20], "long jump": [118,-47], "high jump": [153,-48],
    "skate racing": [164,-76], "skiing": [5,135], "ice skating race": [-17,52],
    "S kart racing and time trial": [69,-88], "F1 racing and time trial": [139,-120],
    "swimming and diving": [-52,-112],
}
GATES = {
    "golf": (-119,4), "disc golf": (-111,18), "mini golf": (-84,-68),
    "carnival plaza": (33,-62), "conservatory": (14,9), "alpine village": (116,92),
    "ski lodge": (-39,71), "ice skating": (-28,34), "sports": (121,19),
    "paintball": (148,55), "adventure": (128,-12), "diving lagoon": (-24,-91),
    "lazy river": (72,-108), "S kart staging": (67,-91), "Skyway overlook": (133,-112),
}
# Every repeated node is shared by coordinate, including its height.
WALKS = {
    "carnival promenade": [(-84,-68),(-68,-66),(-38,-65),(-10,-64),(16,-62),(33,-62)],
    "carnival to garden": [(33,-62),(23,-40),(18,-18),(14,9)],
    "golf ridge": [(-111,18),(-119,4),(-133,-15),(-136,-36),(-138,-59),(-131,-79),(-115,-88),(-83,-90),(-54,-91),(-24,-91)],
    "mini golf bridge": [(-83,-90),(-84,-68)],
    "lagoon promenade": [(-24,-91),(8,-94),(36,-94),(67,-91),(86,-91),(101,-84)],
    "river walk": [(67,-91),(72,-108),(84,-115),(111,-113),(133,-112)],
    "garden to golf": [(14,9),(-9,16),(-35,15),(-60,15),(-85,15),(-111,18)],
    "garden to alpine": [(14,9),(-3,27),(-28,34),(-47,44),(-49,59),(-39,71)],
    "upper terraces": [(-39,71),(-30,82),(-9,84),(15,78),(36,83),(60,88),(85,92),(116,92)],
    "garden to sports": [(14,9),(35,6),(54,11),(80,13),(101,14),(121,19),(169,19),(190,22)],
    "sports to paintball": [(121,19),(137,19),(137,50),(148,55),(169,58),(179,72),(168,87),(144,92),(116,92)],
    "sports to adventure": [(121,19),(120,5),(128,-12),(128,-31),(139,-32),(139,-58),(129,-78),(101,-84)],
    "adventure to carnival": [(101,-84),(105,-65),(103,-47),(85,-45),(63,-44),(49,-52),(33,-62)],
    "alpine lookout": [(116,92),(128,112),(113,130),(88,135),(67,132),(57,113)],
}
DISTRICTS = {
    "Golf terraces": [-158,22], "Carnival": [-30,-46], "Conservatory": [14,24],
    "Ski ridge": [-6,113], "Alpine château": [116,99], "Ice skating": [-17,53],
    "Sports": [136,39], "Adventure": [148,-44], "Diving lagoon": [-49,-114],
    "Lazy river": [43,-125],
}


def sample_route(points, closed, step):
    coords = np.asarray(points, dtype=float)
    if closed:
        coords = np.vstack((coords, coords[0]))
    distance = np.r_[0., np.cumsum(np.linalg.norm(np.diff(coords, axis=0), axis=1))]
    inputs = np.linspace(0, distance[-1], math.ceil(distance[-1] / step) + (not closed),
                         endpoint=not closed)
    interpolator = CubicSpline(distance, coords, bc_type="periodic" if closed else "natural")
    return interpolator(inputs)


def route_length(points):
    return np.linalg.norm(np.diff(points, axis=0), axis=1).sum()


f1_xy = sample_route(F1_ANCHORS, True, .92)
f1_z = 14.1 + .074 * (f1_xy[:,1] + 163)
f1 = np.column_stack((f1_xy, f1_z))
s_xy = sample_route(S_ANCHORS, True, .61)
s_track = np.column_stack((s_xy, 24.0 + .022 * (s_xy[:,1] + 46)))
swim_xy = sample_route(WATER_ANCHORS, False, .49)
swim = np.column_stack((swim_xy, np.full(len(swim_xy), WATER_Z)))
f1_tree, s_tree, w_tree = (cKDTree(route[:,:2]) for route in (f1, s_track, swim))
f1_ports = [int(f1_tree.query(p)[1]) for p in [(-163,85),(-110,76)]]
swim_ports = [int(w_tree.query(p)[1]) for p in [(-10,-102),(16,-113)]]
footprint = Polygon(OUTLINE)
ski_path = sample_route(SKI,False,1.)
ski_tree=cKDTree(ski_path)
ski_heights=np.linspace(90.30,43.86,len(ski_path))


def ellipse(x, y, cx, cy, a, b):
    return ((x - cx) / a) ** 2 + ((y - cy) / b) ** 2


def bump(x, y, cx, cy, a, b, rise):
    return rise * math.exp(-1.6 * ellipse(x, y, cx, cy, a, b))


def land_height(x, y):
    if y < -94:
        return 14.62
    if x < -95 and y > -26 and y < 59:
        return 30.10 + .86 * math.sin((x+116)*.047) * math.cos((y-18)*.055)
    if x > 106 and y < -11:
        return 27.52 if y > -62 else 22.36
    if x > 54 and y > 14:
        return (45.58 if y > 82 else 37.84) + (.86 if y > 118 else 0)
    if y > 41:
        return 37.84
    if y > 6:
        return 31.82
    return 23.22


def make_cells():
    coords = [(i,j,i*CELL,j*CELL) for i in range(-53,54) for j in range(-38,41)]
    xy = np.array([(x,y) for _,_,x,y in coords])
    in_land = footprint.contains_points(xy)
    f_dist,f_index = f1_tree.query(xy)
    s_dist,s_index = s_tree.query(xy)
    w_dist,w_index = w_tree.query(xy)
    ski_dist,ski_index = ski_tree.query(xy)
    result = {}
    for k,(i,j,x,y) in enumerate(coords):
        if not in_land[k]:
            continue
        base = land_height(x,y)
        relief = (bump(x,y,24,125,51,49,76) + bump(x,y,44,110,32,32,17)
                  + bump(x,y,-134,94,46,32,46) + bump(x,y,-154,122,27,25,12))
        relief = max(0, relief - 5.5) * (1.-.024*max(0.,y-139)) if y>139 else max(0,relief-5.5)
        if y < 54 and x < -80:
            relief *= np.clip((y-33)/21,0,1)
        h = round((base+relief+(1.0 if relief>10 else .22)*math.sin(.21*x+.29*y))/.86)*.86
        if ski_dist[k]<18.:
            fade=float(np.clip((18.-ski_dist[k])/9.,0,1))
            h=round((h*(1.-fade)+ski_heights[ski_index[k]]*fade)/.86)*.86
        snow = (relief > 11 or ski_dist[k]<13.) and y > 56
        land = "snow" if snow else "fairway" if x < -97 and -26 < y < 59 else "grass"
        water = 0.
        floor = None
        segments = None
        wet = (min(ellipse(x,y,cx,cy,a+2.2,b+2.2) for cx,cy,a,b in BASINS)<1
               or w_dist[k] < SWIM_WIDTH/2+CELL*.77
               or any(y<f["y_start"] and abs(x-f["x"])<f["width"]*.54 for f in OUTFALLS))
        if wet:
            h,land,water = WATER_BOTTOM,"sand",WATER_Z
        upper_water = next((p for p in CASCADES if
                            ellipse(x,y,p["x"],p["y"],p["a"],p["b"])<1 or
                            abs(x-p["x"])<4.4 and p["lip"]-1.0<y<p["y"]), None)
        if upper_water:
            water = upper_water["surface"]
            h,land = water-2.15,"rock"
        if s_dist[k] < S_WIDTH/2 + CELL*.80:
            h = float(s_track[s_index[k],2]-.28)
            land = "grass"
        if swim_ports[0] <= w_index[k] <= swim_ports[1] and w_dist[k]<SWIM_WIDTH/2+CELL*.77:
            floor = WATER_BOTTOM
            h,land = max(18.06,base),"grass"
            segments = (WATER_Z+SWIM_HEADROOM,h)
        if f_dist[k] < F1_WIDTH/2 + CELL*.84:
            road_z = f1[f_index[k],2]
            if f1_ports[0] <= f_index[k] <= f1_ports[1]:
                floor = road_z-2.55
                h = max(h, road_z+F1_HEADROOM+8.60)
                segments = (road_z+F1_HEADROOM,h)
            else:
                h = min(h, road_z-2.24)
        # Block strata taper to clustered rock spires beneath the outer terraces.
        mass = max(.13, 1 - ellipse(x,y,0,4,213,160)*.66)
        erosion = .64+.14*math.sin(x*.047+y*.022)+.19*math.cos(y*.039-x*.017)
        depth = 24+77*mass*erosion+8*(1+math.sin(x*.091+y*.059))
        bottom = -4.30*round(depth/4.30)
        iv = [(bottom,h,land)] if segments is None else [(bottom,floor,"rock" if not wet else "sand"),(*segments,land)]
        result[(i,j)] = (float(h),iv,water,land)
    return result


cells = make_cells()


def cell_at(x,y):
    return cells.get((round(x/CELL),round(y/CELL)))


def surface(x,y):
    cell = cell_at(x,y)
    return cell[0] if cell else -100.


def walk_deck(x, y):
    # Account for the full walking deck. The same approach ramps give each
    # bridge a clear opening over the S circuit.
    h = max(surface(x+u,y+v) for u,v in [(0,0),(-1.8,0),(1.8,0),(0,-1.8),(0,1.8)])
    h += .19
    d,idx = s_tree.query([x,y])
    fade = float(np.clip((17-d)/10.8,0,1))
    deck = h + max(0,s_track[idx,2]+4.7-h) * fade
    distance,_ = ski_tree.query([x,y])
    snow_bridge = np.clip((21.-distance)/10.5,0,1)
    return max(deck, h+4.90*snow_bridge)


def sampled_walk(points):
    stretches = []
    for idx,(a,b) in enumerate(zip(points,points[1:])):
        xy = np.linspace(a,b,math.ceil(math.dist(a,b)/1.08)+1)
        stretches.extend(tuple(np.round(point,6)) for point in (xy[1:] if idx else xy))
    return stretches


def make_walks():
    samples={name:sampled_walk(points) for name,points in WALKS.items()}
    edges=defaultdict(list)
    for points in samples.values():
        for a,b in zip(points,points[1:]):
            d=math.dist(a,b)
            edges[a].append((b,d))
            edges[b].append((a,d))
    heights={point:walk_deck(*point) for point in edges}
    queue=[(-height,point) for point,height in heights.items()]
    heapify(queue)
    # Propagate the minimum changes needed to keep one connected profile
    # under the stair-grade limit. Shared junctions are one node.
    while queue:
        neg,point=heappop(queue)
        height=-neg
        if height<heights[point]-1e-8:
            continue
        for other,d in edges[point]:
            reachable_height=height-.44*d
            if reachable_height>heights[other]+1e-8:
                heights[other]=reachable_height
                heappush(queue,(-reachable_height,other))
    return {name:np.array([(*point,heights[point]) for point in points]) for name,points in samples.items()}


walks=make_walks()


def clearance(route, width, levels, closed, on_land=False):
    before = np.roll(route,1,axis=0)
    after = np.roll(route,-1,axis=0)
    if not closed:
        before[0], after[-1] = route[0],route[-1]
    differences = after[:,:2]-before[:,:2]
    normal = differences[:,::-1]*[-1,1]
    normal /= np.linalg.norm(normal,axis=1)[:,None]
    failures = []
    for i,(x,y,z) in enumerate(route):
        for offset in np.linspace(-width*.49,width*.49,9):
            px,py = np.array([x,y])+normal[i]*offset
            slot=cell_at(px,py)
            if slot is None and not on_land:
                continue
            if slot is None or any(a+.035<z+dz<b-.035 for a,b,_ in slot[1] for dz in levels):
                failures.append([i,round(float(px),2),round(float(py),2),round(float(z),2)])
    return failures[:8]


def lap_stats(track,width):
    seg = np.diff(np.vstack((track,track[0])),axis=0)
    lengths = np.linalg.norm(seg[:,:2],axis=1)
    if lengths.min() < .15 or lengths.max() > 2.5:
        raise ValueError("Non-continuous or duplicate lap samples")
    distance = np.r_[0.,np.cumsum(lengths)]
    pairs = cKDTree(track[:,:2]).query_pairs(width+.15,output_type="ndarray")
    gap = distance[pairs[:,1]]-distance[pairs[:,0]]
    nonlocal_pairs = pairs[np.minimum(gap,distance[-1]-gap)>width*2.2]
    if len(nonlocal_pairs):
        raise ValueError(f"Road strip crosses or overlaps itself near {nonlocal_pairs[:4].tolist()}")
    return [round(float(np.linalg.norm(seg,axis=1).sum()),2),
            round(float(np.max(abs(seg[:,2])/lengths)*100),2)]


def reachable(start, neighbors):
    reached = {start}
    queue = deque([start])
    while queue:
        for other in neighbors(queue.popleft()):
            if other not in reached:
                reached.add(other)
                queue.append(other)
    return reached


def validate():
    failures = {
        "F1 road clip": clearance(f1,F1_WIDTH,[.08,1.34,3.5,7.5],True),
        "S kart road clip": clearance(s_track,S_WIDTH,[.07,1.4,2.5],True,True),
        "Swim bore clip": clearance(swim,SWIM_WIDTH,[-3.8,-1.1,.07,1.82,3.9],False,True),
        "S kart missing surface": [i for i,(x,y,z) in enumerate(s_track) if not 0<=z-surface(x,y)<.7][:8],
    }
    wet = {(i,j) for (i,j),(_,_,water,_) in cells.items() if water==WATER_Z}
    start,end = [tuple(np.rint(p[:2]/CELL).astype(int)) for p in swim[[0,-1]]]
    wet_reached = reachable(start,lambda p: (
        (i,j) for i,j in [(p[0]+1,p[1]),(p[0]-1,p[1]),(p[0],p[1]+1),(p[0],p[1]-1)]
        if (i,j) in wet))
    if start not in wet or end not in wet_reached:
        failures["Dry connection between lagoons"] = [start,end]
    graph = defaultdict(set)
    for anchors in WALKS.values():
        for a,b in zip(anchors,anchors[1:]):
            graph[a].add(b)
            graph[b].add(a)
    reached = reachable(GATES["carnival plaza"],lambda n: graph[n])
    failures["Disconnected gates"] = [name for name,point in GATES.items() if point not in reached]
    failures["Walkway leaves island"] = [(name,int(i)) for name,r in walks.items()
                                          for i,(x,y,_) in enumerate(r) if cell_at(x,y) is None][:8]
    walk_grade=max(float(np.max(abs(np.diff(r[:,2]))/np.linalg.norm(np.diff(r[:,:2],axis=0),axis=1)))
                   for r in walks.values())
    if walk_grade > .44001:
        failures["Path exceeds stair-grade limit"] = [walk_grade]
    failures["Walk under kart bridge"] = [
        (name,int(i)) for name,r in walks.items() for i,(x,y,z) in enumerate(r)
        if (work:=s_tree.query([x,y]))[0] < (S_WIDTH+3.9)/2
        and z-s_track[work[1],2] < 3.65
    ][:8]
    ski_pass = walks["upper terraces"]
    ski_gap,_ = ski_tree.query(ski_pass[:,:2])
    ski_bridge_clearance = min(z - walk_deck(x,y) + 4.9
                               for (x,y,z),distance in zip(ski_pass,ski_gap) if distance < 10.5)
    if ski_bridge_clearance < 4.83:
        failures["Ski bridge clearance"] = [ski_bridge_clearance]
    for track,ports,headroom,name in [(f1,f1_ports,F1_HEADROOM,"F1"),(swim,swim_ports,SWIM_HEADROOM,"Swim")]:
        interval = track[ports[0]+3:ports[1]-2]
        failures[f"{name} roof missing over bore"] = [
            i for i,(x,y,z) in enumerate(interval)
            if surface(x,y)<z+headroom+.15][:8]
    failures = {k:v for k,v in failures.items() if v}
    if failures:
        raise ValueError(json.dumps(failures,indent=2))
    d, _ = s_tree.query(f1[:,:2])
    if d.min() < (F1_WIDTH+S_WIDTH)/2 + 1:
        raise ValueError("The F1 and S kart deck envelopes overlap")
    f1_lap,f1_grade = lap_stats(f1,F1_WIDTH)
    s_lap,s_grade = lap_stats(s_track,S_WIDTH)
    return {
        "f1_lap_m": f1_lap, "s_lap_m": s_lap,
        "max_f1_grade_percent": f1_grade, "max_s_grade_percent": s_grade,
        "f1_road_width_m": F1_WIDTH, "s_road_width_m": S_WIDTH,
        "f1_bore_length_m": round(float(route_length(f1[f1_ports[0]:f1_ports[1]+1])),2),
        "swim_bore_length_m": round(float(route_length(swim[swim_ports[0]:swim_ports[1]+1])),2),
        "minimum_race_centerline_spacing_m": round(float(d.min()),2),
        "walkable_venue_gate_count": len(reached.intersection(GATES.values())),
        "max_walk_stair_grade_percent": round(walk_grade*100,2),
        "ski_bridge_clearance_above_grade_envelope_m": round(float(ski_bridge_clearance),2),
        "terrain_groups_m": CELL,
    }


def encode(value):
    if isinstance(value,np.ndarray):
        return np.round(value,5).tolist()
    if isinstance(value,np.generic):
        return value.item()
    raise TypeError(type(value))


def main():
    checks = validate()
    layout = {
        "cell": CELL,"water_z": WATER_Z,"water_bottom": WATER_BOTTOM,
        "f1_width": F1_WIDTH,"s_width": S_WIDTH,"swim_width": SWIM_WIDTH,
        "f1": f1,"s_track": s_track,"swim": swim,"f1_ports": f1_ports,"swim_ports": swim_ports,
        "outline": OUTLINE,"gates": GATES,"activities": ACTIVITIES,"districts": DISTRICTS,
        "basins": BASINS,"walks": walks,"ski": SKI,"ski_path": ski_path,"outfalls": OUTFALLS,"cascades": CASCADES,
        "cells": [[i,j,h,segments,water,land] for (i,j),(h,segments,water,land) in cells.items()],
        "checks": checks,
    }
    (ROOT/"layout.json").write_text(json.dumps(layout,default=encode,separators=(",",":"))+"\n")
    (ROOT/"checks.json").write_text(json.dumps(checks,indent=2)+"\n")
    print(json.dumps(checks,indent=2))


if __name__ == "__main__":
    main()
