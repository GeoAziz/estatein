import { useEffect, useRef } from "react";

declare global {
  interface Window {
    google: any;
  }
}

type Marker = {
  name: string;
  price: string;
  lat: number;
  lng: number;
  slug?: string;
};

const MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#1a1a1a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#141414" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#999999" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#262626" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#999999" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1624" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

function addMarker(m: Marker, map: any, onClick?: (slug: string) => void) {
  const position = { lat: m.lat, lng: m.lng };
  const marker = new window.google.maps.Marker({
    position,
    map,
    title: m.name,
    icon: {
      path: window.google.maps.SymbolPath.ROUNDED_RECTANGLE,
      fillColor: "#703bf7",
      fillOpacity: 1,
      strokeColor: "#141414",
      strokeWeight: 2,
      scale: 12,
    },
  });
  const infoWindow = new window.google.maps.InfoWindow({
    content: `
      <div style="font-family:Urbanist,sans-serif;background:#1a1a1a;color:#fff;border-radius:10px;padding:12px 16px;min-width:160px;border:1px solid #262626">
        <div style="font-size:14px;font-weight:600;margin-bottom:4px">${m.name}</div>
        <div style="font-size:13px;color:#703bf7;font-weight:500">${m.price}</div>
      </div>
    `,
    pixelOffset: new window.google.maps.Size(0, -10),
  });
  marker.addListener("click", () => {
    infoWindow.open(map, marker);
    if (m.slug && onClick) onClick(m.slug);
  });
  return marker;
}

export default function PropertyMap({
  markers,
  center = { lat: -1.2921, lng: 36.8219 },
  zoom = 12,
  className = "",
  onMarkerClick,
}: {
  markers: Marker[];
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  onMarkerClick?: (slug: string) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const onClickRef = useRef(onMarkerClick);
  onClickRef.current = onMarkerClick;

  useEffect(() => {
    if (!mapRef.current) return;

    function initMap() {
      if (!mapRef.current || !window.google?.maps) return;

      const map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        styles: MAP_STYLE,
      });
      instanceRef.current = map;
      markersRef.current = markers.map((m) => addMarker(m, map, onClickRef.current));
    }

    if (window.google?.maps) {
      initMap();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyDemo1234567890";
    script.async = true;
    script.defer = true;
    script.onload = initMap;
    document.head.appendChild(script);

    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!instanceRef.current || !window.google?.maps) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = markers.map((m) => addMarker(m, instanceRef.current, onClickRef.current));
  }, [markers]);

  return (
    <div
      ref={mapRef}
      className={`min-h-[400px] w-full overflow-hidden rounded-xl border border-border ${className}`}
    />
  );
}
