export const SHUTTERS=[25,30,50,100,125,200,250,500,1000];
export const APERTURES=[1.8,2,2.8,4,5.6,8,11,16];
export const ISOS=[100,200,400,800,1600,3200,4000,6400,12800,25600,51200];
export const BASE={shutter:2,aperture:3,iso:2,light:0};
export const PRESETS={base:{...BASE},background:{shutter:2,aperture:0,iso:0,light:0},freeze:{shutter:7,aperture:3,iso:6,light:0},dark:{shutter:2,aperture:3,iso:2,light:-3}};
export function parameters(s){const t=1/SHUTTERS[s.shutter],f=APERTURES[s.aperture],iso=ISOS[s.iso];const photons=(t/(1/50))*((4/f)**2)*(2**s.light);return {t,f,iso,photons,exposure:photons*(iso/400),ev:Math.log2(photons*(iso/400)),blur:Math.max(.18,16/f),smear:600*t,noise:.0025*Math.sqrt(iso/400)/Math.sqrt(Math.max(photons,.03))+.0004*(iso/400)};}
