const KEY = import.meta.env.PUBLIC_MAPTILER_KEY;

if (!KEY) {
  console.warn('PUBLIC_MAPTILER_KEY missing; map will fall back to a raster basemap');
}

/**
 * MapTiler Positron — light, low-saturation basemap.
 * The choropleth carries all the color in the product, so the basemap
 * must stay quiet (see DESIGN.md "Restrained" principle).
 */
export const STYLE_URL = KEY
  ? `https://api.maptiler.com/maps/positron/style.json?key=${KEY}`
  : 'https://demotiles.maplibre.org/style.json';

export const LUX_BOUNDS: [number, number, number, number] = [5.73, 49.44, 6.55, 50.19];
export const LUX_CENTER: [number, number] = [6.13, 49.815];
export const LUX_ZOOM = 9.1;
