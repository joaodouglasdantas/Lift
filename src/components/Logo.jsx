import { useState } from "react";

// Mostra a logo em /logo.png (salve seu arquivo em Lift/public/logo.png).
// Se o arquivo não existir, cai no texto "LIFT" como fallback.
export default function Logo({ height = 34, color = "var(--red)" }) {
  const [ok, setOk] = useState(true);
  if (ok) {
    return (
      <img
        src="/logo.png"
        alt="Lift"
        style={{ height, width: "auto", display: "block", objectFit: "contain" }}
        onError={() => setOk(false)}
      />
    );
  }
  return (
    <span style={{ fontSize: Math.round(height * 0.72), fontWeight: 800, letterSpacing: 3, color }}>
      LIFT
    </span>
  );
}
