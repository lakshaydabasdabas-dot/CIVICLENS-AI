import { useEffect, useRef, useState } from "react";
import { loadGoogleMapsApi } from "../utils/googleMapsLoader.js";
import { getComplaintCoordinates, getRawComplaintsForHotspot } from "../utils/complaintDataLayers.js";
import { getHotspotById } from "../utils/hotspotClustering.js";

const DELHI_CENTER = { lat: 28.6139, lng: 77.2090 };
const OVERVIEW_ZOOM = 11;
const HOTSPOT_FALLBACK_ZOOM = 15;
const VIEWPORT_ANIMATION_DELAY_MS = 180;
const HOTSPOT_BOUNDS_PADDING = 120;
const MAP_MODES = {
  overview: "overview",
  clusterFocus: "cluster-focus",
};
const HOTSPOT_COLOR_PALETTE = {
  low: {
    fillColor: "#80ED99",
    strokeColor: "#38B000",
    glowColor: "#80ED99",
  },
  medium: {
    fillColor: "#FFD166",
    strokeColor: "#FFB703",
    glowColor: "#FFD166",
  },
  high: {
    fillColor: "#FF6B6B",
    strokeColor: "#E63946",
    glowColor: "#FF6B6B",
  },
};

function hasCoordinates(complaint) {
  const coordinates = getComplaintCoordinates(complaint);

  return Boolean(coordinates);
}

