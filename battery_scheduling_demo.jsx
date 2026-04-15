import { useState, useEffect, useRef, useMemo } from "react";

/* ── palette ── */
const C = {
  bg: "#060b14", bgCard: "#0c1220", bgCardHover: "#0f1628",
  border: "#162033", borderLight: "#1c2d4a",
  accent: "#22d3a7", accentDim: "#0d6b55",
  blue: "#3b8bff", blueDim: "#1a3a6e",
  amber: "#f5a623", amberDim: "#6b4a10",
  red: "#f0475a", redDim: "#5c1a22",
  purple: "#a78bfa",
  cyan: "#22d3ee",
  text: "#eaf0f6", textSec: "#8ea4bf", textMut: "#4e6380",
  peak: "#f0475a", high: "#f5a623", flat: "#7c6cfa", valley: "#22d3a7", deep: "#22d3ee",
};

/* ── electricity pricing ── */
const TIERS = {
  尖峰: { c: C.peak, p: 1.0709 }, 高峰: { c: C.high, p: 0.938 },
  平段: { c: C.flat, p: 0.6642 }, 低谷: { c: C.valley, p: 0.3904 }, 深谷: { c: C.deep, p: 0.3669 },
};
const SCHED = [[0,3,"平段"],[3,7,"低谷"],[7,11,"平段"],[11,12,"低谷"],[12,15,"深谷"],[15,16,"平段"],[16,24,"高峰"]];
const tier = h => { for (const [a,b,t] of SCHED) if (h>=a&&h<b) return t; return "平段"; };
const fmt = (h,m) => `${String(Math.floor(h)).padStart(2,"0")}:${String(m||0).padStart(2,"0")}`;

/* ── status config ── */
const BNAME = ["α-01", "β-02", "γ-03"];
const SL = { supplying:"供电中", charging:"充电中", to_station:"运往充电站", to_platform:"运往平台", standby:"平台待命", swapping:"换电中" };
const SC = { supplying:C.accent, charging:C.blue, to_station:C.amber, to_platform:C.amber, standby:C.cyan, swapping:C.purple };

/* ── schedule events (standby = at platform) ── */
const EVENTS = [
  {b:1,s:0,e:6,l:"供电",c:C.accent},
  {b:1,s:6,e:6.25,l:"换电",c:C.purple},
  {b:1,s:6.25,e:7,l:"运输→站",c:C.amber},
  {b:1,s:7,e:10,l:"充电",c:C.blue},
  {b:1,s:10,e:10.75,l:"运输→台",c:C.amber},
  {b:1,s:10.75,e:14.25,l:"平台待命",c:C.cyan},
  {b:1,s:14.25,e:14.5,l:"换电",c:C.purple},
  {b:1,s:14.5,e:24,l:"供电",c:C.accent},

  {b:2,s:0,e:2.5,l:"平台待命",c:C.cyan},
  {b:2,s:2.5,e:3.25,l:"运输→站",c:C.amber},
  {b:2,s:3.25,e:5.75,l:"充电",c:C.blue},
  {b:2,s:5.75,e:6,l:"运输→台",c:C.amber},
  {b:2,s:6,e:6.25,l:"换电",c:C.purple},
  {b:2,s:6.25,e:14.25,l:"供电",c:C.accent},
  {b:2,s:14.25,e:14.5,l:"换电",c:C.purple},
  {b:2,s:14.5,e:15.25,l:"运输→站",c:C.amber},
  {b:2,s:15.25,e:18.25,l:"充电",c:C.blue},
  {b:2,s:18.25,e:19,l:"运输→台",c:C.amber},
  {b:2,s:19,e:24,l:"平台待命",c:C.cyan},

  {b:3,s:0,e:3,l:"充电",c:C.blue},
  {b:3,s:3,e:3.75,l:"运输→台",c:C.amber},
  {b:3,s:3.75,e:24,l:"平台待命",c:C.cyan},
];

