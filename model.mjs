export const SHUTTERS=[25,30,50,100,125,200,250,500,1000];
export const APERTURES=[1.8,2,2.8,4,5.6,8,11,16];
export const ISOS=[100,200,400,800,1600,3200,4000,6400,12800,25600,51200];
export const BASE={shutter:2,aperture:3,iso:2};
export function parameters(s){const t=1/SHUTTERS[s.shutter],f=APERTURES[s.aperture],iso=ISOS[s.iso],photons=(t*50)*(4/f)**2;return{t,f,iso,exposure:photons*iso/400,blur:Math.max(.1,26/f-1.2),noise:.0025*Math.sqrt(iso/400)/Math.sqrt(Math.max(photons,.03))+.0004*(iso/400)};}
