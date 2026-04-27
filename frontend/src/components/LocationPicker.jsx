import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const tacticalIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/8155/8155451.png', 
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

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
      onSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return position === null ? null : <Marker position={position} icon={tacticalIcon}></Marker>;
};

const LocationPicker = ({ onLocationSelect, initialPos = [20.2961, 85.8245] }) => {
  const [center, setCenter] = useState(initialPos);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const currentLoc = [pos.coords.latitude, pos.coords.longitude];
          setCenter(currentLoc);
          onLocationSelect({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => console.log("Using default center"),
        { enableHighAccuracy: true }
      );
    }
  }, [onLocationSelect]);

  return (
    <div className="w-full space-y-2 font-sans">
      <div className="h-64 w-full rounded-2xl overflow-hidden border border-dusty-lavender/30 shadow-md relative group">
        <MapContainer 
          center={center} 
          zoom={14} 
          scrollWheelZoom={true} 
          style={{ height: '100%', width: '100%', background: '#fdfbf7' }}
          zoomControl={false}
        >
          {/* Sahayam Light Theme OSM Tiles */}
          <TileLayer 
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" 
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />
          <RecenterMap position={center} />
          <LocationMarker onSelect={onLocationSelect} />
        </MapContainer>

        <div className="absolute top-3 left-3 z-[400] pointer-events-none">
          <div className="bg-white/90 backdrop-blur-md border border-dusty-lavender/30 px-3 py-1.5 rounded-lg shadow-sm">
            <p className="text-[9px] font-black text-blazing-flame uppercase tracking-widest leading-none">
              Tactical Positioning
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/60 border border-dusty-lavender/20 rounded-xl py-2.5 text-center">
        <p className="text-[10px] text-dusty-lavender font-black uppercase tracking-[0.2em]">
          Tap map to drop mission coordinates
        </p>
      </div>
    </div>
  );
};

export default LocationPicker;