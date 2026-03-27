function LegendDot({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
      <span
        style={{
          width: "12px",
          height: "12px",
          borderRadius: "999px",
          display: "inline-block",
          background: color,
        }}
      />
      <span style={{ fontSize: "0.92rem" }}>{label}</span>
    </div>
  );
}

function HotspotLegend() {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "1rem",
        padding: "0.9rem 1rem",
        borderRadius: "14px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <LegendDot color="#ef4444" label="High urgency marker" />
      <LegendDot color="#f59e0b" label="Medium urgency marker" />
      <LegendDot color="#22c55e" label="Low urgency marker" />
      <LegendDot color="#60a5fa" label="Duplicate-linked complaint" />
      <LegendDot color="#7c3aed" label="Heatmap hotspot zone" />
    </div>
  );
}

export default HotspotLegend;