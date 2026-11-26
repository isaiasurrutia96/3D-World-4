"""Draw the shared layout and the two continuous tunnel sections."""
import json
from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.collections import PatchCollection
from matplotlib.lines import Line2D
from matplotlib.patches import Rectangle
import numpy as np

ROOT=Path(__file__).resolve().parent
layout=json.loads((ROOT/'layout.json').read_text())
cells={(i,j):(h,v,wet,land) for i,j,h,v,wet,land in layout['cells']}
checks=layout['checks']
cell=layout['cell']
ink='#253a44'
paper='#faf6ee'
muted='#526875'
grid='#e9e2d4'
f1_color='#31528f'
s_color='#be514e'
water_color='#167c94'
path_color='#976d3b'
fig=plt.figure(figsize=(14.4,10),facecolor=paper)
fig.text(.06,.929,'LetsGo floating island',fontsize=30,weight='bold',color=ink)
fig.text(.062,.895,'Layout based on the selected island image',fontsize=13,color=muted)
plan=fig.add_axes([.035,.311,.93,.563],facecolor=paper)

patches=[]
colors=[]
for (i,j),(h,segments,wet,land) in cells.items():
    x,y=i*cell,j*cell
    patches.append(Rectangle((x-cell/2,y-cell/2),cell+.015,cell+.015))
    if wet and len(segments)>1:
        value='#c1cead'
    elif wet:
        value='#81ccd4'
    elif land=='snow':
        value='#d8e5ec' if h<85 else '#edf1f3'
    elif land=='fairway':
        value=['#c5d797','#d0dc9d'][i%2]
    else:
        value='#dce5c3' if h<28 else ('#d3e1ba' if h<39 else '#cad8b3')
    colors.append(value)
plan.add_collection(PatchCollection(patches,facecolors=colors,edgecolors='none',zorder=0))
for x in range(-250,260,50):
    plan.axvline(x,color=grid,linewidth=.65,zorder=-1)
for y in range(-150,160,50):
    plan.axhline(y,color=grid,linewidth=.65,zorder=-1)

for route in layout['walks'].values():
    route=np.array(route)
    plan.plot(*route[:,:2].T,color=path_color,lw=.96,alpha=.82,zorder=2)
for where in layout['gates'].values():
    plan.scatter(*where,s=10,c=path_color,edgecolor=paper,linewidth=.45,zorder=3)

for key,color,width in [('f1',f1_color,3.2),('s_track',s_color,2.6)]:
    route=np.array(layout[key])
    route=np.vstack((route,route[0]))
    plan.plot(*route[:,:2].T,color=paper,lw=width+1.4,zorder=3)
    plan.plot(*route[:,:2].T,color=color,lw=width,zorder=4)
for key,ports,color,width in [('f1','f1_ports',f1_color,3.2),('swim','swim_ports',water_color,2.3)]:
    route=np.array(layout[key])
    a,b=layout[ports]
    if key=='swim':
        plan.plot(*route[:,:2].T,color=color,lw=width,zorder=4)
    plan.plot(*route[a:b+1,:2].T,color=paper,lw=width+1.4,zorder=5)
    plan.plot(*route[a:b+1,:2].T,color=color,lw=width,ls=(0,(2.4,1.5)),zorder=6)
    plan.scatter(*route[[a,b],:2].T,c=color,s=38,edgecolor=paper,linewidth=.9,zorder=7)

positions={
    'Golf terraces':(-313,24),'Carnival':(-284,-59),'Conservatory':(3,19),
    'Ski ridge':(-36,187),'Alpine château':(155,179),
    'Ice skating':(-42,65),'Sports':(299,36),'Adventure':(294,-47),
    'Diving lagoon':(-181,-153),'Lazy river':(134,-161),
}
for label,target in layout['districts'].items():
    to=positions[label]
    if label=='Conservatory':
        plan.text(to[0],to[1],label,ha='center',va='center',color=ink,weight='bold',
                  fontsize=9,bbox=dict(boxstyle='round,pad=.27',fc=paper,ec='none',alpha=.83),zorder=9)
        continue
    kwargs=dict(arrowstyle='-',color='#87948c',linewidth=.92,connectionstyle='arc3,rad=.03')
    plan.annotate(label,target,xytext=to,ha='center',va='center',color=ink,weight='bold',
                  fontsize=9.4,arrowprops=kwargs,annotation_clip=False,zorder=9,
                  bbox=dict(boxstyle='round,pad=.22',fc=paper,ec='none',alpha=.89))

