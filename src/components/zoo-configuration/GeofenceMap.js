import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Circle, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png'
import icon from 'leaflet/dist/images/marker-icon.png'
import shadow from 'leaflet/dist/images/marker-shadow.png'

L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetina.src || iconRetina,
  iconUrl: icon.src || icon,
  shadowUrl: shadow.src || shadow
})

const COLORS = {
  primary: '#37BD69',
  primaryDark: '#006D35',
  text: '#44544A',
  outline: '#C3CEC7'
}

// Small SVG icon for the radius drag handle (rendered as a custom Leaflet divIcon).
const radiusHandleIcon = L.divIcon({
  className: 'antz-radius-handle',
  html: `
    <div style="
      width:18px;height:18px;border-radius:50%;
      background:#fff;border:2px solid ${COLORS.primary};
      box-shadow:0 1px 4px rgba(0,0,0,0.25);
      cursor:ew-resize;display:flex;align-items:center;justify-content:center;
    ">
      <div style="width:6px;height:2px;background:${COLORS.primary};margin-right:1px;"></div>
      <div style="width:6px;height:2px;background:${COLORS.primary};"></div>
    </div>
  `,
  iconSize: [18, 18],
  iconAnchor: [9, 9]
})

const formatRadius = m => {
  if (m == null || isNaN(m)) return '—'
  if (m >= 1000) return `${(m / 1000).toFixed(m % 1000 === 0 ? 0 : 1)} km`

  return `${m} m`
}

// Click on empty map sets center (only when no coords are set yet).
const ClickToSet = ({ enabled, onSet }) => {
  useMapEvents({
    click(e) {
      if (enabled) onSet(e.latlng.lat, e.latlng.lng)
    }
  })

  return null
}

// Auto-fit the map so the whole circle is comfortably visible.
// Triggers: initial load, lat/lng change (drag end / click-to-set), and radius change.
// We use a ref-driven trigger so user pan/zoom in between doesn't yank the map.
const FitToCircle = ({ lat, lng, radiusM, fitTrigger }) => {
  const map = useMap()
  useEffect(() => {
    if (lat == null || lng == null) return
    const center = L.latLng(lat, lng)
    // Build bounds = the smallest box that fully contains the circle.
    const bounds = center.toBounds(radiusM * 2) // toBounds takes the box's side length
    map.fitBounds(bounds, { padding: [40, 40], animate: true, maxZoom: 17 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, radiusM, fitTrigger])

  return null
}

// East-edge handle: dragging it changes the radius (in meters) using haversine.
const RadiusHandle = ({ lat, lng, radiusM, onRadiusChange }) => {
  const map = useMap()

  const handlePos = useMemo(() => {
    if (lat == null || lng == null) return null

    // Move radiusM meters due east from center using Leaflet's projection.
    const center = L.latLng(lat, lng)
    const earthRadius = 6378137
    const dLng = (radiusM / earthRadius) * (180 / Math.PI) / Math.cos((lat * Math.PI) / 180)

    return L.latLng(lat, lng + dLng)
  }, [lat, lng, radiusM])

  if (!handlePos) return null

  const handleDrag = e => {
    const newPos = e.target.getLatLng()
    const center = L.latLng(lat, lng)
    const distance = center.distanceTo(newPos)
    const clamped = Math.max(1, Math.min(50000, Math.round(distance)))
    onRadiusChange(clamped)
  }

  return (
    <Marker
      position={handlePos}
      icon={radiusHandleIcon}
      draggable
      eventHandlers={{
        drag: handleDrag,
        dragend: handleDrag
      }}
      // Stay on top of the circle
      zIndexOffset={1000}
    />
  )
}

const GeofenceMap = ({ lat, lng, radiusM, onChange, onRadiusChange }) => {
  const hasCoords = lat != null && lng != null && !isNaN(lat) && !isNaN(lng)
  const initialCenter = hasCoords ? [lat, lng] : [12.9712, 77.5946]
  const initialZoom = hasCoords ? 15 : 5
  const safeRadius = Number.isFinite(radiusM) && radiusM > 0 ? radiusM : 100

  const handleMarkerDragEnd = e => {
    const { lat: newLat, lng: newLng } = e.target.getLatLng()
    onChange(Number(newLat.toFixed(6)), Number(newLng.toFixed(6)))
  }

  const handleClickToSet = (la, ln) => {
    onChange(Number(la.toFixed(6)), Number(ln.toFixed(6)))
  }

  return (
    <div style={{ position: 'relative' }}>
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        style={{ height: 480, width: '100%', borderRadius: 8 }}
        scrollWheelZoom
        worldCopyJump={false}
      >
        <TileLayer
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {hasCoords && (
          <>
            <Circle
              center={[lat, lng]}
              radius={safeRadius}
              pathOptions={{
                color: COLORS.primary,
                fillColor: COLORS.primary,
                fillOpacity: 0.18,
                weight: 2.5
              }}
            />
            <Marker
              position={[lat, lng]}
              draggable
              eventHandlers={{ dragend: handleMarkerDragEnd }}
            />
            {onRadiusChange && (
              <RadiusHandle lat={lat} lng={lng} radiusM={safeRadius} onRadiusChange={onRadiusChange} />
            )}
          </>
        )}

        <ClickToSet enabled={!hasCoords} onSet={handleClickToSet} />
        {hasCoords && <FitToCircle lat={lat} lng={lng} radiusM={safeRadius} fitTrigger={0} />}
      </MapContainer>

      {/* Radius readout — top-left */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          zIndex: 1000,
          padding: '6px 10px',
          borderRadius: 6,
          background: 'rgba(255,255,255,0.96)',
          color: COLORS.text,
          fontSize: 12,
          fontWeight: 600,
          boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6
        }}
      >
        Radius: {formatRadius(safeRadius)}
      </div>

      {/* Empty-state hint when no center is set yet */}
      {!hasCoords && (
        <div
          aria-live='polite'
          style={{
            position: 'absolute',
            bottom: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            padding: '8px 14px',
            borderRadius: 8,
            background: COLORS.primary,
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 2px 10px rgba(55,189,105,0.35)',
            whiteSpace: 'nowrap'
          }}
        >
          Click on the map to set the zoo center
        </div>
      )}
    </div>
  )
}

export default GeofenceMap
