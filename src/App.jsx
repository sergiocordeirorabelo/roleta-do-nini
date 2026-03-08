import { useState, useRef, useEffect } from "react";

const PARTICIPANT_NAMES = ["Nilmar", "Gualter", "Tiago", "Celso", "Sérgio", "Daniel"];

const DEFAULT_WEIGHTS = {
  "Nilmar":  1,
  "Gualter": 1,
  "Tiago":   1,
  "Celso":   1,
  "Sérgio":  1,
  "Daniel":  1,
};

const COLORS = [
  "#1a8c1a", // ZERO — verde cassino
  "#FF6B6B", "#FF8E53", "#FFC300", "#2ECC71",
  "#1ABC9C", "#3498DB", "#9B59B6", "#E91E63",
  "#FF5722", "#00BCD4", "#8BC34A", "#FF9800",
];

function pickWeightedWinner(names, weights, guaranteed) {
  // names[0] é sempre ZERO — nunca sorteado
  const participants = names.slice(1);
  if (guaranteed) {
    const idx = names.indexOf(guaranteed);
    if (idx !== -1) return idx;
  }
  const totalWeight = participants.reduce((sum, n) => sum + (weights[n] ?? 1), 0);
  let rand = Math.random() * totalWeight;
  for (let i = 0; i < participants.length; i++) {
    rand -= weights[participants[i]] ?? 1;
    if (rand <= 0) return i + 1; // +1 pois index 0 é ZERO
  }
  return names.length - 1;
}

function CoffeeParticles() {
  const particles = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    left: 10 + (i * 7) % 80,
    delay: (i * 0.12),
    duration: 1.5 + (i % 4) * 0.3,
    size: 20 + (i % 3) * 10,
    sway: ((i % 5) - 2) * 20,
  }));

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, pointerEvents: "none", overflow: "hidden" }}>
      {particles.map((p) => (
        <div key={p.id} style={{
          position: "absolute",
          bottom: "-60px",
          left: `${p.left}%`,
          fontSize: `${p.size}px`,
          animation: `coffeeRise ${p.duration}s ease-out ${p.delay}s forwards`,
          "--sway": `${p.sway}px`,
        }}>☕</div>
      ))}
    </div>
  );
}

