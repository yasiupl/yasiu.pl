// Selects the area that the "Last seen..." card shows. The card never shows the GPS position.
//
// - In a city or a town: the district and the city ("Wrzeszcz Górny, Gdańsk"), or only the town
//   when it has no districts ("Iława").
// - In the country: a geographical region from OpenStreetMap, in this order: a historical region
//   ("Kaszuby"), the most specific physiographic region ("Kraina Wielkich Jezior Mazurskich",
//   "Pojezierze Iławskie"), the municipality, the county, the province, the country.
//
// - On the move (see server/api/location.get.js): "En route" and the province, so that the card
//   does not show the route.
//
// "elements" come from the Overpass API: the areas around the position (with tags and bounds),
// and the city and town nodes in the municipality (with tags only).

// Physiographic regions, from small to large.
const RANK = { mezoregion: 1, macroregion: 2, subprovince: 3, province: 4, megaregion: 5 };
const LATIN = /^[\p{Script=Latin}\p{N}\p{P}\p{Zs}]+$/u;

const size = ({ bounds: b }) => (b.maxlat - b.minlat) * (b.maxlon - b.minlon);
const smallest = (list) => [...list].sort((a, b) => size(a) - size(b))[0];

// The local name. A name in a script other than Latin (for example Arabic) gets its English name.
// In OpenStreetMap the historical region of Lesser Poland has the name "Granica etnograficzna
// Małopolska" (the ethnographic border of Lesser Poland). The card shows "Małopolska".
export function areaName(tags, country) {
  let name = tags.name;
  if (country === 'pl' && tags['name:pl']) name = tags['name:pl'];
  else if (!LATIN.test(name)) name = tags['name:en'] || name;
  return name.replace(/^Granica etnograficzna /, '');
}

// The city or the town of the position, or null in the country.
// - Nominatim gives the city or the town for most positions. Sometimes it gives a town near a
//   village (for example Zakopane for Murzasichle). Thus the position must be in an administrative
//   area with the name of the city or the town.
// - Some towns (for example Zalewo) also have a village with the same name, and Nominatim gives the
//   village. Then a city or town node with the same name as the municipality tells that the
//   position is in the town.
export function settlementOf(elements, address) {
  const admin = elements.filter((e) => e.bounds && e.tags && e.tags.boundary === 'administrative');
  const named = address.city || address.town;
  if (named && admin.some((e) => e.tags.name === named)) return named;
  const municipalities = new Set(admin.filter((e) => e.tags.admin_level === '8').map((e) => e.tags.name));
  const town = elements.find((e) => e.type === 'node' && e.tags && /^(city|town)$/.test(e.tags.place) &&
    municipalities.has(e.tags.name));
  return town ? town.tags.name : null;
}

export function selectRegion(elements, { settlement, country, enRoute = false }) {
  const areas = elements.filter((e) => e.tags && e.tags.name && e.bounds);
  const admin = (level) => smallest(areas.filter((e) =>
    e.tags.boundary === 'administrative' && e.tags.admin_level === String(level)));
  const result = (area, name = areaName(area.tags, country)) => ({ name, bounds: area.bounds });

  if (enRoute) {
    const province = admin(4) || admin(2);
    return { name: 'En route', bounds: province ? province.bounds : null };
  }

  if (settlement) {
    const city = smallest(areas.filter((e) => e.tags.boundary === 'administrative' && e.tags.name === settlement));
    const district = admin(9);
    const cityName = city ? areaName(city.tags, country) : settlement;
    if (district) return result(district, `${areaName(district.tags, country)}, ${cityName}`);
    if (city) return result(city);
  }

  const physiographic = areas.filter((e) =>
    e.tags.region_category === 'physiographic' || e.tags.boundary === 'geomorphological-unit');
  const byRank = (list) => [...list].sort((a, b) =>
    (RANK[a.tags.region_type] || 9) - (RANK[b.tags.region_type] || 9) || size(a) - size(b))[0];
  const area =
    smallest(areas.filter((e) => e.tags.place === 'region')) ||
    byRank(physiographic) ||
    admin(7) || admin(6) || admin(4) || admin(2);
  return area ? result(area) : null;
}
