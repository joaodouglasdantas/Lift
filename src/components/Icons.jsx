// Ícones SVG (stroke). size e color configuráveis; herdam currentColor por padrão.
const base = (size) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
});

export const IconDashboard = ({ size = 24 }) => (
  <svg {...base(size)}>
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
);

export const IconDumbbell = ({ size = 24 }) => (
  <svg {...base(size)}>
    <path d="M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11" />
  </svg>
);

export const IconDiet = ({ size = 24 }) => (
  <svg {...base(size)}>
    <path d="M3 2v7c0 1.1.9 2 2 2h0c1.1 0 2-.9 2-2V2M5 2v20M13 7c0-2.8 1.8-5 4-5s4 2.2 4 5-1.8 5-4 5v8" />
  </svg>
);

export const IconHistory = ({ size = 24 }) => (
  <svg {...base(size)}>
    <path d="M3 3v5h5" />
    <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const IconPlus = ({ size = 24 }) => (
  <svg {...base(size)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconCheck = ({ size = 24 }) => (
  <svg {...base(size)}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const IconTrash = ({ size = 24 }) => (
  <svg {...base(size)}>
    <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </svg>
);

export const IconPlay = ({ size = 24 }) => (
  <svg {...base(size)}>
    <polygon points="6 4 20 12 6 20 6 4" />
  </svg>
);

export const IconUpload = ({ size = 24 }) => (
  <svg {...base(size)}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
  </svg>
);

export const IconTarget = ({ size = 24 }) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1" />
  </svg>
);

export const IconFlame = ({ size = 24 }) => (
  <svg {...base(size)}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.5 0 3-1 3-3 0-1-.5-2-1-2.5.5 2-1.5 2.5-1.5 2.5.5-2-1-4-2-5 .5 2-1 3-1.5 3.5A4 4 0 0 0 8.5 14.5Z" />
    <path d="M12 22a7 7 0 0 0 7-7c0-3-2-5-3.5-7.5C14 5 12 3 12 2c0 1-2 3-3.5 5.5C7 10 5 12 5 15a7 7 0 0 0 7 7Z" />
  </svg>
);

export const IconSettings = ({ size = 24 }) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export const IconLogout = ({ size = 24 }) => (
  <svg {...base(size)}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
);
