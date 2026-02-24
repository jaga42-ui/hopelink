import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useState, useEffect } from 'react';

// Leaflet Icon Fix
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const LocationMarker = ({ setPosition }) => {
  const [position, setPos] = useState(null);
  
  useMapEvents({
    click(e) {
      setPos(e.latlng);
      setPosition(e.latlng);
    },
  });

  return position === null ? null : <Marker position={position}></Marker>;
};

const LocationPicker = ({ onLocationSelect }) => {
  return (
    <div className="h-64 w-full rounded-xl overflow-hidden border-2 border-teal-500/30 shadow-inner">
      <MapContainer center={[20.2961, 85.8245]} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer 
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
        />
        <LocationMarker setPosition={onLocationSelect} />
      </MapContainer>
      <div className="bg-gray-100 text-xs text-center py-1 text-gray-500 font-medium">
        Tap anywhere on the map to pin the location
      </div>
    </div>
  );
};

export default LocationPicker;