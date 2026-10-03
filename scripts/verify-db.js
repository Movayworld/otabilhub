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
  const cats = await query('SELECT name, slug, display_mode, display_order FROM categories WHERE is_active=true ORDER BY display_order;');
  console.log('=== Categories ===');
  console.log(JSON.stringify(cats.data || cats, null, 2));

  const prods = await query('SELECT name, slug, price, compare_at_price, cat_name FROM (SELECT p.name, p.slug, p.price, p.compare_at_price, c.name as cat_name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.is_published=true AND p.is_available=true ORDER BY c.display_order, p.homepage_order, p.created_at DESC) sub;');
  console.log('\n=== Products ===');
  console.log(JSON.stringify(prods.data || prods, null, 2));

  const hero = await query('SELECT heading, subheading, image_url, image_alt FROM hero_configs WHERE is_active=true;');
  console.log('\n=== Hero ===');
  console.log(JSON.stringify(hero.data || hero, null, 2));
})();
