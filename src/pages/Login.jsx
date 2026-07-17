import { useState } from "react";
import { auth } from "../firebase.js";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import Logo from "../components/Logo.jsx";

export default function Login() {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      if (mode === "login") await signInWithEmailAndPassword(auth, email, pass);
      else await createUserWithEmailAndPassword(auth, email, pass);
    } catch (e) {
      setErr(traduz(e.code) || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ marginBottom: 4 }}><Logo height={64} /></div>
      <p className="muted" style={{ marginTop: 0, marginBottom: 24 }}>Academia e dieta</p>
      <form className="card auth" onSubmit={submit} style={{ width: "100%", maxWidth: 380, padding: 28 }}>
        <h2 style={{ marginBottom: 6 }}>{mode === "login" ? "Entrar" : "Criar conta"}</h2>
        <label>E-mail</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" autoComplete="email" style={{ marginBottom: 14 }} />
        <label>Senha</label>
        <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="mínimo 6 caracteres" autoComplete="current-password" />
        {err && <p style={{ color: "var(--red)", fontSize: 13, marginTop: 10 }}>{err}</p>}
        <div style={{ height: 20 }} />
        <button className="primary" type="submit" disabled={loading}>
          {loading ? "..." : mode === "login" ? "Entrar" : "Cadastrar"}
        </button>
        <p className="muted" style={{ textAlign: "center", marginTop: 14, fontSize: 13, cursor: "pointer" }}
           onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(null); }}>
          {mode === "login" ? "Não tem conta? Criar uma" : "Já tem conta? Entrar"}
        </p>
      </form>
    </div>
  );
}

function traduz(code) {
  const m = {
    "auth/invalid-email": "E-mail inválido.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/wrong-password": "Senha incorreta.",
    "auth/user-not-found": "Usuário não encontrado.",
    "auth/email-already-in-use": "Esse e-mail já tem conta.",
    "auth/weak-password": "Senha muito fraca (mínimo 6 caracteres).",
  };
  return m[code];
}
