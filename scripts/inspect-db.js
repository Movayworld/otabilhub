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

(async () => {
  console.log('=== CATEGORIES ===');
  const cats = await query('SELECT id, name, slug, description, is_active, display_order, display_mode FROM categories ORDER BY display_order, name;');
  console.log(JSON.stringify(cats, null, 2));

  console.log('\n=== PRODUCTS (first 20) ===');
  const prods = await query('SELECT id, name, slug, price, compare_at_price, category_id, is_published, is_available, is_featured, homepage_section, card_layout, homepage_order FROM products ORDER BY created_at DESC LIMIT 20;');
  console.log(JSON.stringify(prods, null, 2));

  console.log('\n=== PRODUCT COUNT BY CATEGORY ===');
  const cnts = await query('SELECT c.name, c.slug, COUNT(p.id) as cnt FROM products p RIGHT JOIN categories c ON p.category_id = c.id GROUP BY c.id, c.name, c.slug ORDER BY c.name;');
  console.log(JSON.stringify(cnts, null, 2));

  console.log('\n=== HERO CONFIGS ===');
  const heroes = await query('SELECT id, is_active, heading, subheading, image_url, image_alt FROM hero_configs ORDER BY created_at DESC LIMIT 5;');
  console.log(JSON.stringify(heroes, null, 2));
})();
