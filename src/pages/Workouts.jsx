import { useEffect, useState } from "react";
import { api } from "../api.js";
import { IconCheck, IconPlay, IconDumbbell } from "../components/Icons.jsx";

const dayName = (d) => d.label || d.focus || "Treino";

export default function Workouts() {
  const [plan, setPlan] = useState(null);
  const [activeDay, setActiveDay] = useState(0);
  const [err, setErr] = useState(null);

  const [logging, setLogging] = useState(false);
  const [sets, setSets] = useState({});
  const [done, setDone] = useState({}); // { [exId]: true }
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.plans()
      .then((plans) => {
        if (!plans.length) return setPlan(false);
        return api.plan(plans[0].id).then(setPlan);
      })
      .catch((e) => setErr(e.message));
  }, []);

  if (err) return <p className="muted">Erro ao carregar treinos: {err}</p>;
  if (plan === null) return <p className="center muted">Carregando...</p>;
  if (plan === false) return <p className="center muted">Nenhum plano cadastrado ainda. Crie na aba Cadastro.</p>;

  const day = plan.days[activeDay];

  const setKey = (exId, n) => `${exId}-${n}`;
  const updateSet = (exId, n, field, value) =>
    setSets((s) => ({ ...s, [setKey(exId, n)]: { ...s[setKey(exId, n)], [field]: value } }));

  const startLog = () => { setLogging(true); setSets({}); setDone({}); setNotes(""); };
  const cancelLog = () => { setLogging(false); setSets({}); setDone({}); setNotes(""); };

  const doneCount = day ? day.exercises.filter((ex) => done[ex.id]).length : 0;

  const finish = async () => {
    const completed = day.exercises.filter((ex) => done[ex.id]);
    if (!completed.length) return alert("Marque pelo menos um exercício como concluído.");
    const payload = [];
    for (const ex of completed) {
      for (let n = 1; n <= ex.sets; n++) {
        const v = sets[setKey(ex.id, n)] || {};
        payload.push({ exerciseId: ex.id, exerciseName: ex.name, setNumber: n, weightKg: v.weightKg, reps: v.reps });
      }
    }
    await api.addSession({ dayId: day.id, dayFocus: dayName(day), notes, sets: payload });
    setSaved(true);
    cancelLog();
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <>
      <div className="card" style={{ marginBottom: 12 }}>
        <h2>{plan.name}</h2>
        <p className="muted" style={{ margin: 0 }}>{plan.description}</p>
      </div>

      <div className="day-tab">
        {plan.days.map((dd, i) => (
          <button key={dd.id} className={i === activeDay ? "active" : ""} onClick={() => { setActiveDay(i); cancelLog(); }}>
            {dayName(dd)}
          </button>
        ))}
      </div>

      {day && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>{dayName(day)}</h3>
            {!logging && day.exercises.length > 0 && (
              <button className="ghost" onClick={startLog}><IconDumbbell size={16} /> Iniciar treino</button>
            )}
          </div>

          {saved && <div className="card" style={{ borderColor: "#2e7d32", color: "#7CFC9E" }}>Treino registrado!</div>}

          {logging && (
            <p className="muted" style={{ marginTop: 0 }}>
              Marque cada exercício conforme for concluindo. {doneCount}/{day.exercises.length} feitos.
            </p>
          )}

          {day.exercises.length === 0 && <p className="muted">Sem exercícios neste dia.</p>}

          {day.exercises.map((ex) => {
            const isDone = !!done[ex.id];
            return (
              <div className="exercise" key={ex.id} style={isDone ? { borderColor: "#2e7d32" } : undefined}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div className="name">{ex.name}</div>
                  {logging && (
                    <button
                      onClick={() => setDone((d) => ({ ...d, [ex.id]: !d[ex.id] }))}
                      className={isDone ? "primary" : "ghost"}
                      style={{ width: "auto", padding: "6px 12px", flex: "0 0 auto" }}>
                      <IconCheck size={16} /> {isDone ? "Feito" : "Concluir"}
                    </button>
                  )}
                </div>
                <div className="meta">
                  <span className="chip"><strong>{ex.sets}</strong> séries</span>
                  <span className="chip"><strong>{ex.reps}</strong> reps</span>
                  <span className="chip">descanso <strong>{ex.restSeconds}s</strong></span>
                </div>
                {ex.description && <div className="desc">{ex.description}</div>}

                {ex.imageUrl && (
                  <div className="media"><img src={ex.imageUrl} alt={ex.name} /></div>
                )}
                {ex.videoUrl && (
                  /\.(mp4|webm|ogg)$/i.test(ex.videoUrl)
                    ? <div className="media"><video src={ex.videoUrl} controls /></div>
                    : <a className="link-video" href={ex.videoUrl} target="_blank" rel="noreferrer"><IconPlay size={15} /> Ver vídeo</a>
                )}

                {logging && (
                  <div style={{ marginTop: 12 }}>
                    {Array.from({ length: ex.sets }, (_, i) => i + 1).map((n) => (
                      <div className="row" key={n} style={{ marginBottom: 6, alignItems: "center" }}>
                        <span className="muted" style={{ flex: "0 0 48px", fontSize: 13 }}>Série {n}</span>
                        <div>
                          <input type="number" placeholder="kg" value={sets[setKey(ex.id, n)]?.weightKg ?? ""}
                            onChange={(e) => updateSet(ex.id, n, "weightKg", e.target.value)} />
                        </div>
                        <div>
                          <input type="number" placeholder="reps" value={sets[setKey(ex.id, n)]?.reps ?? ""}
                            onChange={(e) => updateSet(ex.id, n, "reps", e.target.value)} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {logging && (
            <div className="card">
              <label>Observações (opcional)</label>
              <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Como foi o treino?" />
              <br /><br />
              <button className="primary" onClick={finish} disabled={doneCount === 0}>
                <IconCheck size={18} /> Salvar treino ({doneCount} concluído{doneCount === 1 ? "" : "s"})
              </button>
              <button className="ghost" style={{ width: "100%", marginTop: 8, justifyContent: "center" }} onClick={cancelLog}>Cancelar</button>
            </div>
          )}
        </>
      )}
    </>
  );
}
