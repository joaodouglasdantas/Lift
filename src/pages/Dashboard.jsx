import { useEffect, useState } from "react";
import { api } from "../api.js";
import { IconTarget, IconFlame, IconDumbbell } from "../components/Icons.jsx";

// Gráfico de linha simples em SVG (sem dependências externas)
function LineChart({ data, xKey, yKey, unit = "" }) {
  if (!data || data.length === 0) return <p className="muted">Sem dados ainda.</p>;
  const W = 320, H = 150, pad = 30;
  const ys = data.map((d) => d[yKey]);
  const min = Math.min(...ys), max = Math.max(...ys);
  const range = max - min || 1;
  const x = (i) => pad + (i * (W - pad * 2)) / Math.max(1, data.length - 1);
  const y = (v) => H - pad - ((v - min) / range) * (H - pad * 2);
  const points = data.map((d, i) => `${x(i)},${y(d[yKey])}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: "visible" }}>
      <polyline fill="none" stroke="#E10600" strokeWidth="2.5" points={points} />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d[yKey])} r="3.5" fill="#E10600" />
          <text x={x(i)} y={H - 8} fontSize="9" fill="#8a8a8a" textAnchor="middle">{d[xKey]}</text>
          <text x={x(i)} y={y(d[yKey]) - 8} fontSize="9" fill="#F5F5F5" textAnchor="middle">{d[yKey]}{unit}</text>
        </g>
      ))}
    </svg>
  );
}

export default function Dashboard() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api.dashboard().then(setD).catch((e) => setErr(e.message));
  }, []);

  if (err) return <p className="muted">Não consegui conectar à API. Ela está rodando em :3333? ({err})</p>;
  if (!d) return <p className="center muted">Carregando...</p>;

  return (
    <>
      <div className="stats">
        <div className="stat">
          <div className="stat-head"><IconTarget size={16} /></div>
          <div className="val red">{d.currentWeight ?? "—"}<small style={{ fontSize: 14 }}> kg</small></div>
          <div className="lbl">Peso atual · meta {d.goalWeightKg ?? "—"} kg</div>
        </div>
        <div className="stat">
          <div className="stat-head"><IconTarget size={16} /></div>
          <div className="val">{d.weightChange > 0 ? "+" : ""}{d.weightChange}<small style={{ fontSize: 14 }}> kg</small></div>
          <div className="lbl">Variação total</div>
        </div>
        <div className="stat">
          <div className="stat-head"><IconFlame size={16} /></div>
          <div className="val">{d.avgCalories}<small style={{ fontSize: 14 }}> kcal</small></div>
          <div className="lbl">Média diária</div>
        </div>
        <div className="stat">
          <div className="stat-head"><IconDumbbell size={16} /></div>
          <div className="val">{d.workoutsThisWeek ?? 0}</div>
          <div className="lbl">Treinos na semana · {d.workoutsTotal ?? 0} no total</div>
        </div>
      </div>

      <div className="content-grid">
        <div className="card">
          <h2>Evolução de peso</h2>
          <LineChart data={d.weightByMonth} xKey="label" yKey="weightKg" />
        </div>

        <div className="card">
          <h2>Calorias por dia</h2>
          <LineChart data={d.caloriesByDay.map((c) => ({ ...c, label: c.date.slice(5) }))} xKey="label" yKey="calories" />
        </div>
      </div>

      <div className="card">
        <h2>Perfil</h2>
        <p style={{ margin: "4px 0" }}>Altura: <strong>{d.user.heightCm ?? "—"} cm</strong></p>
        <p style={{ margin: "4px 0" }} className="muted">Meta de peso: {d.goalWeightKg ?? "—"} kg</p>
      </div>
    </>
  );
}
