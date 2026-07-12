import { useEffect, useState } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Dashboard from "./pages/Dashboard.jsx";
import Workouts from "./pages/Workouts.jsx";
import Diet from "./pages/Diet.jsx";
import History from "./pages/History.jsx";
import Cadastro from "./pages/Cadastro.jsx";
import Login from "./pages/Login.jsx";
import { IconDashboard, IconDumbbell, IconDiet, IconHistory, IconSettings, IconLogout } from "./components/Icons.jsx";

const NAV = [
  { to: "/", label: "Dashboard", Icon: IconDashboard, end: true },
  { to: "/treinos", label: "Treinos", Icon: IconDumbbell },
  { to: "/dieta", label: "Dieta", Icon: IconDiet },
  { to: "/historico", label: "Histórico", Icon: IconHistory },
  { to: "/cadastro", label: "Cadastro", Icon: IconSettings },
];

function NavItems() {
  return NAV.map(({ to, label, Icon, end }) => (
    <NavLink key={to} to={to} end={end}>
      <span className="ico"><Icon size={22} /></span>
      <span className="lbl">{label}</span>
    </NavLink>
  ));
}

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = carregando

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  if (user === undefined) return <p className="center muted">Carregando...</p>;
  if (!user) return <Login />;

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">LIFT</span></div>
        <nav className="side-nav"><NavItems /></nav>
        <button className="ghost" style={{ marginTop: "auto" }} onClick={() => signOut(auth)}>
          <IconLogout size={16} /> Sair
        </button>
      </aside>

      <div className="main">
        <header className="topbar">
          <h1>LIFT</h1>
          <button className="icon-btn" onClick={() => signOut(auth)} aria-label="Sair" style={{ color: "#fff" }}>
            <IconLogout size={20} />
          </button>
        </header>

        <main className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/treinos" element={<Workouts />} />
            <Route path="/dieta" element={<Diet />} />
            <Route path="/historico" element={<History />} />
            <Route path="/cadastro" element={<Cadastro />} />
          </Routes>
        </main>
      </div>

      <nav className="bottom-nav"><NavItems /></nav>
    </div>
  );
}
