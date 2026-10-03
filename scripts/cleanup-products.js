const https = require('https');
const token = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const project = 'uogurlzgokwoqjgrphmq';

function query(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const req = https.request({
      hostname: 'api.supabase.com',
      path: '/v1/projects/' + project + '/database/query',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const NEW_PRODUCT_SLUGS = [
  '50-oled-smart-tv',
  'bluetooth-earbuds-pro',
  'gaming-laptop-rtx4060',
  '1-gang-light-switch-white',
  'usb-wall-outlet-charger',
  'led-dimmer-switch',
  'led-recessed-downlight-6in',
  'smart-led-strip-rgb',
  'industrial-pendant-light',
  '20a-circuit-breaker',
  '40a-double-pole-breaker',
  'surge-protector-panel-mount',
  '12-2-nm-cable-250ft',
  '14-2-nm-cable-125ft',
  'thhn-wire-12-awg-500ft',
  'cordless-drill-driver-20v',
  'orbital-sander-5in',
  'circular-saw-15a',
  'aa-alkaline-batteries-48-pack',
  '9v-alkaline-batteries-12-pack',
  'li-ion-18650-3000mah',
  '16-inch-pedestal-fan',
  '8-inch-desk-fan',
  'range-hood-30-stainless',
  '1500va-ups-battery-backup',
  '12-outlet-surge-protector',
  '6-outlet-surge-15ft',
  'wifi-smart-thermostat',
  'smart-door-lock-bluetooth',
  'motion-sensor-smart-switch',
];

(async () => {
  // First, check what products exist that are NOT in our list
  const allProds = await query(`SELECT id, name, slug FROM products ORDER BY slug;`);
  console.log('=== All products ===');
  console.log(JSON.stringify(allProds.data || allProds, null, 2));

  // Get product IDs that are NOT in our new list
  const slugList = NEW_PRODUCT_SLUGS.map(s => `'${s}'`).join(',');
  const toDelete = await query(`SELECT id, name, slug FROM products WHERE slug NOT IN (${slugList}) ORDER BY name;`);
  console.log('\n=== Products to delete ===');
  console.log(JSON.stringify(toDelete.data || toDelete, null, 2));

  if ((toDelete.data || toDelete).length > 0) {
    const ids = (toDelete.data || toDelete).map(p => `'${p.id}'`).join(',');
    await query(`DELETE FROM product_images WHERE product_id IN (${ids});`);
    await query(`DELETE FROM products WHERE id IN (${ids});`);
    console.log('\nDeleted old products.');
  }

  // Also delete product images for products without a product
  await query(`DELETE FROM product_images WHERE product_id NOT IN (SELECT id FROM products);`);

  // Verify
  const remaining = await query(`SELECT COUNT(*) as cnt FROM products;`);
  const remainingImgs = await query(`SELECT COUNT(*) as cnt FROM product_images;`);
  console.log(`\nRemaining products: ${remaining.data?.[0]?.cnt || 'N/A'}`);
  console.log(`Remaining images: ${remainingImgs.data?.[0]?.cnt || 'N/A'}`);
})();
