import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useState, useEffect } from 'react';
import L from 'leaflet';

// 👉 Custom Tactical Marker (Matches Radar styling)
const tacticalIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/8155/8155451.png', 
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

// Helper to auto-center map when position changes
const RecenterMap = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 14, { duration: 1.5 });
  }, [position, map]);
  return null;
};

const LocationMarker = ({ onSelect }) => {
  const [position, setPos] = useState(null);
  
  useMapEvents({
    click(e) {
      setPos(e.latlng);
      onSelect(e.latlng);
    },
  });

  return position === null ? null : <Marker position={position} icon={tacticalIcon}></Marker>;
};

const LocationPicker = ({ onLocationSelect, initialPos = [20.2961, 85.8245] }) => {
  const [center, setCenter] = useState(initialPos);

  // Auto-detect location on mount for better mobile UX
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setCenter([pos.coords.latitude, pos.coords.longitude]),
      () => console.log("Using default center"),
      { enableHighAccuracy: true }
    );
  }, []);

  return (
    <div className="w-full space-y-2">
      <div className="h-64 w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative group">
        <MapContainer 
          center={center} 
          zoom={13} 
          scrollWheelZoom={true} 
          style={{ height: '100%', width: '100%', background: '#050505' }}
          zoomControl={false}
        >
          {/* 👉 DARK MODE TILES: CartoDB Dark Matter */}
          <TileLayer 
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />
          
          <RecenterMap position={center} />
          <LocationMarker onSelect={onLocationSelect} />
        </MapContainer>

        {/* Overlay Instruction */}
        <div className="absolute top-3 left-3 z-[400] pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg">
            <p className="text-[9px] font-black text-teal-400 uppercase tracking-widest leading-none">
              Tactical Positioning
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/5 rounded-xl py-2.5 text-center">
        <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">
          Tap map to drop mission coordinates
        </p>
      </div>
    </div>
  );
};

export default LocationPicker;