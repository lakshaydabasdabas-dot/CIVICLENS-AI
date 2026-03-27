import { Link } from "react-router-dom";

function HotspotAnalysis({ hotspots = [], hotspotTrend }) {
  const topHotspots = hotspots.slice(0, 5);
  const trendDirection = hotspotTrend?.trend || "stable";
  const trendPercentage = hotspotTrend?.percentageChange || 0;

  return (
    <Link to="/hotspots" className="top-hotspots-card" aria-label="Open hotspot explorer">
      <div className="chart-card glass-panel hotspot-analytics top-hotspots-card__panel">
        <div className="hotspot-analytics__header">
          <div>
            <h3>Top Hotspots</h3>
            <p className="hotspot-analytics__lead">
              Ranked dynamically from clustered complaint density. Click anywhere on this
              panel to open the full hotspot explorer.
            </p>
          </div>
          <div className="hotspot-analytics__trend">
            <strong>{trendPercentage}%</strong>
            <span>{trendDirection} vs previous window</span>
          </div>
        </div>

        {topHotspots.length ? (
          <div className="hotspot-ranking">
            {topHotspots.map((hotspot, index) => (
              <div key={hotspot.id} className="hotspot-ranking__item hotspot-ranking__item--static">
                <span className="hotspot-ranking__index">{String(index + 1).padStart(2, "0")}</span>
                <div className="hotspot-ranking__body">
                  <strong>{hotspot.name}</strong>
                  <span>{hotspot.dominantCategory}</span>
                </div>
                <div className="hotspot-ranking__stats">
                  <strong>{hotspot.count}</strong>
                  <span>complaints</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="hotspot-analytics__empty">
            No hotspot clusters yet. Add more mapped complaints in nearby locations.
          </p>
        )}
      </div>
    </Link>
  );
}

export default HotspotAnalysis;
