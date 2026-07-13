import { useEffect, useState } from "react";
import { api } from "../api.js";
import { IconTrash, IconDumbbell } from "../components/Icons.jsx";

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function History() {
  const [sessions, setSessions] = useState(null);
  const [open, setOpen] = useState(null); // id da sessão aberta
  const [detail, setDetail] = useState(null);
  const [err, setErr] = useState(null);

  const load = () => api.sessions().then(setSessions).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);

  const toggle = async (id) => {
    if (open === id) { setOpen(null); return; }
    setOpen(id);
    setDetail(await api.session(id));
  };

  const remove = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Excluir este treino?")) return;
    await api.delSession(id);
    if (open === id) setOpen(null);
    load();
  };

  if (err) return <p className="muted">Erro ao carregar histórico: {err}</p>;
  if (!sessions) return <p className="center muted">Carregando...</p>;
  if (!sessions.length) return <p className="center muted">Nenhum treino registrado ainda. Conclua um treino na aba Treinos.</p>;

  // Agrupa séries por exercício no detalhe
  const grouped = (sets) => {
    const map = {};
    for (const s of sets) {
      (map[s.exercise.name] ??= []).push(s);
    }
    return Object.entries(map);
  };

  return (
    <>
      <h2 style={{ color: "var(--muted)", fontSize: 13, textTransform: "uppercase", letterSpacing: 1 }}>
        Histórico de treinos
      </h2>
      {sessions.map((s) => (
        <div className="session" key={s.id} onClick={() => toggle(s.id)} style={{ cursor: "pointer" }}>
          <div className="top">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <IconDumbbell size={18} />
              <div>
                <div style={{ fontWeight: 700 }}>{s.day ? s.day.focus : "Treino"}</div>
                <div className="date">{fmtDate(s.date)}{s.durationMin ? ` · ${s.durationMin} min` : ""}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="chip">{s._count.sets} séries</span>
              <button className="icon-btn" onClick={(e) => remove(s.id, e)} aria-label="Excluir"><IconTrash size={16} /></button>
            </div>
          </div>

          {open === s.id && detail && (
            <div style={{ marginTop: 12, borderTop: "1px solid #262626", paddingTop: 12 }} onClick={(e) => e.stopPropagation()}>
              {detail.notes && <p className="muted" style={{ marginTop: 0 }}>{detail.notes}</p>}
              {grouped(detail.sets).map(([name, list]) => (
                <div key={name} style={{ marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{name}</div>
                  <div className="meta" style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                    {list.map((set) => (
                      <span className="chip" key={set.id}>
                        {set.weightKg != null ? `${set.weightKg}kg` : "—"} × {set.reps != null ? set.reps : "—"}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </>
  );
}
