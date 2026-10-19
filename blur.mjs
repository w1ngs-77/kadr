// Separable box passes approximate a Gaussian. No Canvas filter API required.
export function blurRGB(source,width,height,sigma){const out=new Uint8ClampedArray(source);if(sigma<.4)return out;const radius=Math.max(1,Math.round(sigma)),size=radius*2+1;let a=out,b=new Uint8ClampedArray(a.length);
for(let pass=0;pass<3;pass++){
 for(let y=0;y<height;y++){const row=y*width;let r=0,g=0,bl=0;for(let x=-radius;x<=radius;x++){const i=(row+Math.max(0,Math.min(width-1,x)))*4;r+=a[i];g+=a[i+1];bl+=a[i+2];}for(let x=0;x<width;x++){const i=(row+x)*4;b[i]=r/size;b[i+1]=g/size;b[i+2]=bl/size;b[i+3]=255;const l=(row+Math.max(0,x-radius))*4,h=(row+Math.min(width-1,x+radius+1))*4;r+=a[h]-a[l];g+=a[h+1]-a[l+1];bl+=a[h+2]-a[l+2];}}
 [a,b]=[b,a];
 for(let x=0;x<width;x++){let r=0,g=0,bl=0;for(let y=-radius;y<=radius;y++){const i=(Math.max(0,Math.min(height-1,y))*width+x)*4;r+=a[i];g+=a[i+1];bl+=a[i+2];}for(let y=0;y<height;y++){const i=(y*width+x)*4;b[i]=r/size;b[i+1]=g/size;b[i+2]=bl/size;b[i+3]=255;const l=(Math.max(0,y-radius)*width+x)*4,h=(Math.min(height-1,y+radius+1)*width+x)*4;r+=a[h]-a[l];g+=a[h+1]-a[l+1];bl+=a[h+2]-a[l+2];}}
 [a,b]=[b,a];
}return a;}
