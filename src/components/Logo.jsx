import { useState } from "react";

// Logos ficam em Lift/public/:
//   /logo.png        -> versão branca (para fundos escuros/vermelhos: topo e sidebar)
//   /logo-color.png  -> versão vermelha (para a tela de login)
// Se o arquivo não existir, cai no texto "LIFT" como fallback.
export default function Logo({ height = 34, color = "var(--red)", src = "/logo.png" }) {
  const [ok, setOk] = useState(true);
  if (ok) {
    return (
      <img
        src={src}
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
