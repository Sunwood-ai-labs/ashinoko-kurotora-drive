export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const wrap=(v,n)=>((v%n)+n)%n;
export function makeTrack(data){
 const R=data.route,S=data.station,L=S.at(-1),N=S.length;
 function at(s){s=wrap(s,L);let lo=0,hi=N-1;while(hi-lo>1){let m=(lo+hi)>>1;if(S[m]<=s)lo=m;else hi=m;}const t=(s-S[lo])/(S[hi]-S[lo]);return R[lo].map((v,k)=>v+(R[hi][k]-v)*t);}
 function frame(s){const p=at(s),a=at(s-2),b=at(s+2),dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy);return {p,heading:Math.atan2(dy,dx),grade:(b[2]-a[2])/d};}
 function curvature(s){const a=frame(s-3).heading,b=frame(s+3).heading;return Math.atan2(Math.sin(b-a),Math.cos(b-a))/6;}
 return {at,frame,curvature,L};
}
export function initialState(start=1250){return {s:start,lateral:0,heading:0,speed:0,steer:0,distance:0,time:0,contacts:0,contactCooldown:0,lap:0,finished:false};}
export function step(st,input,dt,t){
 if(st.finished)return;dt=clamp(dt,0,1/30);const target=clamp(input.steer||0,-1,1);st.steer+=(target-st.steer)*Math.min(1,dt*8);
 const gas=clamp(input.throttle||0,0,1),brake=clamp(input.brake||0,0,1),grade=t.frame(st.s).grade;
 st.speed=clamp(st.speed+(gas*10-brake*24-(.28+.0017*st.speed*st.speed)-grade*6)*dt,0,65);
 const cur=t.curvature(st.s),ds=st.speed*Math.cos(st.heading)/Math.max(.5,1-cur*st.lateral),angle=st.steer*(.43/(1+st.speed*.055));
 st.heading+=((st.speed/3.5)*Math.tan(angle)-cur*ds)*dt;st.heading=Math.atan2(Math.sin(st.heading),Math.cos(st.heading));
 st.lateral+=st.speed*Math.sin(st.heading)*dt;st.s=wrap(st.s+ds*dt,t.L);st.distance+=ds*dt;st.time+=dt;st.contactCooldown=Math.max(0,st.contactCooldown-dt);
 const halfWidth=1.071*Math.abs(Math.cos(st.heading))+2.872*Math.abs(Math.sin(st.heading)),edge=Math.max(0,3.5-halfWidth);
 if(Math.abs(st.lateral)>edge){st.lateral=clamp(st.lateral,-edge,edge);st.speed*=Math.exp(-dt*3);if(st.contactCooldown===0){st.contacts++;st.contactCooldown=.6;}}
 if(st.distance>=t.L){st.finished=true;st.speed=0;st.lap=1;}
}
export function autoInput(st,t){
 const f=t.frame(st.s),look=clamp(5+st.speed*.55,5,23),p=t.at(st.s+look);
 const x=f.p[0]-Math.sin(f.heading)*st.lateral,y=f.p[1]+Math.cos(f.heading)*st.lateral;
 const h=Math.atan2(p[1]-y,p[0]-x)-(f.heading+st.heading),alpha=Math.atan2(Math.sin(h),Math.cos(h));
 const steer=clamp(Math.atan2(7*Math.sin(alpha),Math.max(2,Math.hypot(p[0]-x,p[1]-y)))/(.43/(1+st.speed*.055)),-1,1);
 let target=28;const horizon=Math.max(35,st.speed*st.speed/14+18);
 for(let d=0;d<=horizon;d+=4){const curvature=Math.abs(t.curvature(st.s+d));const safe=clamp(Math.sqrt(2.8/Math.max(curvature,.003)),2.5,28);target=Math.min(target,Math.sqrt(safe*safe+12*d));}
 target*=clamp(1-Math.abs(st.heading)*.5-Math.abs(st.lateral)*.15,.25,1);
 return {steer,throttle:clamp((target-st.speed)*.65,0,1),brake:clamp((st.speed-target)*.4,0,1),targetSpeed:target};
}
