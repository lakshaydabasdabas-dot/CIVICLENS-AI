function FilterSelect({ label, value, onChange, options = [] }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
      <span style={{ fontSize: "0.9rem", fontWeight: 700 }}>{label}</span>
      <select
        value={value}
        onChange={onChange}
        style={{
          padding: "0.8rem 0.9rem",
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.16)",
          background: "rgba(255,255,255,0.06)",
          color: "inherit",
        }}
      >
        <option value="ALL">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function RegionFilter({ filters, options, onFilterChange, onReset }) {
  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "1rem",
        padding: "1rem",
        borderRadius: "20px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <label style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
        <span style={{ fontSize: "0.9rem", fontWeight: 700 }}>Search</span>
        <input
          value={filters.search}
          onChange={(event) => onFilterChange("search", event.target.value)}
          placeholder="Search title, locality, region..."
          style={{
            padding: "0.8rem 0.9rem",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.16)",
            background: "rgba(255,255,255,0.06)",
            color: "inherit",
          }}
        />
      </label>

      <FilterSelect
        label="Region"
        value={filters.region}
        onChange={(event) => onFilterChange("region", event.target.value)}
        options={options.regions}
      />

      <FilterSelect
        label="Locality"
        value={filters.locality}
        onChange={(event) => onFilterChange("locality", event.target.value)}
        options={options.localities}
      />

      <FilterSelect
        label="Category"
        value={filters.category}
        onChange={(event) => onFilterChange("category", event.target.value)}
        options={options.categories}
      />

      <FilterSelect
        label="Urgency"
        value={filters.urgency}
        onChange={(event) => onFilterChange("urgency", event.target.value)}
        options={options.urgencies}
      />

      <FilterSelect
        label="Department"
        value={filters.department}
        onChange={(event) => onFilterChange("department", event.target.value)}
        options={options.departments}
      />

      <FilterSelect
        label="Status"
        value={filters.status}
        onChange={(event) => onFilterChange("status", event.target.value)}
        options={options.statuses}
      />

      <div style={{ display: "flex", alignItems: "end" }}>
        <button
          type="button"
          onClick={onReset}
          style={{
            width: "100%",
            padding: "0.85rem 1rem",
            borderRadius: "12px",
            border: "none",
            cursor: "pointer",
            fontWeight: 800,
          }}
        >
          Reset Filters
        </button>
      </div>
    </section>
  );
}

export default RegionFilter;