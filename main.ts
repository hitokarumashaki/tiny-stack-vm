import*as f from'node:fs';
let I=o=>o==1?1:o==2?4:o>47&&o<52?2:0,
P=o=>o==7?3:o==5||o==6||o==65||o>15&&o<35&&o!=23&&o!=27?2:o==3||o==4||o==23||o==27||o>48&&o<51||o==64||o>79&&o<82||o==83?1:0,
S=o=>o==6||o==7?3:o==4||o==5?2:o==1||o==2||o>15&&o<35||o==64||o==82?1:0,
e=new TextEncoder;
function r(p,g){
let D=new Int32Array(256),C=new Int32Array(64),M=new Int32Array(256),O=new Uint8Array(65536),
s=0,c=0,i=0,q=0,n=0,l=0,t=0,L=p.length,E=x=>[O.slice(0,l),x];
for(;;){
if(n==1e6)return E(10);
if(q<0||q>=L)return E(9);
let o=p[q];
if(!(o<8||o>15&&o<35&&o!=31||o>47&&o<53||o>63&&o<66||o>79&&o<84))return E(5);
let m=I(o);
if(q+m>=L)return E(9);
n++;
let N=q+1+m;
if(s<P(o))return E(2);
if(s-P(o)+S(o)>256)return E(3);
q=N;
if(o>15&&o<35&&o!=23&&o!=27){let b=D[s-1],a=D[s-2],v;
if(o>18&&o<23&&!b)return E(4);
v=o==16?a+b|0:o==17?a-b|0:o==18?Math.imul(a,b):o==19?a/b|0:o==20?a%b|0:o==21?(a>>>0)/(b>>>0)|0:o==22?(a>>>0)%(b>>>0)|0:o==24?a&b:o==25?a|b:o==26?a^b:o==28?a<<(b&31):o==29?a>>(b&31):o==30?a>>>(b&31):o==32?+(a==b):o==33?+(a<b):+((a>>>0)<(b>>>0));
s-=2;D[s++]=v;continue}
switch(o){
case 0:return E(0);
case 1:D[s++]=p[N-1]<<24>>24;break;
case 2:D[s++]=p[N-4]|p[N-3]<<8|p[N-2]<<16|p[N-1]<<24;break;
case 3:s--;break;
case 4:D[s]=D[s-1];s++;break;
case 5:t=D[s-1];D[s-1]=D[s-2];D[s-2]=t;break;
case 6:D[s]=D[s-2];s++;break;
case 7:t=D[s-3];D[s-3]=D[s-2];D[s-2]=D[s-1];D[s-1]=t;break;
case 23:D[s-1]=-D[s-1]|0;break;
case 27:D[s-1]=~D[s-1];break;
case 48:case 49:case 50:{let y=(p[N-2]|p[N-1]<<8)<<16>>16,k=o==48;
if(o!=48){let v=D[--s];k=o==49?!v:!!v}
if(k)q=N+y;break}
case 51:if(c==64)return E(7);C[c++]=N;q=p[N-2]|p[N-1]<<8;break;
case 52:if(!c)return E(8);q=C[--c];break;
case 64:{let a=D[s-1];if(a<0||a>255)return E(6);D[s-1]=M[a];break}
case 65:{let a=D[s-1],v=D[s-2];if(a<0||a>255)return E(6);s-=2;M[a]=v;break}
case 80:{let b=e.encode(String(D[s-1]));if(l+b.length>65536)return E(11);s--;O.set(b,l);l+=b.length;break}
case 81:if(l+1>65536)return E(11);O[l++]=D[--s]&255;break;
case 82:D[s++]=i<g.length?g[i++]:-1;break;
case 83:return E(D[--s]&255);
default:return E(5);
}}}
let A=process.env.MAKEFUN_INPUT_DIR??'/input',B=process.env.MAKEFUN_OUTPUT_DIR??'/output';
for(let d of f.readdirSync(A).sort()){
let[o,v]=r(f.readFileSync(A+'/'+d+'/program.bin'),f.readFileSync(A+'/'+d+'/input.bin'));
f.mkdirSync(B+'/'+d,{recursive:true});
f.writeFileSync(B+'/'+d+'/stdout.bin',o);
f.writeFileSync(B+'/'+d+'/exit.txt',v+'\n');}
