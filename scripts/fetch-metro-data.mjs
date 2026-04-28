#!/usr/bin/env node
// Fetch Paris Métro lines + stations from the Overpass API and emit two
// GeoJSON files used by frontend/public/metro-quiz.html.
// Run manually after the OSM upstream changes; commit the output.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '../frontend/public/metro-quiz');

const LINES = ['1','2','3','3bis','4','5','6','7','7bis','8','9','10','11','12','13','14'];

const query = `
[out:json][timeout:180];
relation["network"="Métro de Paris"]["route"="subway"]["ref"~"^(${LINES.join('|')})$"];
(._;>;);
out body;
`;

const url = 'https://overpass-api.de/api/interpreter';
console.log('Querying Overpass API…');
const res = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'cine-paris-metro-quiz/1.0 (https://cine-paris.deod.at)',
    'Accept': 'application/json',
  },
  body: 'data=' + encodeURIComponent(query),
});
if (!res.ok) {
  console.error('Overpass error:', res.status, await res.text());
  process.exit(1);
}
const data = await res.json();
console.log(`Got ${data.elements.length} elements`);

const relations = data.elements.filter(e => e.type === 'relation');
const ways      = data.elements.filter(e => e.type === 'way');
const nodes     = data.elements.filter(e => e.type === 'node');
console.log(`  ${relations.length} relations, ${ways.length} ways, ${nodes.length} nodes`);

const nodesById = new Map(nodes.map(n => [n.id, n]));
const waysById  = new Map(ways.map(w => [w.id, w]));

const sortLines = (a, b) => {
  const na = parseInt(a, 10), nb = parseInt(b, 10);
  if (na !== nb) return na - nb;
  return a.length - b.length; // "3" before "3bis"
};

// --- LINES ---------------------------------------------------------------
const lineFeatures = [];
for (const rel of relations) {
  const ref = rel.tags?.ref;
  const colour = rel.tags?.colour || '#666';
  const segments = [];
  for (const m of rel.members) {
    if (m.type !== 'way') continue;
    if (m.role && m.role !== '') continue; // skip platforms/etc, keep tracks
    const w = waysById.get(m.ref);
    if (!w?.nodes) continue;
    const coords = [];
    for (const nid of w.nodes) {
      const n = nodesById.get(nid);
      if (n) coords.push([n.lon, n.lat]);
    }
    if (coords.length >= 2) segments.push(coords);
  }
  if (!segments.length) continue;
  lineFeatures.push({
    type: 'Feature',
    properties: { ref, colour, name: rel.tags?.name ?? null },
    geometry: { type: 'MultiLineString', coordinates: segments },
  });
}
lineFeatures.sort((a, b) => sortLines(a.properties.ref, b.properties.ref));

// --- STATIONS ------------------------------------------------------------
// Walk every route relation's node members with a stop-like role
// (stop, stop_forward, stop_backward, stop_entry_only, stop_exit_only).
// Each such node has a name tag matching the station. Group by a normalized
// key (case/accent/separator-insensitive) so OSM tagging variants collapse
// to one feature; the most-frequent raw spelling wins as the displayed name.
const normKey = s => s
  .toLowerCase()
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .replace(/[\s\-—–·]+/g, ' ')
  .trim();

const stationsByKey = new Map();
for (const rel of relations) {
  const ref = rel.tags?.ref;
  for (const m of rel.members) {
    if (m.type !== 'node') continue;
    const role = m.role || '';
    if (!role.startsWith('stop')) continue;
    const node = nodesById.get(m.ref);
    const name = node?.tags?.name;
    if (!name) continue;
    const key = normKey(name);
    let s = stationsByKey.get(key);
    if (!s) {
      s = { lat: node.lat, lon: node.lon, lines: new Set(), variants: new Map() };
      stationsByKey.set(key, s);
    }
    s.variants.set(name, (s.variants.get(name) || 0) + 1);
    s.lines.add(ref);
  }
}

const stationFeatures = [...stationsByKey.values()].map(s => {
  const [name] = [...s.variants.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)[0];
  return {
    type: 'Feature',
    properties: { name, lines: [...s.lines].sort(sortLines) },
    geometry: { type: 'Point', coordinates: [s.lon, s.lat] },
  };
});
stationFeatures.sort((a, b) => a.properties.name.localeCompare(b.properties.name, 'fr'));

console.log(`\n${stationFeatures.length} unique stations across ${lineFeatures.length} lines`);

const spot = (name) => {
  const f = stationFeatures.find(f => f.properties.name === name);
  console.log(`  ${name.padEnd(22)} → ${f ? f.properties.lines.join(', ') : 'NOT FOUND'}`);
};
spot('Châtelet');
spot('Concorde');
spot('Pré Saint-Gervais');
spot('Bastille');
spot('République');

if (stationFeatures.length < 300 || stationFeatures.length > 340) {
  console.warn(`\nWARN: station count ${stationFeatures.length} outside expected 300–340 range`);
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(
  resolve(OUT_DIR, 'stations.geojson'),
  JSON.stringify({ type: 'FeatureCollection', features: stationFeatures }) + '\n',
);
writeFileSync(
  resolve(OUT_DIR, 'lines.geojson'),
  JSON.stringify({ type: 'FeatureCollection', features: lineFeatures }) + '\n',
);
console.log(`\nWrote ${OUT_DIR}/stations.geojson and lines.geojson`);
