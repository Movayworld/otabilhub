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
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Electrical product image URLs from Unsplash (stable, direct links)
const ELECTRICAL_IMAGES = {
  lighting: [
    'https://images.unsplash.com/photo-1508133188369-73e7a5b3e2b3?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1591949756370-f1f7c8b19776?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1593696379429-ea9f81a3f6d2?w=600&auto=format&fit=crop',
  ],
  'switches-sockets': [
    'https://images.unsplash.com/photo-1600194172437-899449a6c1f9?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1591993768434-5a2f1b3c5a78?w=600&auto=format&fit=crop',
  ],
  'circuit-breakers': [
    'https://images.unsplash.com/photo-1581092418235-789d34f6c6e9?w=600&auto=format&fit=crop',
  ],
};

// Use picsum.photos for deterministic images
function productImage(seed) {
  return `https://picsum.photos/seed/${seed}/400/400`;
}

function heroImage(seed) {
  return `https://picsum.photos/seed/${seed}/1200/800`;
}

const HOMEPAGE_IMAGE = 'https://images.unsplash.com/photo-1545198580-9e93e2e64f1d?w=1200&auto=format&fit=crop';

async function main() {
  // Step 1: Clean up test products first
  console.log('Deleting test products...');
  await query("DELETE FROM product_images WHERE product_id IN (SELECT id FROM products WHERE name LIKE 'PLAYWRIGHT TEST%' OR name LIKE 'Deep Work' OR name LIKE 'Atomic Habits' OR name LIKE 'The Lean Startup' OR name LIKE 'Clean Code' OR name LIKE 'Coffee Maker' OR name LIKE 'Running Shoes' OR name LIKE 'Protein Powder' OR name LIKE 'Face Cream' OR name LIKE 'Football' OR name LIKE 'Action Figure');");
  await query("DELETE FROM products WHERE name LIKE 'PLAYWRIGHT TEST%' OR name IN ('Deep Work','Atomic Habits','The Lean Startup','Clean Code','Coffee Maker','Running Shoes','Protein Powder','Face Cream','Football','Action Figure');");

  // Step 2: Update categories to electrical names
  console.log('Updating categories...');

  const categories = [
    { id: 'ac1475b0-4f45-4f35-986f-438651cb7f1b', name: 'Electronics', slug: 'electronics', display_mode: 'grid', order: 1 },
    { id: '5457a57a-3252-4a15-8a9d-f9e5414383ad', name: 'Switches & Sockets', slug: 'switches-sockets', display_mode: 'horizontal', order: 2 },
    { id: '8b521b96-ff5a-4ed5-9c6e-adf8551fc971', name: 'Lighting', slug: 'lighting', display_mode: 'grid', order: 3 },
    { id: 'ef97060a-f2f7-4a14-a4f5-b9771ee49f54', name: 'Circuit Breakers', slug: 'circuit-breakers', display_mode: 'horizontal', order: 4 },
    { id: '8dddbd00-6e5b-4aa2-8706-9678c0678ba8', name: 'Cables & Wires', slug: 'cables-wires', display_mode: 'grid', order: 5 },
    { id: '4b781e18-84cf-4d8e-9cf6-25430dc7daeb', name: 'Power Tools', slug: 'power-tools', display_mode: 'horizontal', order: 6 },
    { id: '9090ab65-e2e8-4e25-9797-c019e0509666', name: 'Batteries', slug: 'batteries', display_mode: 'grid', order: 7 },
    { id: '8e230e69-c36c-4313-bc8a-20b4bdd937c0', name: 'Fans & Ventilation', slug: 'fans-ventilation', display_mode: 'horizontal', order: 8 },
    { id: '6652b00b-8e51-43ea-9a3a-69a42f2ab348', name: 'UPS & Surge Protectors', slug: 'ups-surge-protectors', display_mode: 'grid', order: 9 },
    { id: '484cdcc4-0106-4bb3-92e6-6bfe73a02a67', name: 'Smart Home', slug: 'smart-home', display_mode: 'horizontal', order: 10 },
  ];

  for (const cat of categories) {
    await query(`UPDATE categories SET name='${cat.name}', slug='${cat.slug}', display_mode='${cat.display_mode}', display_order=${cat.order} WHERE id='${cat.id}';`);
    console.log(`  Updated: ${cat.name} (${cat.slug}) - ${cat.display_mode}`);
  }

  // Step 3: Create 30 electrical products (3 per category)
  console.log('Creating electrical products...');

  const products = [
    // Electronics (grid)
    { name: '50-inch 4K OLED Smart TV', slug: '50-oled-smart-tv', price: 899.99, compare: 1099.99, cat: categories[0].id, order: 1, desc: 'Premium 50-inch OLED 4K smart television with HDR10+ support and built-in streaming apps.' },
    { name: 'Wireless Bluetooth Earbuds Pro', slug: 'bluetooth-earbuds-pro', price: 149.99, compare: 199.99, cat: categories[0].id, order: 2, desc: 'Active noise-cancelling wireless earbuds with 24-hour battery life and charging case.' },
    { name: 'Gaming Laptop 15.6" RTX 4060', slug: 'gaming-laptop-rtx4060', price: 1499.99, compare: 1799.99, cat: categories[0].id, order: 3, desc: 'High-performance gaming laptop with NVIDIA RTX 4060, 16GB RAM, 1TB SSD, 144Hz display.' },

    // Switches & Sockets (horizontal)
    { name: '1-Gang Light Switch White', slug: '1-gang-light-switch-white', price: 12.99, compare: null, cat: categories[1].id, order: 1, desc: 'Standard single-pole white light switch, 15A 120V, UL listed for residential use.' },
    { name: 'USB Wall Outlet Charger', slug: 'usb-wall-outlet-charger', price: 24.99, compare: 34.99, cat: categories[1].id, order: 2, desc: 'Dual USB-A charging ports integrated into a standard duplex outlet, 2.4A total output.' },
    { name: 'Dimmer Switch for LED Lights', slug: 'led-dimmer-switch', price: 29.99, compare: null, cat: categories[1].id, order: 3, desc: 'Triac-based dimmer switch compatible with LED, CFL, and incandescent bulbs, 600W max.' },

    // Lighting (grid)
    { name: 'LED Recessed Downlight 6-inch', slug: 'led-recessed-downlight-6in', price: 25.99, compare: 35.99, cat: categories[2].id, order: 1, desc: 'Energy-efficient 6-inch LED recessed downlight, 9W, 3000K warm white, 650 lumens.' },
    { name: 'Smart LED Strip Light RGB', slug: 'smart-led-strip-rgb', price: 39.99, compare: 55.99, cat: categories[2].id, order: 2, desc: '16.4ft WiFi-enabled RGB LED strip with app control and music sync, compatible with Alexa and Google Assistant.' },
    { name: 'Industrial Pendant Light', slug: 'industrial-pendant-light', price: 79.99, compare: 99.99, cat: categories[2].id, order: 3, desc: 'Matte black industrial pendant light with adjustable cord, E26 medium base socket.' },

    // Circuit Breakers (horizontal)
    { name: '20A Single-Pole Circuit Breaker', slug: '20a-circuit-breaker', price: 18.99, compare: null, cat: categories[3].id, order: 1, desc: '20A single-pole thermal-magnetic circuit breaker, 1-inch per pole, UL listed.' },
    { name: '40A Double-Pole Circuit Breaker', slug: '40a-double-pole-breaker', price: 34.99, compare: 44.99, cat: categories[3].id, order: 2, desc: '40A double-pole circuit breaker for 240V appliances, 2-inch per pole, 10kAIC rating.' },
    { name: 'Surge Protector Panel Mount', slug: 'surge-protector-panel-mount', price: 49.99, compare: 64.99, cat: categories[3].id, order: 3, desc: 'Whole-house surge protector panel, 120/240V, 100kA surge capacity, LED status indicator.' },

    // Cables & Wires (grid)
    { name: '12/2 NM-B Electrical Cable 250ft', slug: '12-2-nm-cable-250ft', price: 159.99, compare: 199.99, cat: categories[4].id, order: 1, desc: '12/2 non-metallic sheathed cable, 250 feet, 600V, 90C rated, CU conductors.' },
    { name: '14/2 NM-B Electrical Cable 125ft', slug: '14-2-nm-cable-125ft', price: 89.99, compare: 109.99, cat: categories[4].id, order: 2, desc: '14/2 non-metallic sheathed cable, 125 feet, 600V, 90C rated, CU conductors.' },
    { name: 'THHN Wire 12 AWG Black 500ft', slug: 'thhn-wire-12-awg-500ft', price: 129.99, compare: null, cat: categories[4].id, order: 3, desc: '12 AWG THHN/THWN-2 copper wire, 500 feet, black, 600V, 90C, sunlight resistant.' },

    // Power Tools (horizontal)
    { name: 'Cordless Drill Driver 20V', slug: 'cordless-drill-driver-20v', price: 99.99, compare: 129.99, cat: categories[5].id, order: 1, desc: '20V MAX lithium-ion cordless drill driver with 1-hour fast charger and 2 batteries.' },
    { name: 'Orbital Sander 5-inch', slug: 'orbital-sander-5in', price: 64.99, compare: 79.99, cat: categories[5].id, order: 2, desc: '5-inch random orbit sander with variable speed, 3.0 AMP motor, dust-sealed bearings.' },
    { name: 'Circular Saw 15A', slug: 'circular-saw-15a', price: 119.99, compare: 149.99, cat: categories[5].id, order: 3, desc: '15A circular saw with 6.5-inch blade, 0-50 degree bevel capacity, laser guide system.' },

    // Batteries (grid)
    { name: 'AA Alkaline Batteries 48-Pack', slug: 'aa-alkaline-batteries-48-pack', price: 24.99, compare: null, cat: categories[6].id, order: 1, desc: '2800mAh alkaline AA batteries, 48-pack, leak-proof, 10-year shelf life.' },
    { name: '9V Alkaline Batteries 12-Pack', slug: '9v-alkaline-batteries-12-pack', price: 19.99, compare: null, cat: categories[6].id, order: 2, desc: '9V alkaline batteries, 12-pack, premium grade, compatible with smoke detectors and guitars.' },
    { name: 'Li-ion 18650 Battery 3000mAh', slug: 'li-ion-18650-3000mah', price: 14.99, compare: 19.99, cat: categories[6].id, order: 3, desc: 'Rechargeable 18650 lithium-ion battery, 3000mAh, 3.7V, 500+ charge cycles.' },

    // Fans & Ventilation (horizontal)
    { name: '16-inch Pedestal Fan', slug: '16-inch-pedestal-fan', price: 79.99, compare: 99.99, cat: categories[7].id, order: 1, desc: '16-inch quiet pedestal fan with 3-speed settings, tilt-adjustable head, 180° oscillation.' },
    { name: '8-inch Desk Fan', slug: '8-inch-desk-fan', price: 34.99, compare: 44.99, cat: categories[7].id, order: 2, desc: 'Compact 8-inch desk fan with USB-powered operation, 3-speed controls, 60° tilt.' },
    { name: 'Range Hood 30-inch Stainless', slug: 'range-hood-30-stainless', price: 249.99, compare: 299.99, cat: categories[7].id, order: 3, desc: '30-inch wall-mounted range hood, stainless steel, 300 CFM, tempered glass front panel.' },

    // UPS & Surge Protectors (grid)
    { name: '1500VA UPS Battery Backup', slug: '1500va-ups-battery-backup', price: 189.99, compare: 229.99, cat: categories[8].id, order: 1, desc: '5-outlet 1500VA/900W UPS with LCD display, 4 USB charging ports, automatic voltage regulation.' },
    { name: '12-Outlet Surge Protector', slug: '12-outlet-surge-protector', price: 49.99, compare: 64.99, cat: categories[8].id, order: 2, desc: '12-outlet surge protector with 4320 joules, 2 USB ports, LED indicator, right-angle plug.' },
    { name: '6-Outlet Surge Protector 15ft', slug: '6-outlet-surge-15ft', price: 29.99, compare: 39.99, cat: categories[8].id, order: 3, desc: '6-outlet surge protector with 15-foot extension cord, 1575 joules, resettable circuit breaker.' },

    // Smart Home (horizontal)
    { name: 'Wi-Fi Smart Thermostat', slug: 'wifi-smart-thermostat', price: 159.99, compare: 189.99, cat: categories[9].id, order: 1, desc: 'Smart thermostat with app control, energy usage reports, geofencing, and Alexa integration.' },
    { name: 'Smart Door Lock Bluetooth', slug: 'smart-door-lock-bluetooth', price: 199.99, compare: 249.99, cat: categories[9].id, order: 2, desc: 'Keyless entry smart lock with Bluetooth and app control, auto-lock feature, fingerprint resistant.' },
    { name: 'Motion Sensor Smart Light Switch', slug: 'motion-sensor-smart-switch', price: 39.99, compare: 49.99, cat: categories[9].id, order: 3, desc: 'Wi-Fi motion sensor switch compatible with neutral wire, works with Alexa and Google Assistant.' },
  ];

  for (const prod of products) {
    const productId = require('crypto').randomUUID();
    const imageSeed = prod.slug;
    const imageUrl = productImage(imageSeed);
    const imageAlt = `${prod.name} - front view`;

    // Insert product
    const nameEscaped = prod.name.split("'").join("''");
    const descEscaped = prod.desc.split("'").join("''");
    const descShortEscaped = prod.desc.substring(0, 100).split("'").join("''");
    const imageAltEscaped = imageAlt.split("'").join("''");
    const productInsert = `INSERT INTO products (id, name, slug, description, short_description, price, compare_at_price, stock_quantity, is_available, is_featured, is_published, category_id, homepage_section, card_layout, homepage_order, specifications) VALUES ('${productId}', '${nameEscaped}', '${prod.slug}', '${descEscaped}', '${descShortEscaped}', '${prod.price}', ${prod.compare ? "'" + prod.compare + "'" : 'NULL'}, 50, true, true, true, '${prod.cat}', 'all', 'standard', ${prod.order}, '{}');`;
    await query(productInsert);

    // Insert image for product
    const imageInsert = `INSERT INTO product_images (product_id, image_url, alt_text, position, is_primary) VALUES ('${productId}', '${imageUrl}', '${imageAltEscaped}', 0, true);`;
    await query(imageInsert);

    const featuredFlag = prod.compare ? ` (Save $${prod.compare - prod.price})` : '';
    console.log(`  Created: ${prod.name} - $${prod.price}${featuredFlag}`);
  }

  // Step 4: Update hero config
  console.log('Updating hero config...');
  const heroImage = HOMEPAGE_IMAGE;
  await query(`UPDATE hero_configs SET heading='Premium Electrical Solutions', subheading='Quality electrical appliances, lighting, and smart technology for modern homes and businesses.', image_url='${heroImage}', image_alt='Electrical equipment and appliances' WHERE is_active=true;`);
  console.log('  Hero updated');

  // Step 5: Verify
  console.log('\n=== VERIFICATION ===');
  const catCount = await query('SELECT COUNT(*) as cnt FROM categories WHERE is_active=true;');
  const prodCount = await query('SELECT COUNT(*) as cnt FROM products WHERE is_published=true;');
  const imageCount = await query('SELECT COUNT(*) as cnt FROM product_images;');
  console.log(`Active categories: ${catCount.data[0].cnt}`);
  console.log(`Published products: ${prodCount.data[0].cnt}`);
  console.log(`Product images: ${imageCount.data[0].cnt}`);

  console.log('\nDone!');
}

main().catch(console.error);
