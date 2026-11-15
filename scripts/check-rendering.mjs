import assert from 'node:assert/strict';

const baseUrl = process.env.ROUTE_TEST_URL || 'http://localhost:3001';
const sections = [
  { route: '/missing-persons', endpoint: '/missing-persons', field: 'fullName' },
  { route: '/rescue-requests', endpoint: '/rescue-requests', field: 'address' },
  { route: '/disaster', endpoint: '/disasters', field: 'disasterName' },
  { route: '/donations', endpoint: '/donations/campaigns', field: 'title' },
  { route: '/community', endpoint: '/community-posts', field: 'title' },
];

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#x27;');

const withoutScripts = (html) => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const request = (pathname) => fetch(new URL(pathname, baseUrl), { signal: AbortSignal.timeout(30000) });

for (const { route, endpoint, field } of sections) {
  const apiResponse = await request(`/api${endpoint}?limit=1`);
  assert.equal(apiResponse.status, 200, endpoint);
  const body = await apiResponse.json();
  const first = body.data[0];
  const listResponse = await request(route);
  const listHtml = await listResponse.text();
  assert.equal(listResponse.status, 200, route);

  if (first) {
    const listText = first[field] || `Rescue #${first.id.slice(0, 8)}`;
    assert.ok(withoutScripts(listHtml).includes(escapeHtml(listText)), `${route} must render records before hydration`);
    assert.ok(listHtml.includes('data-styled'), `${route} must include server-generated card styles`);

    const detailResponse = await request(`${route}/${first.id}`);
    const detailHtml = await detailResponse.text();
    const detailText = endpoint === '/rescue-requests' ? first.description : first[field];
    assert.equal(detailResponse.status, 200, `${route} detail`);
    assert.ok(withoutScripts(detailHtml).includes(escapeHtml(detailText)), `${route} detail must render its record`);
    assert.ok(!detailHtml.includes('id="__next_error__"'), `${route} detail must render without an error`);
  }

  const emptyResponse = await request(`${route}?q=edrms-rendering-regression-no-match-65a8b1b`);
  const emptyHtml = withoutScripts(await emptyResponse.text());
  assert.match(emptyHtml, /No .*found/, `${route} must apply search before rendering`);
  console.log(`PASS ${route} server rendering, styles, and search`);
}

const home = await request('/');
assert.match(home.headers.get('cache-control') || '', /s-maxage/, 'Home should use static rendering cache');
const missing = await request('/missing-persons/00000000-0000-4000-8000-000000000000');
const missingHtml = await missing.text();
assert.ok(missing.status === 404 || missingHtml.includes('noindex'), 'Missing records must render the not-found boundary');
console.log('PASS static home caching and missing-record handling');