const LOGS = [
  {t:"00:00",m:"系统启动 · MILP优化引擎加载完毕，生成全天调度方案",k:"sys"},
  {t:"00:00",m:"α-01 正在供电 · SOC 95% · 预计可持续至 06:00",k:"info"},
  {t:"02:30",m:"调度指令 → β-02 从平台出发前往充电站（低谷电价即将开始）",k:"cmd"},
  {t:"03:00",m:"γ-03 充电完成 · SOC 100% · 装车运往平台待命",k:"info"},
  {t:"03:15",m:"β-02 抵达充电站 · 开始充电 · 低谷电价 ¥0.3904/度",k:"cmd"},
  {t:"03:45",m:"γ-03 抵达钻井平台 · 进入待命状态（应急备用）",k:"info"},
  {t:"05:45",m:"β-02 充电完成 · SOC 100% · 装车运往平台",k:"cmd"},
  {t:"05:50",m:"⚠ α-01 SOC 降至 22% · 触发换电预警",k:"warn"},
  {t:"06:00",m:"调度指令 → 启动换电流程 · α-01 → β-02 热切换",k:"cmd"},
  {t:"06:15",m:"✓ 换电完成 · β-02 接管供电 · α-01 装车返回充电站",k:"ok"},
  {t:"07:00",m:"α-01 抵达充电站 · 开始充电 · 平段电价 ¥0.6642/度",k:"info"},
  {t:"10:00",m:"α-01 充电完成 · SOC 100% · 装车运往平台待命",k:"info"},
  {t:"10:45",m:"α-01 抵达平台 · 进入待命状态",k:"info"},
  {t:"12:30",m:"平台负荷波动 · 当前功率 720kW · RL引擎评估：无需调整",k:"sys"},
  {t:"14:00",m:"⚠ β-02 SOC 降至 18% · 触发换电预警",k:"warn"},
  {t:"14:15",m:"调度指令 → 启动换电流程 · β-02 → α-01",k:"cmd"},
  {t:"14:30",m:"✓ 换电完成 · α-01 接管供电 · β-02 装车返回充电站",k:"ok"},
  {t:"15:15",m:"β-02 抵达充电站 · 开始充电 · 平段电价 ¥0.6642/度",k:"info"},
  {t:"18:15",m:"β-02 充电完成 · SOC 100%",k:"info"},
  {t:"19:00",m:"β-02 抵达平台 · 进入待命状态",k:"info"},
  {t:"20:00",m:"日间调度回顾 · 充电成本较无优化方案节省约 ¥1,582",k:"sys"},
  {t:"22:00",m:"α-01 SOC 35% · 预计可持续至次日 04:00+ · 无需干预",k:"info"},
];

function simBatteries(h) {
  h = h % 24;
  let bs = [
    {id:1,soc:95,st:"supplying",tp:0},
    {id:2,soc:80,st:"standby",tp:0},
    {id:3,soc:60,st:"charging",tp:0},
  ];
  // α-01
  if(h<6){bs[0].st="supplying";bs[0].soc=Math.max(8,95-h*14.5);}
  else if(h<6.25){bs[0].st="swapping";bs[0].soc=8;}
  else if(h<7){bs[0].st="to_station";bs[0].soc=7;bs[0].tp=(h-6.25)/0.75;}
  else if(h<10){bs[0].st="charging";bs[0].soc=7+((h-7)/3)*93;}
  else if(h<10.75){bs[0].st="to_platform";bs[0].soc=100;bs[0].tp=(h-10)/0.75;}
  else if(h<14.25){bs[0].st="standby";bs[0].soc=100;}
  else if(h<14.5){bs[0].st="swapping";bs[0].soc=100;}
  else{bs[0].st="supplying";bs[0].soc=Math.max(12,100-(h-14.5)*9.2);}
  // β-02
  if(h<2.5){bs[1].st="standby";bs[1].soc=80;}
  else if(h<3.25){bs[1].st="to_station";bs[1].soc=80;bs[1].tp=(h-2.5)/0.75;}
  else if(h<5.75){bs[1].st="charging";bs[1].soc=20+((h-3.25)/2.5)*80;}
  else if(h<6){bs[1].st="to_platform";bs[1].soc=100;bs[1].tp=(h-5.75)/0.25;}
  else if(h<6.25){bs[1].st="swapping";bs[1].soc=100;}
  else if(h<14.25){bs[1].st="supplying";bs[1].soc=Math.max(12,100-(h-6.25)*11);}
  else if(h<14.5){bs[1].st="swapping";bs[1].soc=14;}
  else if(h<15.25){bs[1].st="to_station";bs[1].soc=13;bs[1].tp=(h-14.5)/0.75;}
  else if(h<18.25){bs[1].st="charging";bs[1].soc=13+((h-15.25)/3)*87;}
  else if(h<19){bs[1].st="to_platform";bs[1].soc=100;bs[1].tp=(h-18.25)/0.75;}
  else{bs[1].st="standby";bs[1].soc=100;}
  // γ-03
  if(h<3){bs[2].st="charging";bs[2].soc=60+(h/3)*40;}
  else if(h<3.75){bs[2].st="to_platform";bs[2].soc=100;bs[2].tp=(h-3)/0.75;}
  else{bs[2].st="standby";bs[2].soc=100;}
  return bs;
}

