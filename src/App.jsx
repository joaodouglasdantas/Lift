import { Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import Workouts from "./pages/Workouts.jsx";
import Diet from "./pages/Diet.jsx";
import History from "./pages/History.jsx";
import { IconDashboard, IconDumbbell, IconDiet, IconHistory } from "./components/Icons.jsx";

const NAV = [
  { to: "/", label: "Dashboard", Icon: IconDashboard, end: true },
  { to: "/treinos", label: "Treinos", Icon: IconDumbbell },
  { to: "/dieta", label: "Dieta", Icon: IconDiet },
  { to: "/historico", label: "Histórico", Icon: IconHistory },
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
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">LIFT</span>
        </div>
        <nav className="side-nav">
          <NavItems />
        </nav>
      </aside>

      <div className="main">
        <header className="topbar">
          <h1>LIFT</h1>
          <span className="hi">Bora treinar</span>
        </header>

        <main className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/treinos" element={<Workouts />} />
            <Route path="/dieta" element={<Diet />} />
            <Route path="/historico" element={<History />} />
          </Routes>
        </main>
      </div>

      <nav className="bottom-nav">
        <NavItems />
      </nav>
    </div>
  );
}
