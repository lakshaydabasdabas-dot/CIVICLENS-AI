import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HotspotMap from "../components/HotspotMap.jsx";
import SkeletonBlock from "../components/SkeletonBlock.jsx";
import { useComplaints } from "../context/useComplaints.js";
import { createPageAnimations } from "../interactions/animations";
import { buildComplaintDataLayers } from "../utils/complaintDataLayers.js";
import {
  getHotspotById,
  getHotspotStats,
  getHotspotTrend,
} from "../utils/hotspotClustering.js";

function getComplaintLocationLabel(complaint) {
  return complaint.locationData?.address || complaint.location || "Unknown location";
}

function ExplorerSkeleton() {
  return (
    <>
      <div className="stats-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="dashboard-card glass-panel">
            <SkeletonBlock className="skeleton-line skeleton-line--short" />
            <SkeletonBlock className="skeleton-line skeleton-line--medium" />
          </div>
        ))}
      </div>
      <div className="map-panel glass-panel">
        <SkeletonBlock className="skeleton-chart" />
      </div>
    </>
  );
}

function HotspotExplorer() {
  const pageRef = useRef(null);
  const navigate = useNavigate();
  const { hotspotId } = useParams();
  const { complaints, error, isLoading } = useComplaints();
  const rawComplaints = complaints;
  const { clusteredComplaints: hotspots } = buildComplaintDataLayers(rawComplaints, {
    maxHotspots: 10,
  });
  const hotspotStats = getHotspotStats(hotspots);
  const hotspotTrend = getHotspotTrend(hotspots, "week");
  const activeHotspot = getHotspotById(hotspots, hotspotId);
  const hotspotComplaints = activeHotspot?.complaints || [];

  useEffect(() => createPageAnimations(pageRef.current), []);

  useEffect(() => {
    if (!hotspotId || !hotspots.length || activeHotspot) {
      return;
    }

    navigate("/hotspots", { replace: true });
  }, [activeHotspot, hotspotId, hotspots, navigate]);

  const handleHotspotSelect = (nextHotspotId) => {
    if (!nextHotspotId) {
      navigate("/hotspots");
      return;
    }

    navigate(`/hotspots/${nextHotspotId}`);
  };

  return (
    <div ref={pageRef} className="content-page hotspot-explorer">
      <section className="page-hero reveal-in">
        <span className="section-kicker">Hotspot explorer</span>
        <h1 className="page-title gradient-reveal">
          {activeHotspot
            ? `Inspect ${activeHotspot.name} in hotspot detail mode.`
            : "Inspect the top 10 complaint hotspots and drill down into each highlighted region."}
        </h1>
        <p className="page-copy">
          {activeHotspot
            ? "The map is focused on the selected hotspot and renders every raw complaint marker inside that cluster."
            : "Each hotspot is derived dynamically from complaint coordinates. Select a cluster to switch from overview mode into hotspot detail mode."}
        </p>
      </section>

      {error ? <p className="form-message form-message--error">{error}</p> : null}

      {isLoading ? (
        <ExplorerSkeleton />
      ) : hotspots.length ? (
        <>
          <div className="stats-grid stagger-group">
            <div className="dashboard-card glass-panel">
              <span className="metric-card__label">Top hotspots</span>
              <strong className="dashboard-value">{hotspotStats.totalHotspots}</strong>
            </div>
            <div className="dashboard-card glass-panel">
              <span className="metric-card__label">Unique complaints in hotspots</span>
              <strong className="dashboard-value">{hotspotStats.totalComplaintsInHotspots}</strong>
            </div>
            <div className="dashboard-card glass-panel">
              <span className="metric-card__label">Average cluster size</span>
              <strong className="dashboard-value">{hotspotStats.averageClusterSize}</strong>
            </div>
            <div className="dashboard-card glass-panel">
              <span className="metric-card__label">Trend</span>
              <strong className="dashboard-value">{hotspotTrend.percentageChange}%</strong>
            </div>
          </div>

          <HotspotMap
            rawComplaints={rawComplaints}
            hotspots={hotspots}
            activeHotspotId={activeHotspot?.id || ""}
            onHotspotSelect={handleHotspotSelect}
            title={activeHotspot ? `${activeHotspot.name} hotspot detail` : "Interactive hotspot explorer"}
            description={
              activeHotspot
                ? "Focused detail mode: the viewport fits the selected cluster and renders every raw complaint marker inside it."
                : "Overview mode: all hotspot clusters are shown around Delhi. Click a cluster or ranked hotspot to focus it."
            }
          />

          <section className="hotspot-explorer__grid stagger-group">
            <div className="glass-panel hotspot-directory">
              <div className="hotspot-directory__header">
                <span className="section-kicker">Top 10 hotspots</span>
                <h2>Ranked hotspot list</h2>
              </div>

              <div className="hotspot-directory__list">
                {hotspots.map((hotspot, index) => (
                  <button
                    key={hotspot.id}
                    type="button"
                    className={`hotspot-directory__item${
                      hotspot.id === activeHotspot?.id ? " hotspot-directory__item--active" : ""
                    }`}
                    onClick={() => handleHotspotSelect(hotspot.id)}
                  >
                    <span className="hotspot-directory__index">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="hotspot-directory__body">
                      <strong>{hotspot.name}</strong>
                      <span>{hotspot.dominantCategory}</span>
                    </div>
                    <strong className="hotspot-directory__count">{hotspot.count}</strong>
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-panel hotspot-detail">
              {activeHotspot ? (
                <>
                  <div className="hotspot-detail__header">
                    <span className="section-kicker">Selected hotspot</span>
                    <h2>{activeHotspot.name}</h2>
                    <p>
                      {activeHotspot.count} unique complaint
                      {activeHotspot.count === 1 ? "" : "s"} define this cluster in overview
                      mode. The map detail view renders every raw complaint marker in the same
                      region. Dominant category: {activeHotspot.dominantCategory}. Use "Show all
                      hotspots" on the map to return to overview mode.
                    </p>
                  </div>

                  <div className="hotspot-detail__chips">
                    {activeHotspot.topCategories.map((category) => (
                      <span key={category.category} className="hotspot-chip">
                        {category.category} ({category.count})
                      </span>
                    ))}
                  </div>

                  <div className="hotspot-complaints">
                    <h3>Complaints in this hotspot</h3>
                    <div className="hotspot-complaints__list">
                      {hotspotComplaints.map((complaint) => (
                        <article key={complaint.id} className="hotspot-complaint">
                          <div className="hotspot-complaint__header">
                            <a
                              href={`#/complaint-map/${complaint.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {complaint.title}
                            </a>
                            <span>{complaint.urgency || "Unknown"}</span>
                          </div>
                          <p>{getComplaintLocationLabel(complaint)}</p>
                          <div className="hotspot-complaint__meta">
                            <span>{complaint.category || "Uncategorized"}</span>
                            <span>{complaint.status || "NEW"}</span>
                            <span>{new Date(complaint.created_at || 0).toLocaleString()}</span>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <p className="hotspot-detail__empty">
                  Overview mode is active. Choose a hotspot from the map or the ranked list to
                  switch into a focused hotspot detail view.
                </p>
              )}
            </div>
          </section>
        </>
      ) : (
        <div className="table-panel glass-panel reveal-in">
          <h2>No hotspot clusters yet</h2>
          <p className="table-note">
            Hotspots are created dynamically once multiple mapped complaints land inside the same
            grid-based region.
          </p>
        </div>
      )}
    </div>
  );
}

export default HotspotExplorer;
