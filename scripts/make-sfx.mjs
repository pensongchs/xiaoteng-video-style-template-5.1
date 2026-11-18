// 开场短音效：本机合成，节点以真实口播绝对毫秒填写。
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const [voice,planFile,outFile]=process.argv.slice(2);
if(!voice||!planFile||!outFile)throw Error('用法 node make-sfx.mjs 原声 音效节点.json 输出.wav');
const plan=JSON.parse(readFileSync(planFile,'utf8')),rate=48000,duration=plan.durationMs??7700;
const r=spawnSync('ffmpeg',['-v','info','-i',voice,'-t',String(duration/1000),'-af','volumedetect','-f','null','-'],{encoding:'utf8'});
if(r.status)throw Error('无法测量原声音量，请检查FFmpeg和原声');
const m=r.stderr.match(/mean_volume:\s*(-?[\d.]+) dB/);if(!m)throw Error('原声RMS不可测，不使用固定音量冒充');
const samples=new Float64Array(Math.ceil(duration*rate/1000));let seed=12345;
const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**31-1;};
for(const beat of plan.beats){
 const length=beat.type==='whoosh'?.25:beat.type==='softBass'?.18:.10,start=Math.round(beat.atMs*rate/1000);
 if(!Number.isFinite(start)||start<0||start>=samples.length)throw Error('音效节点越界');
 for(let k=0;k<length*rate&&start+k<samples.length;k++){
  const t=k/rate,p=t/length,env=Math.sin(Math.PI*p)**2*Math.exp(-3*p);
  const v=beat.type==='whoosh'?noise()*.35:beat.type==='softBass'?Math.sin(2*Math.PI*(70*t-80*t*t)):Math.sin(2*Math.PI*(beat.type==='glassTap'?1500:880)*t)*Math.exp(-18*p);
  samples[start+k]+=v*env;
 }
}
const rms=Math.sqrt(samples.reduce((a,v)=>a+v*v,0)/samples.length),target=10**((Number(m[1])-20)/20),gain=target/Math.max(rms,1e-12);
const wav=Buffer.alloc(44+samples.length*2);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(samples.length*2,40);
for(let i=0;i<samples.length;i++)wav.writeInt16LE(Math.round(Math.max(-.9,Math.min(.9,samples[i]*gain))*32767),44+i*2);
const out=resolve(outFile);mkdirSync(dirname(out),{recursive:true});writeFileSync(out,wav);console.log('音效已合成，目标RMS比原声低20dB；核听后使用：'+out);
