import {createWriteStream} from 'node:fs';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {pipeline} from 'node:stream/promises';
import path from 'node:path';
import {MsEdgeTTS, OUTPUT_FORMAT} from 'msedge-tts';
import {probeDurationSeconds} from './lib/audio-probe.mjs';
import {withRetry} from './lib/retry.mjs';

const root=path.resolve(import.meta.dirname,'..');
const story=JSON.parse(await readFile(path.join(root,'src/english-arena/launch/story.json'),'utf8'));
const dir=path.join(root,'public/ea-launch');
await mkdir(dir,{recursive:true});
await mkdir(path.join(root,'out'),{recursive:true});
// Cache full Vietnamese font files locally; rendering makes no font network requests.
for(const [weight,url] of Object.entries({
  600:'https://fonts.gstatic.com/s/bevietnampro/v12/QdVMSTAyLFyeg_IDWvOJmVES_HToIV8y.ttf',
  800:'https://fonts.gstatic.com/s/bevietnampro/v12/QdVMSTAyLFyeg_IDWvOJmVES_HSQI18y.ttf'
})) {
  const file=path.join(dir,`font-${weight}.ttf`);
  try{if((await readFile(file)).length>1000)continue;}catch{}
  const response=await fetch(url,{signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw new Error(`Font download failed: ${response.status}`);
  await writeFile(file,Buffer.from(await response.arrayBuffer()));
}
const voice=process.env.EDGE_TTS_VOICE_EA ?? 'vi-VN-HoaiMyNeural';
const timings={};
for(const scene of story.scenes){
  const file=path.join(dir,`${scene.id}.mp3`);
  const cacheFile=path.join(dir,`${scene.id}.cache.json`);
  const identity=JSON.stringify({text:scene.narration,voice,rate:'+4%',pitch:'+0%'});
  let cached=false;
  try {cached=await readFile(cacheFile,'utf8')===identity && probeDurationSeconds(file)>0;}catch{}
  if(!cached) await withRetry(async()=>{
    const tts=new MsEdgeTTS();
    let timeout;
    try {
      await Promise.race([
        (async()=>{
          await tts.setMetadata(voice,OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
          const {audioStream}=tts.toStream(scene.narration,{rate:'+4%',pitch:'+0%',volume:'+0%'});
          await pipeline(audioStream,createWriteStream(file));
        })(),
        new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('TTS timed out')),45000);})
      ]);
      if(!(probeDurationSeconds(file)>1))throw new Error('Invalid narration audio');
      await writeFile(cacheFile,identity);
    }finally{clearTimeout(timeout);tts.close();}
  },{attempts:2,label:scene.id});
  timings[scene.id]=Math.ceil(probeDurationSeconds(file)*story.fps)+22;
  console.log(`${scene.id}: ${(timings[scene.id]/story.fps).toFixed(2)}s`);
}

// Original, deterministic light marimba bed: no third-party music samples.
const rate=24000, seconds=90, n=rate*seconds;
const samples=new Float32Array(n);
const add=(at,hz,duration,gain)=>{
  for(let i=0;i<duration*rate&&at*rate+i<n;i++){
    const t=i/rate, env=Math.min(1,t/.009)*Math.exp(-t*4.3/duration);
    samples[Math.floor(at*rate)+i]+=gain*env*(Math.sin(2*Math.PI*hz*t)+.22*Math.sin(2*Math.PI*hz*3*t));
  }
};
const bpm=96, beat=60/bpm;
const chords=[[261.63,329.63,392],[220,261.63,329.63],[174.61,220,261.63],[196,246.94,293.66]];
for(let b=0;b*beat<seconds;b++){
  const chord=chords[Math.floor(b/8)%4];
  add(b*beat,chord[b%3]*2,.75,.12);
  if(b%2===0)add(b*beat,chord[0]/2,1.3,.11);
  if(b%4===3)add((b+.5)*beat,chord[1]*2,.4,.05);
}
const wav=Buffer.alloc(44+n*2);
wav.write('RIFF',0);wav.writeUInt32LE(36+n*2,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(n*2,40);
for(let i=0;i<n;i++)wav.writeInt16LE(Math.round(Math.max(-1,Math.min(1,samples[i]))*32767),44+i*2);
await writeFile(path.join(dir,'music.wav'),wav);

const stamp=s=>{const ms=Math.round(s*1000);return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')},${String(ms%1000).padStart(3,'0')}`;};
for(const [version,ids] of Object.entries(story.versions)){
  let offset=0,count=0;const entries=[];
  for(const id of ids){
    const scene=story.scenes.find(s=>s.id===id), duration=timings[id]/story.fps;
    const weights=scene.captions.map(s=>s.length),total=weights.reduce((a,b)=>a+b,0);
    let cursor=offset+4/story.fps;
    for(let i=0;i<weights.length;i++){
      const end=cursor+(duration-22/story.fps)*weights[i]/total;
      entries.push(`${++count}\n${stamp(cursor)} --> ${stamp(end)}\n${scene.captions[i]}\n`);cursor=end;
    }
    offset+=duration;
  }
  await writeFile(path.join(root,`out/EnglishArena-Launch-${version}.srt`),entries.join('\n'));
  console.log(`${version}: ${offset.toFixed(2)}s`);
}
await writeFile(path.join(dir,'timings.json'),JSON.stringify(timings,null,2));