plan.annotate('',(-295,154),(-295,126),arrowprops=dict(arrowstyle='-|>',color=muted,lw=1.2))
plan.text(-295,162,'N',ha='center',weight='bold',color=muted,fontsize=9)
for xx,span,label in [(251,25,None),(276,25,'50 m')]:
    plan.plot([xx,xx+span],[-169,-169],color=muted,lw=2.5 if xx==251 else .85)
    if label:
        plan.text(xx+span,-182,label,color=muted,ha='right',fontsize=8.8)
plan.set_xlim(-355,350)
plan.set_ylim(-185,194)
plan.set_aspect('equal')
plan.axis('off')
legend=[Line2D([0],[0],lw=w,color=c,ls=ls,label=name) for name,w,c,ls in [
    ('F1 sky circuit',3.2,f1_color,'-'),('S-kart circuit',2.7,s_color,'-'),
    ('Walking links',1.4,path_color,'-'),('Covered race segment',2.4,f1_color,'--'),
    ('Covered swim passage',2.3,water_color,'--'),
]]
fig.legend(handles=legend,loc='lower center',bbox_to_anchor=(.5,.277),frameon=False,
           ncol=5,fontsize=9.4,handlelength=2.6)

fig.add_artist(Line2D([.061,.94],[.262,.262],transform=fig.transFigure,color='#dad3c7',lw=.9))
fig.text(.062,.230,'Mountain road tunnel',fontsize=14,weight='bold',color=ink)
fig.text(.543,.230,'Lagoon swim-through',fontsize=14,weight='bold',color=ink)
fig.text(.062,.205,f"{checks['f1_bore_length_m']:.0f} m between the two road portals",fontsize=9.3,color=muted)
fig.text(.543,.205,f"{checks['swim_bore_length_m']:.0f} m of passage at one water level",fontsize=9.3,color=muted)

for index,key,ports,color,loc in [
    (0,'f1','f1_ports',f1_color,[.062,.084,.408,.111]),
    (1,'swim','swim_ports',water_color,[.543,.084,.395,.111]),
]:
    ax=fig.add_axes(loc,facecolor=paper)
    route=np.array(layout[key])
    a,b=layout[ports]
    margin=24 if key=='f1' else 29
    a0,b0=max(0,a-margin),min(b+margin,len(route)-1)
    strip=route[a0:b0+1]
    distance=np.r_[0.,np.cumsum(np.linalg.norm(np.diff(strip,axis=0),axis=1))]
    distance-=distance[a-a0]
    first,last=0.,distance[b-a0]
    covered=(distance>=first-1e-4)&(distance<=last+1e-4)
    deck=strip[:,2]
    tops=np.array([cells[(round(x/cell),round(y/cell))][0] for x,y,z in strip])
    rv=9.46 if key=='f1' else 5.16
    ax.fill_between(distance,deck+rv,np.maximum(tops,deck+rv),
                    where=covered,color='#aeb5a9',interpolate=True)
    ax.fill_between(distance,deck-6.5,deck-(2.55 if key=='f1' else 5.59),
                    color='#c4b7a7')
    if key=='swim':
        ax.fill_between(distance,deck-5.59,deck,color='#acdce3')
    ax.plot(distance,deck,color=color,lw=2.5)
    for x in (first,last):
        z=float(np.interp(x,distance,deck))
        ax.plot([x,x],[z-.6,z+rv],c=muted,ls=':',lw=.9)
        ax.scatter(x,z,zorder=6,s=31,edgecolor=paper,color=color,linewidth=.8)
    ax.set_ylim(min(deck)-6.5,max(deck)+(36 if index==0 else 20))
    ax.set_xlim(distance[0],distance[-1])
    ax.axis('off')

fig.text(.061,.041,
         f"{checks['f1_lap_m']/1000:.2f} km F1 lap  ·  {checks['s_lap_m']:.0f} m S-kart lap  ·  {checks['walkable_venue_gate_count']} connected destination gates",
         fontsize=10.5,color=muted)
fig.savefig(ROOT/'layout-plan.png',dpi=140)