export default function RoletaDoNini() {
  // names[0] é sempre "ZERO" — fixo, nunca editável
  const [names, setNames] = useState(["ZERO", ...PARTICIPANT_NAMES]);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [guaranteed, setGuaranteed] = useState(null);
  const [newName, setNewName] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [showWinner, setShowWinner] = useState(false);
  const [showCoffee, setShowCoffee] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [secretMode, setSecretMode] = useState(false);
  const centerClickCount = useRef(0);
  const canvasRef = useRef(null);
  const spinRef = useRef(null);

  // Rotação inicial: ZERO (índice 0) centralizado no ponteiro do topo
  const getInitialRotation = (totalNames) => {
    const arc = (2 * Math.PI) / totalNames;
    // Centro do slice 0 deve ficar em -π/2 (topo)
    // centro = rot + 0*arc + arc/2 = -π/2  →  rot = -π/2 - arc/2
    return -Math.PI / 2 - arc / 2;
  };

  const currentRotation = useRef(getInitialRotation(names.length));

  const drawWheel = (rot) => {
    const canvas = canvasRef.current;
    if (!canvas || names.length === 0) return;
    const ctx = canvas.getContext("2d");
    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 8;
    const arc = (2 * Math.PI) / names.length;

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.fillStyle = "#1a1a2e";
    ctx.fill();
    ctx.restore();

    names.forEach((name, i) => {
      const startAngle = rot + i * arc;
      const endAngle = startAngle + arc;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = "#0d0d1a";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + arc / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fff";
      const fontSize = Math.max(11, Math.min(18, 200 / names.length));
      ctx.font = i === 0
        ? `900 ${fontSize + 2}px 'Orbitron', sans-serif`
        : `bold ${fontSize}px 'Rajdhani', sans-serif`;
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 4;
      const maxLen = 12;
      const label = name.length > maxLen ? name.slice(0, maxLen) + "…" : name;
      ctx.fillText(label, radius - 14, fontSize / 3);
      ctx.restore();
    });

    // Centro
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, 2 * Math.PI);
    const grad = ctx.createRadialGradient(cx - 6, cy - 6, 2, cx, cy, 28);
    grad.addColorStop(0, "#1e3a5f");
    grad.addColorStop(1, "#0d1b2a");
    ctx.fillStyle = grad;
    ctx.shadowColor = "rgba(0,200,255,0.4)";
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.strokeStyle = "#00c8ff";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.font = "bold 14px sans-serif";
    ctx.fillStyle = "#00c8ff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowBlur = 0;
    ctx.fillText("⚡", cx, cy);
  };

  useEffect(() => {
    currentRotation.current = getInitialRotation(names.length);
    drawWheel(currentRotation.current);
  }, [names]);

  const handleCenterClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - canvas.width / 2;
    const y = e.clientY - rect.top - canvas.height / 2;
    if (Math.sqrt(x * x + y * y) < 28) {
      centerClickCount.current += 1;
      if (centerClickCount.current >= 5) {
        centerClickCount.current = 0;
        setSecretMode((v) => !v);
      }
    }
  };

  const spin = () => {
    if (spinning || names.length < 3) return; // mínimo: ZERO + 2 participantes
    setShowWinner(false);
    setShowCoffee(false);
    setWinner(null);
    setSpinning(true);

    const winnerIndex = pickWeightedWinner(names, weights, guaranteed);
    const arc = (2 * Math.PI) / names.length;
    const sliceCenter = winnerIndex * arc + arc / 2;
    const targetAngle = -sliceCenter - Math.PI / 2;
    const extraSpins = (6 + Math.floor(Math.random() * 4)) * 2 * Math.PI;
    const normalizedCurrent = currentRotation.current % (2 * Math.PI);
    const diff = ((targetAngle - normalizedCurrent) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    const totalRotation = extraSpins + diff;

    const duration = 4000 + Math.random() * 1000;
    const start = performance.now();
    const startRot = currentRotation.current;
    const easeOut = (t) => 1 - Math.pow(1 - t, 4);

    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOut(progress);
      const current = startRot + totalRotation * eased;
      currentRotation.current = current;
      drawWheel(current);
      if (progress < 1) {
        spinRef.current = requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        setWinner(names[winnerIndex]);
        setTimeout(() => {
          setShowWinner(true);
          setShowCoffee(true);
          setTimeout(() => setShowCoffee(false), 3500);
        }, 200);
      }
    };

    spinRef.current = requestAnimationFrame(animate);
  };

  const addName = () => {
    const trimmed = newName.trim();
    if (trimmed && !names.includes(trimmed) && names.length < 21) {
      setNames([...names, trimmed]);
      setWeights((w) => ({ ...w, [trimmed]: 1 }));
      setNewName("");
    }
  };

  const removeName = (i) => {
    if (i === 0) return; // protege o ZERO
    const removed = names[i];
    setNames(names.filter((_, idx) => idx !== i));
    setWeights((w) => { const nw = { ...w }; delete nw[removed]; return nw; });
    if (guaranteed === removed) setGuaranteed(null);
    setShowWinner(false);
    setWinner(null);
  };

  const participants = names.slice(1); // sem o ZERO

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0d0d1a 0%, #0f1e35 50%, #0d1a0d 100%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "24px 16px", fontFamily: "'Rajdhani', sans-serif",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        backgroundImage: "linear-gradient(rgba(0,200,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,255,0.04) 1px, transparent 1px)",
        backgroundSize: "40px 40px", pointerEvents: "none",
      }} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Orbitron:wght@700;900&display=swap');
        @keyframes popIn { 0%{transform:scale(0) rotate(-10deg);opacity:0} 70%{transform:scale(1.1) rotate(2deg)} 100%{transform:scale(1) rotate(0deg);opacity:1} }
        @keyframes floatUp { 0%{transform:translateY(0)} 50%{transform:translateY(-6px)} 100%{transform:translateY(0)} }
        @keyframes glowPulse { 0%,100%{box-shadow:0 0 20px #00c8ff44} 50%{box-shadow:0 0 50px #00c8ffaa, 0 0 100px #ff6a0022} }
        @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
        @keyframes coffeeRise { 0%{transform:translateY(0) translateX(0) scale(0.5);opacity:1} 60%{opacity:1} 100%{transform:translateY(-110vh) translateX(var(--sway)) scale(1.2);opacity:0} }
        @keyframes pagueSlam { 0%{transform:scale(0) rotate(-8deg);opacity:0} 50%{transform:scale(1.15) rotate(3deg);opacity:1} 70%{transform:scale(0.95) rotate(-1deg)} 100%{transform:scale(1) rotate(0deg);opacity:1} }
        .spin-btn:hover:not(:disabled){transform:scale(1.06) translateY(-2px)!important;filter:brightness(1.15)!important}
        .spin-btn:active:not(:disabled){transform:scale(0.97)!important}
        .name-tag:hover .remove-btn{opacity:1!important}
        input[type=range]{accent-color:#ff6a00;width:100%}
        .lock-btn:hover{opacity:1!important}
      `}</style>

      <div style={{ position:"fixed",left:0,right:0,height:"2px",background:"linear-gradient(90deg,transparent,#00c8ff22,transparent)",animation:"scanline 6s linear infinite",zIndex:1,pointerEvents:"none" }} />

      {showCoffee && <CoffeeParticles />}

      {showWinner && winner && (
        <div style={{ position:"fixed",top:0,left:0,right:0,zIndex:998,display:"flex",justifyContent:"center",paddingTop:"16px",pointerEvents:"none" }}>
          <div style={{ animation:"pagueSlam 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards",background:"linear-gradient(90deg,#7b3800,#ff6a00,#ffb347,#ff6a00,#7b3800)",padding:"10px 32px",borderRadius:"50px",boxShadow:"0 6px 32px rgba(255,106,0,0.6)",border:"2px solid #ffb34788" }}>
            <span style={{ fontFamily:"Orbitron,sans-serif",fontWeight:900,fontSize:"clamp(1rem,4vw,1.5rem)",color:"#fff",letterSpacing:"4px",textShadow:"0 2px 12px rgba(0,0,0,0.5)",textTransform:"uppercase" }}>
              ☕ Pague o Café! ☕
            </span>
          </div>
        </div>
      )}

      {/* Title */}
      <div style={{ textAlign:"center",marginBottom:"24px",animation:"floatUp 3s ease-in-out infinite",zIndex:2 }}>
        <div style={{ fontSize:"11px",letterSpacing:"6px",color:"#00c8ff",textTransform:"uppercase",marginBottom:"6px",fontFamily:"Orbitron,sans-serif" }}>⚡ bem-vindo à ⚡</div>
        <h1 style={{ fontSize:"clamp(2rem,6vw,3.2rem)",margin:0,fontFamily:"Orbitron,sans-serif",fontWeight:900,background:"linear-gradient(90deg,#00c8ff,#ff6a00,#00c8ff)",backgroundSize:"200%",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",filter:"drop-shadow(0 2px 12px #00c8ff66)",lineHeight:1.1,letterSpacing:"2px" }}>
          Roleta do Nini
        </h1>
        <div style={{ color:"#4a7a8a",fontSize:"13px",marginTop:"6px",fontFamily:"Rajdhani,sans-serif",letterSpacing:"2px" }}>
          {participants.length} PARTICIPANTE{participants.length !== 1 ? "S" : ""}
        </div>
      </div>

      {/* Wheel */}
      <div style={{ position:"relative",display:"flex",justifyContent:"center",marginBottom:"24px",zIndex:2 }}>
        <div style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"320px",height:"320px",borderRadius:"50%",animation:"glowPulse 2s ease-in-out infinite",zIndex:0 }} />
        <div style={{ position:"absolute",top:"-6px",left:"50%",transform:"translateX(-50%)",zIndex:10,filter:"drop-shadow(0 4px 8px #00c8ff)" }}>
          <div style={{ width:0,height:0,borderLeft:"14px solid transparent",borderRight:"14px solid transparent",borderTop:"32px solid #00c8ff" }} />
        </div>
        <canvas ref={canvasRef} width={300} height={300} onClick={handleCenterClick}
          style={{ borderRadius:"50%",display:"block",zIndex:1,position:"relative",border:"2px solid #00c8ff33",cursor:"pointer" }} />
      </div>

      {/* Spin */}
      <button className="spin-btn" onClick={spin} disabled={spinning || participants.length < 2} style={{
        background: spinning ? "#0f2233" : "linear-gradient(135deg,#ff6a00,#ee0979)",
        color:"#fff",border:"none",borderRadius:"8px",padding:"14px 52px",fontSize:"18px",
        fontFamily:"Orbitron,sans-serif",fontWeight:700,
        cursor: spinning || participants.length < 2 ? "not-allowed" : "pointer",
        transition:"all 0.2s ease",boxShadow:"0 8px 24px rgba(255,106,0,0.4)",
        marginBottom:"20px",opacity: participants.length < 2 ? 0.4 : 1,
        letterSpacing:"3px",textTransform:"uppercase",
      }}>
        {spinning ? "⚡ GIRANDO..." : "🎯 GIRAR"}
      </button>

      {/* Winner card */}
      {showWinner && winner && (
        <div style={{ animation:"popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards",background:"linear-gradient(135deg,#0f2233,#1a1a2e)",border:"2px solid #00c8ff",borderRadius:"12px",padding:"18px 36px",marginBottom:"20px",textAlign:"center",boxShadow:"0 8px 40px rgba(0,200,255,0.3)",zIndex:2,marginTop:"12px" }}>
          <div style={{ color:"#00c8ff",fontSize:"11px",letterSpacing:"4px",textTransform:"uppercase",fontFamily:"Orbitron,sans-serif" }}>⚡ SORTEADO</div>
          <div style={{ fontSize:"clamp(1.8rem,5vw,2.6rem)",color:"#fff",fontFamily:"Orbitron,sans-serif",fontWeight:900,textShadow:"0 0 20px #00c8ff",marginTop:"6px",letterSpacing:"2px" }}>{winner}</div>
          <div style={{ marginTop:"8px",fontSize:"13px",letterSpacing:"2px",color:"#ff6a00",fontFamily:"Rajdhani,sans-serif",fontWeight:700 }}>☕ hora de pagar o café!</div>
        </div>
      )}

      {/* Edit */}
      <button onClick={() => setEditMode(!editMode)} style={{ background:"transparent",color:"#00c8ff",border:"1px solid #00c8ff44",borderRadius:"8px",padding:"8px 20px",fontSize:"13px",fontFamily:"Rajdhani,sans-serif",fontWeight:700,cursor:"pointer",marginBottom:"12px",letterSpacing:"2px",textTransform:"uppercase",zIndex:2 }}>
        {editMode ? "✅ FECHAR" : "✏️ EDITAR PARTICIPANTES"}
      </button>

      {editMode && (
        <div style={{ width:"100%",maxWidth:"380px",background:"rgba(0,0,0,0.4)",borderRadius:"12px",border:"1px solid #00c8ff22",padding:"16px",zIndex:2,marginBottom:"12px" }}>
          <div style={{ display:"flex",gap:"8px",marginBottom:"14px" }}>
            <input value={newName} onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addName()}
              placeholder="Adicionar nome..." maxLength={20}
              style={{ flex:1,background:"rgba(0,200,255,0.05)",border:"1px solid #00c8ff33",borderRadius:"8px",padding:"10px 14px",color:"#fff",fontFamily:"Rajdhani,sans-serif",fontSize:"15px",outline:"none" }} />
            <button onClick={addName} style={{ background:"linear-gradient(135deg,#ff6a00,#ee0979)",border:"none",borderRadius:"8px",padding:"10px 16px",color:"#fff",fontSize:"20px",cursor:"pointer" }}>+</button>
          </div>
          <div style={{ display:"flex",flexWrap:"wrap",gap:"8px" }}>
            {names.map((name, i) => (
              <div key={i} className="name-tag" style={{ display:"flex",alignItems:"center",gap:"6px",background: i === 0 ? "#1a8c1a33" : COLORS[i % COLORS.length]+"22",border:`1px solid ${i === 0 ? "#1a8c1a" : COLORS[i % COLORS.length]}55`,borderRadius:"6px",padding:"6px 10px 6px 12px" }}>
                <div style={{ width:"8px",height:"8px",borderRadius:"2px",background: i === 0 ? "#1a8c1a" : COLORS[i % COLORS.length],flexShrink:0 }} />
                <span style={{ color: i === 0 ? "#4ade80" : "#eee",fontFamily:"Rajdhani,sans-serif",fontSize:"14px",fontWeight:600,letterSpacing:"1px" }}>{name}</span>
                {i !== 0 && (
                  <button className="remove-btn" onClick={() => removeName(i)} style={{ background:"rgba(255,255,255,0.1)",border:"none",borderRadius:"4px",width:"20px",height:"20px",color:"#fff",cursor:"pointer",fontSize:"12px",display:"flex",alignItems:"center",justifyContent:"center",opacity:0.5,transition:"opacity 0.2s",padding:0 }}>×</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Painel secreto */}
      {secretMode && (
        <div style={{ width:"100%",maxWidth:"380px",background:"rgba(20,0,0,0.85)",borderRadius:"12px",border:"1px solid #ff6a0066",padding:"16px",zIndex:2,animation:"popIn 0.3s ease forwards" }}>
          <div style={{ color:"#ff6a00",fontFamily:"Orbitron,sans-serif",fontSize:"12px",letterSpacing:"3px",marginBottom:"16px",textAlign:"center" }}>🔒 PAINEL SECRETO</div>
          {guaranteed && (
            <button onClick={() => setGuaranteed(null)} style={{ width:"100%",background:"rgba(255,106,0,0.1)",border:"1px solid #ff6a0044",borderRadius:"8px",color:"#ff6a00",fontFamily:"Rajdhani,sans-serif",fontSize:"13px",fontWeight:700,letterSpacing:"2px",padding:"8px",cursor:"pointer",marginBottom:"14px",textTransform:"uppercase" }}>
              🎲 Voltar ao aleatório
            </button>
          )}
          {participants.map((name) => {
            const isLocked = guaranteed === name;
            return (
              <div key={name} style={{ marginBottom:"14px",background: isLocked ? "rgba(255,106,0,0.08)" : "transparent",borderRadius:"8px",padding: isLocked ? "10px" : "0",border: isLocked ? "1px solid #ff6a0044" : "1px solid transparent",transition:"all 0.2s" }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px" }}>
                  <span style={{ color: isLocked ? "#ff6a00" : "#eee",fontFamily:"Rajdhani,sans-serif",fontWeight:700,letterSpacing:"1px",fontSize:"15px" }}>{isLocked ? "🎯 " : ""}{name}</span>
                  <div style={{ display:"flex",alignItems:"center",gap:"8px" }}>
                    {!isLocked && <span style={{ color:"#ff6a00",fontFamily:"Orbitron,sans-serif",fontSize:"12px" }}>{weights[name] ?? 1}x</span>}
                    <button className="lock-btn" onClick={() => setGuaranteed(isLocked ? null : name)} style={{ background: isLocked ? "#ff6a00" : "rgba(255,106,0,0.15)",border:"1px solid #ff6a0066",borderRadius:"6px",padding:"3px 8px",color:"#fff",cursor:"pointer",fontSize:"13px",fontFamily:"Rajdhani,sans-serif",fontWeight:700,opacity: isLocked ? 1 : 0.6,transition:"all 0.2s",letterSpacing:"1px" }}>
                      {isLocked ? "🔒 ATIVO" : "🔓 fixar"}
                    </button>
                  </div>
                </div>
                {!isLocked && <input type="range" min={1} max={10} value={weights[name] ?? 1} onChange={(e) => setWeights((w) => ({ ...w, [name]: Number(e.target.value) }))} />}
                {isLocked && <div style={{ color:"#ff6a0099",fontSize:"11px",fontFamily:"Rajdhani,sans-serif",letterSpacing:"1px" }}>GARANTIDO — vai cair sempre neste 😈</div>}
              </div>
            );
          })}
          <div style={{ color:"#ff6a0044",fontSize:"11px",textAlign:"center",fontFamily:"Rajdhani,sans-serif",marginTop:"8px",letterSpacing:"1px" }}>Ninguém precisa saber 😈</div>
        </div>
      )}
    </div>
  );
}
