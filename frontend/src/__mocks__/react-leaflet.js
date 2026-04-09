// Manual mock for react-leaflet
import React from 'react';

export const MapContainer = ({ children, ...props }) => <div data-testid="map-container" {...props}>{children}</div>;
export const TileLayer = (props) => <div data-testid="tile-layer" {...props} />;
export const Marker = ({ children, ...props }) => <div data-testid="marker" {...props}>{children}</div>;
export const Popup = ({ children, ...props }) => <div data-testid="popup" {...props}>{children}</div>;
export const Polyline = (props) => <div data-testid="polyline" {...props} />;
export const useMap = () => ({});
export const useMapEvent = () => jest.fn();
export const useMapEvents = () => ({});