/* ── Map SVG ── */
function MapSVG({batteries, simHour}){
  const PX=520,PY=100,SX=145,SY=315;
  const pos=b=>{
    if(b.st==="supplying"||b.st==="standby"||b.st==="swapping")
      return{x:PX-48+b.id*32,y:PY+78+b.id*10};
    if(b.st==="charging")return{x:SX-30+b.id*28,y:SY-58};
    if(b.st==="to_station"){const p=b.tp||.5;return{x:PX+(SX-PX)*p,y:PY+(SY-PY)*p-15};}
    if(b.st==="to_platform"){const p=b.tp||.5;return{x:SX+(PX-SX)*p,y:SY+(PY-SY)*p-15};}
    return{x:335,y:210};
  };

  return(
    <svg viewBox="0 0 680 430" style={{width:"100%",height:"100%",display:"block"}}>
      <defs>
        <linearGradient id="rG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={C.accent} stopOpacity="0.5"/>
          <stop offset="50%" stopColor={C.blue} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={C.accent} stopOpacity="0.5"/>
        </linearGradient>
        <filter id="gl"><feGaussianBlur stdDeviation="3" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="ds"><feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#000" floodOpacity="0.55"/></filter>
        <radialGradient id="pglow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.accent} stopOpacity="0.12"/><stop offset="100%" stopColor={C.accent} stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="sglow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.blue} stopOpacity="0.12"/><stop offset="100%" stopColor={C.blue} stopOpacity="0"/>
        </radialGradient>
      </defs>

      {/* Subtle grid */}
      {Array.from({length:18},(_,i)=><line key={`v${i}`} x1={i*40} y1={0} x2={i*40} y2={430} stroke={C.border} strokeWidth={0.3} opacity={0.4}/>)}
      {Array.from({length:11},(_,i)=><line key={`h${i}`} x1={0} y1={i*40} x2={680} y2={i*40} stroke={C.border} strokeWidth={0.3} opacity={0.4}/>)}

      {/* Region text */}
      <text x={658} y={22} fill={C.textMut} fontSize="9" fontFamily="sans-serif" textAnchor="end" opacity="0.5">河北省 · 沧州 / 保定交界</text>

      {/* Route path */}
      <path d={`M${PX},${PY+42} Q${PX-80},${(PY+SY)/2} ${SX},${SY-42}`}
        stroke="url(#rG)" strokeWidth="2" fill="none" strokeDasharray="5,7" opacity="0.6">
        <animate attributeName="stroke-dashoffset" values="0;-24" dur="3s" repeatCount="indefinite"/>
      </path>

      {/* Distance badge */}
      <g transform={`translate(${(PX+SX)/2+35},${(PY+SY)/2-30})`}>
        <rect x="-44" y="-12" width="88" height="24" rx="12" fill={C.bgCard} stroke={C.border} strokeWidth="0.8" opacity="0.9"/>
        <text x="0" y="4" textAnchor="middle" fill={C.textMut} fontSize="10" fontFamily="sans-serif">≈ 30–60 km</text>
      </g>

      {/* Platform glow */}
      <circle cx={PX} cy={PY} r={90} fill="url(#pglow)"/>
      <circle cx={PX} cy={PY} r={58} fill="none" stroke={C.accent} strokeWidth="0.5" opacity="0.15" strokeDasharray="3,5">
        <animateTransform attributeName="transform" type="rotate" from={`0 ${PX} ${PY}`} to={`360 ${PX} ${PY}`} dur="30s" repeatCount="indefinite"/>
      </circle>

      {/* Platform box */}
      <rect x={PX-58} y={PY-30} width={116} height={60} rx={14} fill={C.bgCard} stroke={C.accent}
        strokeWidth="1" filter="url(#ds)" opacity="0.95"/>
      <rect x={PX-58} y={PY-30} width={116} height={2} rx={1} fill={C.accent} opacity="0.4"/>
      <circle cx={PX-38} cy={PY-10} r={3.5} fill={C.accent}>
        <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite"/>
      </circle>
      <text x={PX-28} y={PY-6} fill={C.accent} fontSize="14" fontWeight="700" fontFamily="sans-serif">钻井平台</text>
      <text x={PX} y={PY+10} textAnchor="middle" fill={C.textSec} fontSize="10" fontFamily="sans-serif">任丘市北部</text>
      <text x={PX} y={PY+22} textAnchor="middle" fill={C.textMut} fontSize="9" fontFamily="'Courier New',monospace">
        {Math.round(471+Math.sin(simHour*1.3)*150)} kW 负荷
      </text>

      {/* Station glow */}
      <circle cx={SX} cy={SY} r={80} fill="url(#sglow)"/>
      <circle cx={SX} cy={SY} r={52} fill="none" stroke={C.blue} strokeWidth="0.5" opacity="0.15" strokeDasharray="3,5">
        <animateTransform attributeName="transform" type="rotate" from={`0 ${SX} ${SY}`} to={`-360 ${SX} ${SY}`} dur="25s" repeatCount="indefinite"/>
      </circle>

      {/* Station box */}
      <rect x={SX-52} y={SY-28} width={104} height={56} rx={14} fill={C.bgCard} stroke={C.blue}
        strokeWidth="1" filter="url(#ds)" opacity="0.95"/>
      <rect x={SX-52} y={SY-28} width={104} height={2} rx={1} fill={C.blue} opacity="0.4"/>
      <circle cx={SX-32} cy={SY-8} r={3.5} fill={C.blue}>
        <animate attributeName="opacity" values="1;0.3;1" dur="2.5s" repeatCount="indefinite"/>
      </circle>
      <text x={SX-20} y={SY-4} fill={C.blue} fontSize="14" fontWeight="700" fontFamily="sans-serif">充电站</text>
      <text x={SX} y={SY+12} textAnchor="middle" fill={C.textSec} fontSize="10" fontFamily="sans-serif">河间市</text>
      <text x={SX} y={SY+24} textAnchor="middle" fill={C.textMut} fontSize="9" fontFamily="sans-serif">10kV · 1,725kW</text>

      {/* Batteries */}
      {batteries.map(b=>{
        const p=pos(b); const sc=SC[b.st]; const socC=b.soc>55?C.accent:b.soc>20?C.amber:C.red;
        const moving=b.st==="to_station"||b.st==="to_platform";
        return(
          <g key={b.id}>
            {/* movement ring */}
            {moving && <circle cx={p.x} cy={p.y+2} r={24} fill="none" stroke={C.amber} strokeWidth="0.8" opacity="0.3" strokeDasharray="3,4">
              <animateTransform attributeName="transform" type="rotate" from={`0 ${p.x} ${p.y+2}`} to={`360 ${p.x} ${p.y+2}`} dur="3s" repeatCount="indefinite"/>
            </circle>}
            {/* battery body */}
            <rect x={p.x-24} y={p.y-14} width={48} height={28} rx={8}
              fill={C.bg} stroke={sc} strokeWidth="1.4" filter="url(#gl)"/>
            {/* SOC fill */}
            <rect x={p.x-20} y={p.y-1} width={Math.max(1,40*b.soc/100)} height={5} rx={2.5}
              fill={socC} opacity="0.75">
              {b.st==="charging"&&<animate attributeName="opacity" values="0.75;0.4;0.75" dur="1.5s" repeatCount="indefinite"/>}
            </rect>
            {/* terminal */}
            <rect x={p.x+24} y={p.y-4} width={4} height={8} rx={2} fill={sc} opacity="0.4"/>
            {/* SOC text */}
            <text x={p.x} y={p.y-5} textAnchor="middle" fill="#fff" fontSize="8.5"
              fontWeight="800" fontFamily="'Courier New',monospace">{Math.round(b.soc)}%</text>
            {/* label */}
            <text x={p.x} y={p.y+25} textAnchor="middle" fill={sc} fontSize="10.5"
              fontWeight="800" fontFamily="'Courier New',monospace" letterSpacing="1">{BNAME[b.id-1]}</text>
            <text x={p.x} y={p.y+37} textAnchor="middle" fill={C.textMut} fontSize="8.5" fontFamily="sans-serif">
              {SL[b.st]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Price Bar ── */
function PriceBar({simHour}){
  const hours=Array.from({length:24},(_,i)=>i);
  return(
    <div>
      <div style={{display:"flex",height:56,alignItems:"flex-end",gap:1.5,marginBottom:6}}>
        {hours.map(h=>{
          const t=tier(h),info=TIERS[t],cur=Math.floor(simHour)===h;
          const ht=(info.p/1.12)*100;
          return(
            <div key={h} style={{flex:1,position:"relative"}}>
              <div style={{
                height:`${ht}%`,
                background:cur?`linear-gradient(180deg,${info.c},${info.c}60)`:`${info.c}28`,
                borderRadius:"4px 4px 0 0",transition:"all .4s",
                boxShadow:cur?`0 -4px 16px ${info.c}30, inset 0 1px 0 ${info.c}80`:"none",
                border:cur?`1px solid ${info.c}60`:`1px solid transparent`,borderBottom:"none",
              }}/>
              {cur&&<div style={{
                position:"absolute",top:-22,left:"50%",transform:"translateX(-50%)",
                background:info.c,color:"#000",fontSize:9,fontWeight:800,padding:"2px 6px",
                borderRadius:5,whiteSpace:"nowrap",fontFamily:"'Courier New',monospace",
                boxShadow:`0 2px 8px ${info.c}40`,
              }}>¥{info.p.toFixed(2)}</div>}
            </div>
          );
        })}
      </div>
      <div style={{display:"flex",gap:1.5}}>
        {hours.map(h=>(
          <div key={h} style={{flex:1,textAlign:"center",fontSize:8,
            color:Math.floor(simHour)===h?C.text:C.textMut,
            fontFamily:"'Courier New',monospace",fontWeight:Math.floor(simHour)===h?700:400,
          }}>{h%2===0?h:""}</div>
        ))}
      </div>
      <div style={{display:"flex",gap:14,marginTop:14,flexWrap:"wrap",justifyContent:"center"}}>
        {Object.entries(TIERS).map(([k,v])=>(
          <div key={k} style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:10,height:10,borderRadius:2,background:v.c,opacity:0.75}}/>
            <span style={{fontSize:10,color:C.textSec}}>{k}</span>
            <span style={{fontSize:9,color:C.textMut,fontFamily:"'Courier New',monospace"}}>¥{v.p.toFixed(4)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Gantt ── */
function Gantt({batteries,simHour}){
  const pct=h=>(h/24)*100;
  return(
    <div>
      <div style={{position:"relative",height:18,marginBottom:4,marginLeft:54}}>
        {Array.from({length:13},(_,i)=>i*2).map(h=>(
          <div key={h} style={{position:"absolute",left:`${pct(h)}%`,transform:"translateX(-50%)",
            fontSize:9,color:C.textMut,fontFamily:"'Courier New',monospace"}}>{fmt(h)}</div>
        ))}
      </div>
      {batteries.map(b=>{
        const evts=EVENTS.filter(e=>e.b===b.id);
        return(
          <div key={b.id} style={{display:"flex",alignItems:"center",marginBottom:8}}>
            <div style={{width:50,fontSize:11,color:C.textSec,fontWeight:700,flexShrink:0,
              fontFamily:"'Courier New',monospace",textAlign:"right",paddingRight:8}}>{BNAME[b.id-1]}</div>
            <div style={{flex:1,height:26,background:`${C.border}50`,borderRadius:6,position:"relative",overflow:"hidden"}}>
              {Array.from({length:23},(_,i)=>i+1).map(h=>(
                <div key={h} style={{position:"absolute",left:`${pct(h)}%`,top:0,bottom:0,width:1,background:C.border,opacity:.3}}/>
              ))}
              {evts.map((ev,i)=>{
                const w=pct(ev.e)-pct(ev.s);
                return(
                  <div key={i} style={{
                    position:"absolute",left:`${pct(ev.s)}%`,width:`${w}%`,height:"100%",
                    background:`linear-gradient(135deg, ${ev.c}45, ${ev.c}20)`,
                    borderLeft:`2.5px solid ${ev.c}`,borderRadius:3,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:9,color:"#fff",fontWeight:600,overflow:"hidden",whiteSpace:"nowrap",
                  }}>{w>5.5?ev.l:""}</div>
                );
              })}
              <div style={{position:"absolute",left:`${pct(simHour)}%`,top:-2,bottom:-2,width:2,
                background:C.text,borderRadius:1,boxShadow:`0 0 8px ${C.text}60`,zIndex:2}}/>
            </div>
          </div>
        );
      })}
      <div style={{display:"flex",gap:14,marginTop:12,justifyContent:"center",flexWrap:"wrap"}}>
        {[{l:"供电",c:C.accent},{l:"充电",c:C.blue},{l:"运输",c:C.amber},{l:"平台待命",c:C.cyan},{l:"换电",c:C.purple}].map(x=>(
          <div key={x.l} style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:14,height:8,borderRadius:2,background:x.c,opacity:.65}}/>
            <span style={{fontSize:10,color:C.textSec}}>{x.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Battery Card ── */
function BatteryCard({b,power}){
  const sc=SC[b.st];
  const socC=b.soc>55?C.accent:b.soc>20?C.amber:C.red;
  const avail=Math.round(b.soc*47.5);
  const hrs=b.st==="supplying"?Math.max(1,Math.round(avail/power)):null;
  return(
    <div style={{
      background:C.bgCard,border:`1px solid ${sc}22`,borderRadius:14,padding:"14px 18px",
      position:"relative",overflow:"hidden",transition:"border-color .4s",
    }}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,
        background:`linear-gradient(90deg, transparent 0%, ${sc} 50%, transparent 100%)`,opacity:.45}}/>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
        <div>
          <div style={{fontSize:16,fontWeight:800,color:C.text,fontFamily:"'Courier New',monospace",letterSpacing:2}}>
            {BNAME[b.id-1]}
          </div>
          <div style={{
            display:"inline-block",marginTop:5,fontSize:10,padding:"2px 10px",borderRadius:20,
            background:`${sc}15`,color:sc,fontWeight:600,border:`1px solid ${sc}25`,
          }}>{SL[b.st]}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:30,fontWeight:800,color:socC,fontFamily:"'Courier New',monospace",lineHeight:1}}>
            {Math.round(b.soc)}<span style={{fontSize:14,opacity:.7}}>%</span>
          </div>
        </div>
      </div>

      <div style={{height:7,background:`${C.border}80`,borderRadius:4,overflow:"hidden",marginBottom:10}}>
        <div style={{
          width:`${b.soc}%`,height:"100%",borderRadius:4,
          background:`linear-gradient(90deg, ${socC}80, ${socC})`,
          transition:"width .8s ease",boxShadow:`0 0 10px ${socC}30`,
        }}/>
      </div>

      <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.textMut}}>
        <span>5,000 kWh</span>
        <span style={{color:C.textSec}}>可用 {avail.toLocaleString()} kWh</span>
        {hrs&&<span style={{color:C.accent,fontWeight:700}}>≈ {hrs}h</span>}
      </div>
    </div>
  );
}

/* ── Log ── */
function LogLine({item}){
  const colors={cmd:C.accent,warn:C.amber,ok:"#34d399",info:C.blue,sys:C.purple};
  const icons={cmd:"▸",warn:"△",ok:"✓",info:"·",sys:"◈"};
  const c=colors[item.k]||C.textMut;
  return(
    <div style={{display:"flex",gap:10,padding:"6px 0",borderBottom:`1px solid ${C.border}30`,fontSize:12,alignItems:"flex-start"}}>
      <span style={{color:`${c}cc`,fontFamily:"'Courier New',monospace",fontSize:11,flexShrink:0,minWidth:44,fontWeight:700}}>{item.t}</span>
      <span style={{color:c,fontSize:12,flexShrink:0,width:14,textAlign:"center",lineHeight:"18px"}}>{icons[item.k]}</span>
      <span style={{color:C.textSec,lineHeight:1.5}}>{item.m}</span>
    </div>
  );
}

/* ── Metric ── */
function Metric({label,value,unit,color,sub}){
  return(
    <div style={{
      background:C.bgCard,border:`1px solid ${color}18`,borderRadius:14,padding:"14px 18px",flex:1,minWidth:140,
      position:"relative",overflow:"hidden",
    }}>
      <div style={{position:"absolute",top:0,right:0,width:80,height:80,
        background:`radial-gradient(circle at 100% 0%, ${color}10, transparent 70%)`,pointerEvents:"none"}}/>
      <div style={{fontSize:11,color:C.textMut,marginBottom:6,fontWeight:500}}>{label}</div>
      <div style={{fontSize:26,fontWeight:800,color,fontFamily:"'Courier New',monospace",lineHeight:1}}>
        {value}<span style={{fontSize:12,fontWeight:500,marginLeft:3,opacity:.6}}>{unit}</span>
      </div>
      {sub&&<div style={{fontSize:10,color:C.textMut,marginTop:6}}>{sub}</div>}
    </div>
  );
}

/* ── MAIN ── */
export default function App(){
  const [simHour,setSimHour]=useState(0);
  const [running,setRunning]=useState(false);
  const [speed,setSpeed]=useState(2);
  const ref=useRef();
  const logRef=useRef();

  useEffect(()=>{
    if(running) ref.current=setInterval(()=>setSimHour(p=>(p+.05*speed)%24),100);
    return()=>clearInterval(ref.current);
  },[running,speed]);

  const batteries=useMemo(()=>simBatteries(simHour),[simHour]);
  const curTier=tier(Math.floor(simHour));
  const tInfo=TIERS[curTier];
  const power=Math.round(471+Math.sin(simHour*1.3)*150+Math.sin(simHour*3.7)*80);
  const energy=Math.round(simHour*471);
  const logs=LOGS.filter(l=>{const[hh,mm]=l.t.split(":").map(Number);return hh+mm/60<=simHour+.1;});
  const supBat=batteries.find(b=>b.st==="supplying");

  useEffect(()=>{if(logRef.current)logRef.current.scrollTop=0;},[logs.length]);

  return(
    <div style={{background:C.bg,color:C.text,minHeight:"100vh",
      fontFamily:"'PingFang SC','Microsoft YaHei','Segoe UI',sans-serif",padding:"20px 24px",boxSizing:"border-box"}}>

      {/* ── HEADER ── */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:42,height:42,borderRadius:12,
            background:`linear-gradient(135deg,${C.accent},${C.blue})`,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,color:"#000",fontWeight:900,
            boxShadow:`0 4px 16px ${C.accent}30`,
          }}>⚡</div>
          <div>
            <div style={{fontSize:20,fontWeight:800,letterSpacing:.5}}>电池智能调度系统</div>
            <div style={{fontSize:11,color:C.textMut,marginTop:2}}>
              移动储能钻井平台 · AI驱动运营管理
              <span style={{marginLeft:10,color:C.accent,fontWeight:600}}>● 运行中</span>
            </div>
          </div>
        </div>

        <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 16px",
            background:`${tInfo.c}0d`,border:`1px solid ${tInfo.c}25`,borderRadius:10}}>
            <div style={{width:8,height:8,borderRadius:4,background:tInfo.c,boxShadow:`0 0 8px ${tInfo.c}`}}/>
            <span style={{fontSize:12,color:tInfo.c,fontWeight:700}}>{curTier} · ¥{tInfo.p.toFixed(4)}/度</span>
          </div>

          <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 14px",
            background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:10}}>
            <div style={{fontSize:22,fontWeight:800,fontFamily:"'Courier New',monospace",color:C.text,minWidth:58,letterSpacing:2}}>
              {fmt(simHour,Math.floor((simHour%1)*60))}
            </div>
            <div style={{width:1,height:24,background:C.border}}/>
            <button onClick={()=>setRunning(!running)} style={{
              background:running?`${C.red}18`:`${C.accent}18`,border:`1px solid ${running?C.red:C.accent}35`,
              color:running?C.red:C.accent,padding:"5px 14px",borderRadius:8,
              cursor:"pointer",fontSize:12,fontWeight:700,
            }}>{running?"⏸ 暂停":"▶ 启动模拟"}</button>
            <select value={speed} onChange={e=>setSpeed(+e.target.value)} style={{
              background:C.bg,border:`1px solid ${C.border}`,color:C.textSec,
              padding:"5px 8px",borderRadius:6,fontSize:11,cursor:"pointer",
            }}>
              <option value={1}>1×</option><option value={2}>2×</option>
              <option value={4}>4×</option><option value={8}>8×</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── METRICS ── */}
      <div style={{display:"flex",gap:12,marginBottom:18,flexWrap:"wrap"}}>
        <Metric label="供电状态" value="正常" unit="" color={C.accent} sub={supBat?`${BNAME[supBat.id-1]} 供电中`:""} />
        <Metric label="实时功率" value={power} unit="kW" color={C.blue} sub="钻井平台负荷"/>
        <Metric label="累计用电" value={energy.toLocaleString()} unit="kWh" color={C.purple} sub="日均 11,302 kWh"/>
        <Metric label="预估日节省" value="1,582" unit="元" color={C.accent} sub="充电成本优化 ≈20%"/>
        <Metric label="年化节省" value="47.5" unit="万" color={C.cyan} sub="按300天运营计算"/>
      </div>

      {/* ── MAIN GRID ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:16}}>
        {/* Map */}
        <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 20px"}}>
          <div style={{fontSize:13,fontWeight:700,color:C.textSec,marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span>实时态势监控</span>
            <span style={{fontSize:10,color:C.textMut,fontWeight:400}}>GPS + 4G 实时追踪</span>
          </div>
          <MapSVG batteries={batteries} simHour={simHour}/>
        </div>

        {/* Battery Cards */}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{fontSize:13,fontWeight:700,color:C.textSec,padding:"0 4px"}}>电池状态</div>
          {batteries.map(b=><BatteryCard key={b.id} b={b} power={power}/>)}
        </div>

        {/* Price */}
        <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 20px"}}>
          <div style={{fontSize:13,fontWeight:700,color:C.textSec,marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span>分时电价 · 春季</span>
            <span style={{fontSize:10,color:C.textMut,fontWeight:400}}>河北电网 · 1-10kV</span>
          </div>
          <PriceBar simHour={simHour}/>
        </div>

        {/* Gantt */}
        <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 20px"}}>
          <div style={{fontSize:13,fontWeight:700,color:C.textSec,marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span>调度计划</span>
            <span style={{fontSize:10,color:C.accent,fontWeight:700,fontFamily:"'Courier New',monospace"}}>MILP 优化引擎</span>
          </div>
          <Gantt batteries={batteries} simHour={simHour}/>
        </div>

        {/* Log */}
        <div ref={logRef} style={{gridColumn:"1/-1",background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:14,
          padding:"16px 20px",maxHeight:280,overflowY:"auto"}}>
          <div style={{fontSize:13,fontWeight:700,color:C.textSec,marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center",
            position:"sticky",top:0,background:C.bgCard,paddingBottom:8,zIndex:1}}>
            <span>调度日志</span>
            <span style={{fontSize:10,color:C.textMut,fontWeight:400}}>{logs.length} 条</span>
          </div>
          {logs.length===0&&<div style={{color:C.textMut,fontSize:12,textAlign:"center",padding:30}}>点击「▶ 启动模拟」查看实时调度日志</div>}
          {[...logs].reverse().map((l,i)=><LogLine key={i} item={l}/>)}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{marginTop:20,paddingTop:14,borderTop:`1px solid ${C.border}`,
        display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
        <div style={{fontSize:11,color:C.textMut}}>上海神机智物人工智能科技有限公司</div>
        <div style={{display:"flex",gap:20,fontSize:10,color:C.textMut}}>
          {["MILP 全局优化","LSTM 负荷预测","RL 动态调度","多平台扩展就绪"].map(t=>(
            <span key={t}><span style={{color:C.accent,marginRight:4}}>✓</span>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
