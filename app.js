import {SHUTTERS,APERTURES,ISOS,BASE,PRESETS,parameters} from './model.mjs';
const $=s=>document.querySelector(s),canvas=$('#scene'),ctx=canvas.getContext('2d',{alpha:false});
const W=960,H=540,buffer=document.createElement('canvas'),bg=document.createElement('canvas');buffer.width=bg.width=W;buffer.height=bg.height=H;const bx=buffer.getContext('2d',{willReadFrequently:true}),gx=bg.getContext('2d');
const foreground=document.createElement('canvas');foreground.width=W;foreground.height=H;const fx=foreground.getContext('2d');
const room=new Image();room.src='assets/room.jpg';let state={...BASE},paused=matchMedia('(prefers-reduced-motion: reduce)').matches,isolate=false,comparison=false,ready=false,lastTime=0,timeline=0,blurKey='';
const linear=Float32Array.from({length:256},(_,i)=>{let v=i/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});
const encode=Uint8ClampedArray.from({length:4097},(_,i)=>{let v=i/4096;return 255*(v<=.0031308?12.92*v:1.055*v**(1/2.4)-.055)});
let seed=4827;function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
function drawBackground(p){if(blurKey===p.f)return;blurKey=p.f;gx.clearRect(0,0,W,H);gx.save();gx.filter=`blur(${p.blur.toFixed(2)}px)`;gx.drawImage(room,-16,-9,W+32,H+18);gx.restore();}
function ballX(t){let v=((t*.6)%1.5+1.5)%1.5;return 122+(v<=.75?v:1.5-v)*1000;}
function ball(x,y,opacity){fx.save();fx.globalCompositeOperation='lighter';fx.globalAlpha=opacity;const gr=fx.createRadialGradient(x-12,y-15,4,x,y,38);gr.addColorStop(0,'#ffc981');gr.addColorStop(.32,'#ef9250');gr.addColorStop(.75,'#db642e');gr.addColorStop(1,'#a9341c');fx.fillStyle=gr;fx.beginPath();fx.arc(x,y,35,0,Math.PI*2);fx.fill();fx.restore();}
function render(){if(!ready)return;const view=comparison?BASE:state,p=parameters(view);drawBackground(p);bx.drawImage(bg,0,0);const y=H*.73;
// A soft oval contact shadow without a rectangular clip.
bx.save();bx.translate(ballX(timeline),y+40);bx.scale(1,.24);
const shadow=bx.createRadialGradient(0,0,2,0,0,47);
shadow.addColorStop(0,'rgba(18,9,3,.28)');shadow.addColorStop(.5,'rgba(18,9,3,.13)');shadow.addColorStop(1,'rgba(18,9,3,0)');
bx.fillStyle=shadow;bx.beginPath();bx.ellipse(0,0,48,48,0,0,Math.PI*2);bx.fill();bx.restore();
fx.clearRect(0,0,W,H);const samples=paused?1:12;for(let i=0;i<samples;i++){const age=paused?0:(i/(samples-1)-.5)*p.t;ball(ballX(timeline+age),y,1/samples);}bx.drawImage(foreground,0,0); // Shutter integrates a moving subject, not the static room.
const frame=bx.getImageData(0,0,W,H),d=frame.data;const gain=isolate&&!comparison?1:p.exposure;const sigma=p.noise; // Illustrative sensor-independent grain, intentionally visible in comparison mode too.
for(let i=0;i<d.length;i+=4){const common=(random()+random()+random()-1.5)*sigma;for(let c=0;c<3;c++){const v=Math.max(0,Math.min(1,linear[d[i+c]]*gain+common+(random()-.5)*sigma*.24));d[i+c]=encode[Math.round(v*4096)];}}
ctx.putImageData(frame,0,0);
}
function update(){const p=parameters(state);$('#shutterValue').innerHTML=`1/${SHUTTERS[state.shutter]} <small>с</small>`;$('#apertureValue').textContent=`f/${p.f}`;$('#isoValue').textContent=p.iso.toLocaleString('ru-RU');$('#osd').innerHTML=comparison?'1/50 <i>F4</i> ISO 400':`1/${SHUTTERS[state.shutter]} <i>F${p.f}</i> ISO ${p.iso}`;
const ev=comparison?0:p.ev;$('#evNeedle').style.left=`${50+Math.max(-3,Math.min(3,ev))/6*100}%`;$('#evValue').textContent=`${ev>0?'+':''}${ev.toFixed(1).replace('.',',')} EV`;
$('#shutterHint').textContent=p.t===1/50?'1/50 с — привычный смаз для видео 25 к/с.':p.t>1/50?'Длиннее выдержка: больше света и сильнее смаз движущегося мяча.':'Короче выдержка: меньше света и чётче движение. Видео может выглядеть резче по движению.';
$('#apertureHint').textContent=p.f<4?'Малое f: отверстие больше, светлее, фон размывается сильнее.':p.f>4?'Большое f: отверстие меньше, темнее, фон становится чётче.':'f/4 — умеренное размытие фона. Расстояния и фокус здесь фиксированы.';
$('#isoHint').textContent=p.iso>1600?'Выше ISO: ярче сигнал, заметнее условный шум. Света в сцене больше не стало.':'ISO меняет яркость сигнала. Само по себе оно не добавляет света.';
$('#modeHint').textContent=isolate?'Яркость выровнена для сравнения смаза, фона и шума. Настройки остаются прежними.':'Ручной режим: автоматика ничего не компенсирует.';
$('#sceneNote').textContent=(state.light<0?'Свет в комнате уменьшен на 3 ступени. ':'Свет в комнате обычный. ')+(comparison?'Сейчас показаны исходные настройки. ':'')+'Мяч в плоскости фокуса, фон дальше. Рендер показывает приближённые эффекты.';
for(const key of ['shutter','aperture','iso']){$('#'+key).value=state[key];$('#'+key).setAttribute('aria-valuetext',key==='shutter'?`1/${SHUTTERS[state.shutter]} секунды`:key==='aperture'?`f/${p.f}`:String(p.iso));}
$('#motion').textContent=paused?'Включить движение':'Пауза движения';$('#motion').setAttribute('aria-pressed',String(!paused));$('#compare').textContent=comparison?'Вернуться к моим настройкам':'Показать исходный кадр';$('#compare').setAttribute('aria-pressed',String(comparison));
document.querySelectorAll('[data-preset]').forEach(b=>{const pre=PRESETS[b.dataset.preset];b.classList.toggle('active',Object.keys(BASE).every(k=>pre[k]===state[k]));});render();}
for(const key of ['shutter','aperture','iso'])$('#'+key).addEventListener('input',e=>{state[key]=+e.target.value;comparison=false;update();});
document.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>{state={...PRESETS[b.dataset.preset]};comparison=false;update();}));
$('#reset').addEventListener('click',()=>{state={...BASE};isolate=false;comparison=false;$('#isolate').checked=false;update();});
$('#isolate').addEventListener('change',e=>{isolate=e.target.checked;comparison=false;update();});
$('#motion').addEventListener('click',()=>{paused=!paused;update();});
$('#compare').addEventListener('click',()=>{comparison=!comparison;update();});
room.onload=()=>{ready=true;$('#loading').hidden=true;$('#loading').style.display='none';update();};room.onerror=()=>{$('#loading').textContent='Не удалось загрузить сцену. Обновите страницу при подключении к интернету.';};
function tick(t){requestAnimationFrame(tick);if(document.hidden||!ready)return;if(t-lastTime<40)return;const dt=lastTime?Math.min((t-lastTime)/1000,.2):0;lastTime=t;if(!paused)timeline+=dt;render();}requestAnimationFrame(tick);update();
window.cameraLab={getState:()=>({...state,isolate,paused,comparison}),parameters:()=>parameters(state)};
