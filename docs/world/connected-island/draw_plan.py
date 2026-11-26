"""Draw the route plan and its two sections from the shared layout, not the renders."""
from pathlib import Path
import json
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D
from matplotlib.patches import Rectangle
from matplotlib.collections import PatchCollection
import numpy as np

ROOT=Path(__file__).parent
j=json.loads((ROOT/'layout.json').read_text())
ink='#233d50'; paper='#f5f3ec'; muted='#597180'
fig = plt.figure(figsize=(14.4,8.2),facecolor=paper)
fig.text(.061,.919,'LetsGo floating island',fontsize=27,weight='bold',color=ink)
fig.text(.063,.878,'One shared model for the front and back views',fontsize=12,color=muted)
ax=fig.add_axes([.045,.345,.91,.51],facecolor=paper)
patches=[]; fills=[]
for i,k,h,iv,water,land in j['cells']:
    c=j['cell']
    patches.append(Rectangle((i*c-c/2,k*c-c/2),c+.02,c+.02))
    fills.append('#81d3cd' if water else '#cadce5' if land=='snow' else '#d2dcbd')
ax.add_collection(PatchCollection(patches,facecolors=fills,edgecolor='none',zorder=0))
for route in j['walks'].values():
    p=np.array(route)
    ax.plot(*p[:,:2].T,c='#a38048',lw=1.09,zorder=2)
for key,colour in [('f1','#325884'),('s_track','#b64d48')]:
    p=np.array(j[key]); p=np.vstack([p,p[0]])
    ax.plot(*p[:,:2].T,c=colour,lw=2.35,zorder=3)
sw=np.array(j['swim'])
ax.plot(*sw[:,:2].T,c='#187582',lw=1.6,zorder=4)
for key,name,c in [('f1','f1_ports','#203749'),('swim','swim_ports','#166b78')]:
    p=np.array(j[key]); a,b=j[name]
    ax.plot(*p[a:b+1,:2].T,c=paper,lw=4.7,zorder=5)
    ax.plot(*p[a:b+1,:2].T,c=c,lw=2.55,linestyle='--',zorder=6)
    ax.scatter(*p[[a,b],:2].T,c=c,s=41,edgecolor=paper,zorder=8)
for label,where,to in [
 ('Full golf and disc golf',(-195,66),(-291,143)),
 ('Carnival and S-kart terrace',(-103,56),(-138,179)),
 ('Snow ridge',(113,132),(144,179)),
 ('Sports',(198,29),(272,100)),
 ('Adventure',(166,-40),(285,-85)),
 ('Conservatory',(-107,-40),(-200,-120)),
 ('Swim lagoons',(-8,-80),(23,-165)),
]:
    ax.annotate(label,where,xytext=to,color=ink,fontsize=10,weight='bold',ha='center',va='center',
                arrowprops=dict(arrowstyle='-',lw=.81,color='#8a9e9d'),zorder=9)
# Small compass abbreviations keep the map readable in both camera directions.
ax.annotate('',(-412,155),(-412,121),arrowprops={'arrowstyle':'-|>','color':muted,'lw':1.2})
ax.text(-412,161,'N',ha='center',fontsize=8,color=muted,weight='bold')
ax.set_xlim(-453,453); ax.set_ylim(-181,194); ax.set_aspect('equal'); ax.axis('off')
handles=[Line2D([0],[0],color=c,lw=2.65,ls=ls,label=txt) for c,ls,txt in [
    ('#325884','-','F1 sky loop'),('#b64d48','-','S-kart loop'),('#a38048','-','Walking paths'),
    ('#166b78','--','Swim tunnel'),('#203749','--','F1 tunnel'),
]]
fig.legend(handles=handles,loc='lower left',bbox_to_anchor=(.063,.322),frameon=False,ncol=5,fontsize=9.6)

fig.text(.064,.280,'F1 tunnel section · 66 m',fontsize=12,weight='bold',color=ink)
fig.text(.550,.280,'Swim-through section · 18 m',fontsize=12,weight='bold',color=ink)
a1=fig.add_axes([.064,.092,.405,.148],facecolor=paper)
a2=fig.add_axes([.550,.092,.387,.148],facecolor=paper)
for a,key,ports,color in [(a1,'f1','f1_ports','#325884'),(a2,'swim','swim_ports','#178b96')]:
    route=np.array(j[key]); start,end=j[ports]
    margin=21 if key=='f1' else 30
    r=route[start-margin:end+margin+1]
    distance=np.r_[0,np.cumsum(np.linalg.norm(np.diff(r[:,:2],axis=0),axis=1))]
    distance-=distance[margin]
    ins=(distance>=0) & (distance<=distance[len(r)-margin-1])
    if key=='f1':
        a.fill_between(distance,r[:,2]+9,r[:,2]+17,where=ins,color='#b4bebd',interpolate=True)
        a.plot(distance,r[:,2],lw=3,c=color)
        a.set_ylim(min(r[:,2])-4,max(r[:,2])+21)
    else:
        a.fill_between(distance,r[:,2]-5.59,r[:,2],color='#a5d9df')
        a.plot(distance,r[:,2],lw=2.3,c=color)
        a.fill_between(distance,r[:,2]+5.16,r[:,2]+9.12,where=ins,color='#b4bebd',interpolate=True)
        a.set_ylim(-3,15)
    for x in [0.0,distance[len(r)-margin-1]]:
        y=float(np.interp(x,distance,r[:,2]))
        a.scatter(x,y,s=24,c=color,edgecolor=paper,zorder=5)
        a.plot([x,x], [y-2,y+(6 if key=='f1' else 4)],c=muted,ls=':',lw=.8)
    a.set_xlim(distance[0]-1,distance[-1]+1); a.axis('off')
fig.text(.064,.048,'2.16 km F1 lap  •  293 m S-kart lap  •  13 venue gates connected by the walking network',
         fontsize=10,color=muted)
fig.savefig(ROOT/'layout-plan.png',dpi=135)