function getComplaintLocation(complaint) {
  return (
    complaint?.locationData?.address ||
    complaint?.formatted_address ||
    complaint?.address ||
    complaint?.location?.address ||
    complaint?.location?.name ||
    complaint?.location ||
    "Unknown location"
  );
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildHotspotInfoContent(hotspot) {
  return `
    <div class="map-info-window hotspot-info-window">
      <strong>${escapeHtml(hotspot.name)}</strong>
      <p>${hotspot.count} complaint${hotspot.count === 1 ? "" : "s"} in this cluster</p>
      <span>Dominant category: ${escapeHtml(hotspot.dominantCategory || "Mixed")}</span>
    </div>
  `;
}

function buildComplaintInfoContent(complaint) {
  return `
    <div class="map-info-window">
      <strong>${escapeHtml(complaint.title || "Untitled complaint")}</strong>
      <p>${escapeHtml(getComplaintLocation(complaint))}</p>
      <span>${escapeHtml(complaint.category || "Uncategorized")} | ${escapeHtml(complaint.urgency || "Unknown")}</span>
    </div>
  `;
}

function buildMarkerEntries(complaints) {
  const groupedCoordinates = new Map();

  complaints.forEach((complaint) => {
    const coordinates = getComplaintCoordinates(complaint);

    if (!coordinates) {
      return;
    }

    const coordinateKey = `${coordinates.lat.toFixed(6)}:${coordinates.lng.toFixed(6)}`;
    const group = groupedCoordinates.get(coordinateKey) || [];
    group.push({ complaint, coordinates });
    groupedCoordinates.set(coordinateKey, group);
  });

  return Array.from(groupedCoordinates.values()).flatMap((group) => {
    if (group.length === 1) {
      return [{ complaint: group[0].complaint, position: group[0].coordinates }];
    }

    return group.map((entry, index) => {
      const angle = (index / group.length) * Math.PI * 2;
      const offsetRadius = 0.00008 * (1 + Math.floor(index / 6));

      return {
        complaint: entry.complaint,
        position: {
          lat: entry.coordinates.lat + Math.sin(angle) * offsetRadius,
          lng: entry.coordinates.lng + Math.cos(angle) * offsetRadius,
        },
      };
    });
  });
}

function getHotspotRadiusMeters(count) {
  return Math.min(450 + Math.max(count - 1, 0) * 220, 2800);
}

function getHotspotColorTier(count) {
  if (count >= 6) {
    return "high";
  }

  if (count >= 3) {
    return "medium";
  }

  return "low";
}

function getHotspotCircleStyles(hotspot, { isActive = false, isHovered = false } = {}) {
  const palette = HOTSPOT_COLOR_PALETTE[getHotspotColorTier(hotspot.count)];
  const radiusMultiplier = isActive ? 1.08 : isHovered ? 1.04 : 1;
  const baseRadius = getHotspotRadiusMeters(hotspot.count) * radiusMultiplier;

  return {
    outer: {
      radius: baseRadius * 1.85,
      fillColor: palette.glowColor,
      fillOpacity: isActive ? 0.2 : isHovered ? 0.16 : 0.12,
      strokeColor: palette.glowColor,
      strokeOpacity: 0,
      strokeWeight: 0,
      zIndex: isActive ? 4 : 1,
    },
    inner: {
      radius: baseRadius,
      fillColor: palette.fillColor,
      fillOpacity: isActive ? 0.6 : isHovered ? 0.56 : 0.52,
      strokeColor: palette.strokeColor,
      strokeOpacity: isActive ? 1 : 0.92,
      strokeWeight: isActive ? 4 : isHovered ? 3.2 : 2.8,
      zIndex: isActive ? 5 : 2,
    },
  };
}

function applyHotspotCircleStyles(glowCircle, coreCircle, hotspot, options = {}) {
  const styles = getHotspotCircleStyles(hotspot, options);
  glowCircle.setOptions(styles.outer);
  coreCircle.setOptions(styles.inner);
}

function clearMapItems(itemsRef) {
  itemsRef.current.forEach((item) => {
    if (Array.isArray(item)) {
      item.forEach((entry) => {
        entry?.setMap(null);
      });
      return;
    }

    item?.setMap(null);
  });
  itemsRef.current = [];
}

function scheduleViewportUpdate(timeoutRef, callback) {
  if (timeoutRef.current) {
    window.clearTimeout(timeoutRef.current);
  }

  timeoutRef.current = window.setTimeout(() => {
    timeoutRef.current = null;
    callback();
  }, VIEWPORT_ANIMATION_DELAY_MS);
}

function setOverviewViewport(map, timeoutRef) {
  if (!map) {
    return;
  }

  map.panTo(DELHI_CENTER);
  scheduleViewportUpdate(timeoutRef, () => {
    map.setZoom(OVERVIEW_ZOOM);
  });
}

function focusHotspotViewport(map, hotspot, focusComplaints, timeoutRef) {
  if (!map || !hotspot || !window.google?.maps) {
    return;
  }

  const markerComplaints = focusComplaints.filter(hasCoordinates);
  map.panTo(hotspot.center);

  scheduleViewportUpdate(timeoutRef, () => {
    if (markerComplaints.length < 2) {
      map.setZoom(HOTSPOT_FALLBACK_ZOOM);
      return;
    }

    const bounds = new window.google.maps.LatLngBounds();

    markerComplaints.forEach((complaint) => {
      const coordinates = getComplaintCoordinates(complaint);

      if (coordinates) {
        bounds.extend(coordinates);
      }
    });

    map.fitBounds(bounds, HOTSPOT_BOUNDS_PADDING);
  });
}

function HotspotMap({
  rawComplaints = [],
  hotspots = [],
  activeHotspotId,
  onHotspotSelect,
  title = "Dynamic hotspot map",
  description = "Clusters are generated dynamically from complaint coordinates using a 0.1 degree grid.",
}) {
  const mapElementRef = useRef(null);
  const mapRef = useRef(null);
  const infoWindowRef = useRef(null);
  const onHotspotSelectRef = useRef(onHotspotSelect);
  const circleEntriesRef = useRef([]);
  const detailLayerEntriesRef = useRef([]);
  const viewportTimeoutRef = useRef(null);
  const [map, setMap] = useState(null);
  const [mapMode, setMapMode] = useState(MAP_MODES.overview);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [error, setError] = useState("");

  const isControlled = activeHotspotId !== undefined;
  const controlledCluster =
    isControlled && activeHotspotId ? getHotspotById(hotspots, activeHotspotId) : null;
  const internalCluster = selectedCluster
    ? getHotspotById(hotspots, selectedCluster.id) || selectedCluster
    : null;
  const activeHotspot = isControlled ? controlledCluster : internalCluster;
  const activeMapMode =
    activeHotspot && (isControlled || mapMode === MAP_MODES.clusterFocus)
      ? MAP_MODES.clusterFocus
      : MAP_MODES.overview;
  const mappedComplaints = rawComplaints.filter(hasCoordinates);
  const activeHotspotRawComplaints = activeHotspot
    ? getRawComplaintsForHotspot(rawComplaints, activeHotspot)
    : [];
  const focusComplaints =
    activeHotspotRawComplaints.length > 0 ? activeHotspotRawComplaints : activeHotspot?.complaints || [];

  useEffect(() => {
    onHotspotSelectRef.current = onHotspotSelect;
  }, [onHotspotSelect]);

  useEffect(() => {
    let isMounted = true;

    const initializeMap = async () => {
      try {
        await loadGoogleMapsApi();

        if (!isMounted || mapRef.current || !mapElementRef.current) {
          return;
        }

        const nextMap = new window.google.maps.Map(mapElementRef.current, {
          center: DELHI_CENTER,
          zoom: OVERVIEW_ZOOM,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          clickableIcons: false,
        });

        mapRef.current = nextMap;
        infoWindowRef.current = new window.google.maps.InfoWindow();
        setMap(nextMap);
        setError("");
      } catch (loadError) {
        console.error(loadError);

        if (isMounted) {
          setError("Failed to load the hotspot map.");
        }
      }
    };

    initializeMap();

    return () => {
      isMounted = false;
      if (viewportTimeoutRef.current) {
        window.clearTimeout(viewportTimeoutRef.current); // eslint-disable-line react-hooks/exhaustive-deps
      }
      clearMapItems(circleEntriesRef);
      clearMapItems(detailLayerEntriesRef);
      infoWindowRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (!map || !window.google?.maps) {
      return;
    }

    clearMapItems(circleEntriesRef);
    clearMapItems(detailLayerEntriesRef);
    infoWindowRef.current?.close();

    if (!hotspots.length) {
      setOverviewViewport(map, viewportTimeoutRef);
      return;
    }

    const renderComplaintMarkers = (focusItems) => {
      detailLayerEntriesRef.current = buildMarkerEntries(focusItems)
        .map(({ complaint, position }) => {
          const marker = new window.google.maps.Marker({
            map,
            position,
            title: complaint.title || `Complaint ${complaint.id}`,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: "#ff4d4d",
              fillOpacity: 1,
              strokeWeight: 1,
              strokeColor: "#ffffff",
            },
            zIndex: 8,
          });

          marker.addListener("click", () => {
            infoWindowRef.current?.setContent(buildComplaintInfoContent(complaint));
            infoWindowRef.current?.open({
              anchor: marker,
              map,
            });
          });

          return marker;
        });
    };

    const createHotspotCircle = (hotspot, { isActive = false } = {}) => {
      const styles = getHotspotCircleStyles(hotspot, { isActive });
      const glowCircle = new window.google.maps.Circle({
        map,
        center: hotspot.center,
        clickable: false,
        ...styles.outer,
      });
      const coreCircle = new window.google.maps.Circle({
        map,
        center: hotspot.center,
        clickable: true,
        ...styles.inner,
      });

      coreCircle.addListener("mouseover", () => {
        applyHotspotCircleStyles(glowCircle, coreCircle, hotspot, { isActive, isHovered: true });
        infoWindowRef.current?.setContent(buildHotspotInfoContent(hotspot));
        infoWindowRef.current?.setPosition(hotspot.center);
        infoWindowRef.current?.open({
          map,
          shouldFocus: false,
        });
      });

      coreCircle.addListener("mouseout", () => {
        applyHotspotCircleStyles(glowCircle, coreCircle, hotspot, { isActive });
        infoWindowRef.current?.close();
      });

      coreCircle.addListener("click", () => {
        if (!isControlled) {
          setMapMode(MAP_MODES.clusterFocus);
          setSelectedCluster(hotspot);
        }

        onHotspotSelectRef.current?.(hotspot.id);
      });

      return [glowCircle, coreCircle];
    };

    if (activeMapMode === MAP_MODES.clusterFocus && activeHotspot) {
      const detailComplaints = getRawComplaintsForHotspot(rawComplaints, activeHotspot);
      const markerComplaints =
        detailComplaints.length > 0 ? detailComplaints : activeHotspot.complaints || [];

      circleEntriesRef.current = [createHotspotCircle(activeHotspot, { isActive: true })];
      renderComplaintMarkers(markerComplaints);
      focusHotspotViewport(map, activeHotspot, markerComplaints, viewportTimeoutRef);
      return;
    }

    circleEntriesRef.current = hotspots.map((hotspot) => createHotspotCircle(hotspot));
    setOverviewViewport(map, viewportTimeoutRef);
  }, [map, hotspots, activeHotspot, activeMapMode, isControlled, rawComplaints]);

  const handleResetView = () => {
    if (!isControlled) {
      setMapMode(MAP_MODES.overview);
      setSelectedCluster(null);
    }

    infoWindowRef.current?.close();
    clearMapItems(detailLayerEntriesRef);
    clearMapItems(circleEntriesRef);
    setOverviewViewport(mapRef.current, viewportTimeoutRef);
    onHotspotSelectRef.current?.("");
  };

  return (
    <section className="map-panel glass-panel reveal-in">
      <div className="map-panel__header">
        <div>
          <span className="section-kicker">
            {activeMapMode === MAP_MODES.clusterFocus && activeHotspot
              ? "Hotspot detail"
              : "Hotspot overview"}
          </span>
          <h2>{title}</h2>
        </div>
        <div className="map-panel__stats">
          <span>{rawComplaints.length} total complaints</span>
          <span>{mappedComplaints.length} mapped</span>
          <span>{hotspots.length} hotspots</span>
          <span>
            {activeMapMode === MAP_MODES.clusterFocus && activeHotspot
              ? activeHotspot.name
              : "Overview mode"}
          </span>
        </div>
      </div>

      <p className="map-panel__copy">{description}</p>

      {error ? (
        <div className="map-placeholder">
          <p>{error}</p>
        </div>
      ) : (
        <div className="map-shell hotspot-map-shell">
          <div ref={mapElementRef} className="map-canvas" />

          {!map ? (
            <div className="map-empty-state">
              <p>Loading hotspot map...</p>
            </div>
          ) : null}

          {map && !hotspots.length ? (
            <div className="map-empty-state">
              <p>
                Hotspots appear when multiple mapped complaints fall into the same dynamic
                grid region.
              </p>
            </div>
          ) : null}

          {activeMapMode === MAP_MODES.clusterFocus && activeHotspot ? (
            <>
              <button
                type="button"
                className="hotspot-map__reset"
                onClick={handleResetView}
              >
                Show all hotspots
              </button>

              <div className="hotspot-map__overlay">
                <strong>{activeHotspot.name}</strong>
                <p>
                  {focusComplaints.length} raw complaint
                  {focusComplaints.length === 1 ? "" : "s"} mapped in this cluster
                </p>
                <span>{activeHotspot.count} unique incidents in overview clustering</span>
              </div>
            </>
          ) : null}
        </div>
      )}
    </section>
  );
}

export default HotspotMap;
