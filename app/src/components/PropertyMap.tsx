import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";

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

type Point = {
  lat: number;
  lng: number;
};

const MAP_STYLE: any[] = [
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

interface PropertyMapProps {
  markers: Marker[];
  center?: Point;
  zoom?: number;
  className?: string;
  onMarkerClick?: (slug: string) => void;
  drawingMode?: boolean;
  onPolygonComplete?: (polygon: Point[]) => void;
}

export default function PropertyMap({
  markers,
  center = { lat: -1.2921, lng: 36.8219 },
  zoom = 12,
  className = "",
  onMarkerClick,
  drawingMode = false,
  onPolygonComplete,
}: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const drawingManagerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const onClickRef = useRef(onMarkerClick);
  onClickRef.current = onMarkerClick;

  // Initialize Google Maps
  useEffect(() => {
    if (!mapRef.current || isLoaded) return;

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const loader = new Loader({
      apiKey,
      version: "weekly",
      libraries: drawingMode ? ["drawing", "geometry"] : [],
    });

    loader.load().then(() => {
      if (!mapRef.current) return;

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

      mapInstanceRef.current = map;

      // Initialize drawing mode if enabled
      if (drawingMode) {
        const drawingManager = new window.google.maps.drawing.DrawingManager({
          drawingMode: window.google.maps.drawing.OverlayType.POLYGON,
          drawingControl: true,
          drawingControlOptions: {
            position: window.google.maps.ControlPosition.TOP_CENTER,
            drawingModes: [window.google.maps.drawing.OverlayType.POLYGON],
          },
          polygonOptions: {
            fillColor: "#703bf7",
            fillOpacity: 0.2,
            strokeColor: "#703bf7",
            strokeWeight: 2,
            editable: true,
          },
        });
        drawingManager.setMap(map);
        drawingManagerRef.current = drawingManager;

        // Handle polygon completion
        window.google.maps.event.addListener(drawingManager, "polygoncomplete", (polygon: any) => {
          const path = polygon.getPath();
          const coordinates: Point[] = [];
          path.forEach((latLng: any) => {
            coordinates.push({ lat: latLng.lat(), lng: latLng.lng() });
          });
          if (onPolygonComplete) {
            onPolygonComplete(coordinates);
          }
          // Disable drawing after completing a polygon
          drawingManager.setDrawingMode(null);
        });
      }

      setIsLoaded(true);
    });

    return () => {
      if (mapInstanceRef.current) {
        window.google.maps.event.clearInstanceListeners(mapInstanceRef.current);
      }
    };
    // Map instantiation should only run once on mount (or when drawingMode
    // toggles) — center/zoom changes are intentionally not re-triggering a
    // full re-init here, matching the original single-init behavior.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawingMode, isLoaded]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = markers.map((m) => addMarker(m, mapInstanceRef.current!, onClickRef.current));
  }, [markers, isLoaded]);

  return (
    <div
      ref={mapRef}
      className={`min-h-[400px] w-full overflow-hidden rounded-xl border border-border ${className}`}
    />
  );
}
