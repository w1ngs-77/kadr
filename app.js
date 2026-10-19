import {SHUTTERS,APERTURES,ISOS,BASE,parameters} from './model.mjs?v=mobile1';
import {blurRGB} from './blur.mjs?v=mobile1';
const $=s=>document.querySelector(s),canvas=$('#scene'),W=640,H=360,ctx=canvas.getContext('2d',{alpha:false}),buffer=document.createElement('canvas');buffer.width=W;buffer.height=H;const bx=buffer.getContext('2d',{willReadFrequently:true});
let state={...BASE},isolate=true,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,ready=false,timeline=0,lastTime=0,dirty=true,active='',original,noiseOffset=0;
const cache=new Map(),linear=Float32Array.from({length:256},(_,i)=>{let v=i/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}),encode=Uint8ClampedArray.from({length:4097},(_,i)=>{let v=i/4096;return 255*(v<=.0031308?12.92*v:1.055*v**(1/2.4)-.055)}),noise=Float32Array.from({length:W*H},()=>Math.random()+Math.random()+Math.random()-1.5);
function background(p){if(cache.has(p.f))return cache.get(p.f);const image=bx.createImageData(W,H);image.data.set(blurRGB(original,W,H,p.blur*W/960));const c=document.createElement('canvas');c.width=W;c.height=H;c.getContext('2d').putImageData(image,0,0);cache.set(p.f,c);return c;}
function ballX(t){const distance=W*.52,cycle=distance*2,u=((t*1200+distance/2)%cycle+cycle)%cycle;return W*.24+(u<=distance?u:cycle-u);}
// Average premultiplied sprite pixels over the shutter interval. Drawing
// semi-transparent circles one after another would let the final circle erase blur.
const sprite=document.createElement('canvas'),trail=document.createElement('canvas');
const radius=H*.067,size=Math.ceil(radius*2+4),center=size/2;sprite.width=sprite.height=size;
const sc=sprite.getContext('2d'),gradient=sc.createRadialGradient(center-radius*.3,center-radius*.4,radius*.05,center,center,radius);
gradient.addColorStop(0,'#ffd28f');gradient.addColorStop(.4,'#ee9653');gradient.addColorStop(.8,'#d86430');gradient.addColorStop(1,'#a93d21');
sc.fillStyle=gradient;sc.beginPath();sc.arc(center,center,radius,0,Math.PI*2);sc.fill();const pixels=sc.getImageData(0,0,size,size).data;
function drawMovingBall(target,t,exposure,y){
 const samples=24,positions=Array.from({length:samples},(_,i)=>ballX(t+(i/(samples-1)-.5)*exposure));
 const left=Math.floor(Math.min(...positions)-center),width=Math.ceil(Math.max(...positions)+center)-left+1,top=Math.floor(y-center);
 const sums=new Float32Array(width*size*4);
 for(const pos of positions){const start=pos-center-left,x0=Math.floor(start),fraction=start-x0;
  for(let sy=0;sy<size;sy++)for(let sx=0;sx<size;sx++){
   const si=(sy*size+sx)*4,alpha=pixels[si+3]/(255*samples);if(!alpha)continue;
   for(let j=0;j<2;j++){const w=alpha*(j?fraction:1-fraction),di=(sy*width+x0+sx+j)*4;
    sums[di]+=pixels[si]*w;sums[di+1]+=pixels[si+1]*w;sums[di+2]+=pixels[si+2]*w;sums[di+3]+=w;}
  }
 }
 trail.width=width;trail.height=size;const tc=trail.getContext('2d'),frame=tc.createImageData(width,size),d=frame.data;
 for(let i=0;i<d.length;i+=4){const a=sums[i+3];if(!a)continue;d[i]=sums[i]/a;d[i+1]=sums[i+1]/a;d[i+2]=sums[i+2]/a;d[i+3]=Math.round(Math.min(1,a)*255);}
 tc.putImageData(frame,0,0);target.drawImage(trail,left,top);
}
function render(){if(!ready)return;const p=parameters(state);bx.drawImage(background(p),0,0);const x=ballX(timeline),y=H*.74,r=H*.067;
bx.save();bx.translate(x,y+r*1.12);bx.scale(1,.22);const shadow=bx.createRadialGradient(0,0,1,0,0,r*1.4);shadow.addColorStop(0,'#190c0445');shadow.addColorStop(1,'#190c0400');bx.fillStyle=shadow;bx.beginPath();bx.arc(0,0,r*1.4,0,Math.PI*2);bx.fill();bx.restore();
// Pause holds playback time, but the displayed exposure retains its motion blur.
drawMovingBall(bx,timeline,p.t,y);
const frame=bx.getImageData(0,0,W,H),d=frame.data,gain=isolate?1:p.exposure,sigma=p.noise;let ni=noiseOffset;noiseOffset=(noiseOffset+7919)%noise.length;
for(let i=0;i<d.length;i+=4){const grain=noise[ni++]*sigma;if(ni===noise.length)ni=0;for(let c=0;c<3;c++)d[i+c]=encode[Math.round(Math.max(0,Math.min(1,linear[d[i+c]]*gain+grain))*4096)];}ctx.putImageData(frame,0,0);dirty=false;}
function update(){const p=parameters(state);$('#shutterValue').textContent=`1/${SHUTTERS[state.shutter]} с`;$('#apertureValue').textContent=`f/${p.f}`;$('#isoValue').textContent=p.iso.toLocaleString('ru-RU');
for(const key of ['shutter','aperture','iso']){const el=$('#'+key);el.value=state[key];el.style.setProperty('--progress',100*state[key]/Number(el.max)+'%');el.setAttribute('aria-valuetext',key==='shutter'?`1/${SHUTTERS[state.shutter]} секунды`:key==='aperture'?`f/${p.f}`:`ISO ${p.iso}`);}
$('#brightness').setAttribute('aria-pressed',String(isolate));$('#brightnessText').textContent=isolate?'Яркость выровнена':'Яркость по настройкам';$('#brightness').setAttribute('aria-label',isolate?'Яркость выровнена. Нажми, чтобы увидеть изменение экспозиции':'Яркость по настройкам. Нажми, чтобы сравнить эффекты при одинаковой яркости');
$('#motion').textContent=paused?'▶':'Ⅱ';$('#motion').setAttribute('aria-label',paused?'Включить движение':'Пауза движения');$('#motion').setAttribute('aria-pressed',String(paused));
$('#hint').textContent=active==='aperture'?(p.f<=2.8?'Малое f: фон размыт, мяч в резкости.':'Большое f: фон становится чётче.'):active==='shutter'?(p.t>=1/50?'Длиннее выдержка — длиннее след мяча.':'Короче выдержка — мяч чётче.'):active==='iso'?(p.iso<=800?'Низкое ISO: меньше условного шума.':'Высокое ISO: условный шум заметнее.'):active==='brightness'?(isolate?'Сравнивай смаз, фон и шум без смены яркости.':'Теперь настройки меняют и яркость кадра.'):'Меняй настройки и смотри на картинку.';dirty=true;}
for(const key of ['shutter','aperture','iso'])$('#'+key).addEventListener('input',e=>{state[key]=Number(e.target.value);active=key;update();});
$('#brightness').addEventListener('click',()=>{isolate=!isolate;active='brightness';update();});$('#motion').addEventListener('click',()=>{paused=!paused;update();});$('#reset').addEventListener('click',()=>{state={...BASE};isolate=true;active='';update();});
const room=new Image();room.onload=()=>{bx.drawImage(room,0,0,W,H);original=bx.getImageData(0,0,W,H).data;ready=true;$('#loading').hidden=true;$('#loading').style.display='none';render();};room.onerror=()=>{$('#loading').textContent='Не удалось загрузить картинку. Обнови страницу.';};room.src='assets/room.jpg';
function tick(t){requestAnimationFrame(tick);if(document.hidden||!ready){lastTime=t;return;}if(t-lastTime<40)return;const dt=lastTime?Math.min((t-lastTime)/1000,.1):0;lastTime=t;if(!paused)timeline+=dt;if(!paused||dirty)render();}update();requestAnimationFrame(tick);

