// All candidates consume strictly earlier draws from the same number-pool era.
export const VERSION='1.0.0';
export const names=['Uniform','Frequency','Recent 30','Recent 100','Gap','Transition','Adaptive ensemble'];
export function pool(date){return date<'2019-05-14'?49:date<'2026-04-14'?50:52}
export function nextDraw(date){const d=new Date(date+'T12:00:00Z');do{d.setUTCDate(d.getUTCDate()+1)}while(d.getUTCDay()!==2&&d.getUTCDay()!==5);return d.toISOString().slice(0,10)}
export function normalize(w){ // Project to marginal inclusion probabilities totaling seven.
 let lo=0,hi=100;for(let k=0;k<80;k++){let m=(lo+hi)/2;let s=w.reduce((a,x)=>a+Math.min(.95,Math.max(.001,x*m)),0);if(s>7)hi=m;else lo=m}return w.map(x=>Math.min(.95,Math.max(.001,x*(lo+hi)/2)))}
export function candidates(history,n){
 const base=7/n, freq=(window)=>{const h=history.slice(-window),w=Array(n).fill(20*base);for(const r of h)for(const x of r.numbers)w[x-1]++;return normalize(w.map(x=>x/(h.length+20)))};
 const gap=Array(n).fill(history.length);history.forEach((r,i)=>r.numbers.forEach(x=>gap[x-1]=history.length-1-i));
 const last=new Set(history.at(-1)?.numbers||[]),trans=Array(n).fill(30*base);let exposure=30;
 for(let i=1;i<history.length;i++){const overlap=history[i-1].numbers.filter(x=>last.has(x)).length/7;exposure+=overlap;for(const x of history[i].numbers)trans[x-1]+=overlap}
 return [Array(n).fill(base),freq(history.length),freq(30),freq(100),normalize(gap.map(x=>base*(.8+.4*Math.min(x,30)/30))),normalize(trans.map(x=>x/exposure))];
}
export function brier(p,actual){const s=new Set(actual);return p.reduce((a,x,i)=>a+(x-(s.has(i+1)?1:0))**2,0)/p.length}
export function choose(p,seed){ // Deterministic weighted sampling without replacement.
 let s=seed>>>0;const random=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return (s+.5)/4294967296};return p.map((w,i)=>({i:i+1,k:-Math.log(random())/w})).sort((a,b)=>a.k-b.k).slice(0,7).map(x=>x.i).sort((a,b)=>a-b)
}
export function top(p,seed){return p.map((v,i)=>({v,i,k:Math.sin((i+1)*997+seed)})).sort((a,b)=>b.v-a.v||a.k-b.k).slice(0,7).map(x=>x.i+1).sort((a,b)=>a-b)}
export function ensemble(ps,losses){const w=losses.map(v=>Math.exp(-80*v)),sum=w.reduce((a,b)=>a+b,0);return ps[0].map((_,i)=>ps.reduce((a,p,j)=>a+p[i]*w[j]/sum,0))}
export function evaluate(draws,{warmup=30}={}){
 const records=[],byEra={};let history=[],era=0,losses=Array(6).fill(0),count=0;
 for(const draw of draws){const n=pool(draw.date);if(n!==era){era=n;history=[];losses=Array(6).fill(0);count=0}
 if(history.length>=warmup){const ps=candidates(history,n);ps.push(ensemble(ps,losses.map(x=>x/Math.max(1,count))));
 const scores=ps.map((p,j)=>{const line=j===0?choose(p,Number(draw.date.replaceAll('-',''))):top(p,Number(draw.date.replaceAll('-','')));return {model:names[j],brier:brier(p,draw.numbers),hits:line.filter(x=>draw.numbers.includes(x)).length,line}});
 records.push({date:draw.date,pool:n,actual:draw.numbers,scores});scores.slice(0,6).forEach((s,j)=>losses[j]+=s.brier);count++}
 history.push(draw);byEra[n]={count:history.length};
 }
 const n=era,ps=candidates(history,n);ps.push(ensemble(ps,losses.map(x=>x/Math.max(1,count))));
 return {records,byEra,probabilities:ps,trainingThrough:draws.at(-1)?.date};
}
export function summarize(records){return names.map((model,j)=>{const rows=records.map(r=>r.scores[j]),deltas=records.map(r=>r.scores[0].brier-r.scores[j].brier),mean=deltas.reduce((a,b)=>a+b,0)/rows.length,se=Math.sqrt(deltas.reduce((a,x)=>a+(x-mean)**2,0)/Math.max(1,rows.length-1)/rows.length);return {model,draws:rows.length,brier:rows.reduce((a,r)=>a+r.brier,0)/rows.length,hits:rows.reduce((a,r)=>a+r.hits,0)/rows.length,threePlus:rows.filter(r=>r.hits>=3).length,improvement:mean,lower:mean-3*se,upper:mean+3*se}})}
