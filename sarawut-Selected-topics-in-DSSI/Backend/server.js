const express = require('express');
const axios = require('axios');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const { Pool } = require('pg');           
const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.APP_PORT || 20651;
const LINE_BOT_API = 'https://api.line.me/v2/bot';
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;


const pool = new Pool({
  host: process.env.PGHOST || '202.28.49.122',
  port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,

});

pool.connect()
  .then(() => console.log('✅ Connected to PostgreSQL'))
  .catch(err => console.error('❌ PostgreSQL connection error:', err.message));


function getDeliveryLabel(method) {
  return method === 'pickup'
    ? 'มารับเองที่ร้าน'
    : method === 'delivery'
    ? 'ให้ร้านจัดส่ง'
    : 'ไม่ระบุ';
}


async function generateChartBase64(labels, data) {
  return null; // ใส่การสร้างกราฟจริงภายหลัง
}

app.get('/admin/statistics/revenue', async (req, res) => {
  const { start, end } = req.query;

  const values = [];
  let dateCondition = '';

  if (start && end) {
    dateCondition = `AND DATE(o.order_date) BETWEEN $1 AND $2`;
    values.push(start, end);
  }

  const sql = `
    SELECT oi.product_name, SUM(oi.price * oi.quantity) AS total_price
    FROM orders o
    JOIN order_items oi ON o.order_id = oi.order_id
    JOIN payments p ON o.order_id = p.order_id
    WHERE p.payment_status = 'จ่ายแล้ว' ${dateCondition}
    GROUP BY oi.product_name
  `;

  try {
    const { rows } = await pool.query(sql, values);
    const labels = rows.map(r => r.product_name);
    const vals = rows.map(r => Number(r.total_price));
    const totalRevenue = vals.reduce((a, b) => a + b, 0);
    res.json({ labels, values: vals, totalRevenue });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/admin/users', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT line_user_id, display_name FROM users`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/admin/statistics/:userId', async (req, res) => {
  const userId = req.params.userId;
  const start = req.query.start;
  const end = req.query.end;

  const params = [userId];
  let dateCondition = '';

  if (start && end) {
    dateCondition = 'AND DATE(o.order_date) BETWEEN $2 AND $3';
    params.push(start, end);
  }

  const sql = `
    SELECT oi.product_name, SUM(oi.quantity) AS total_quantity
    FROM orders o
    JOIN order_items oi ON o.order_id = oi.order_id
    JOIN payments p ON o.order_id = p.order_id
    WHERE o.user_id = $1
      AND p.payment_status = 'จ่ายแล้ว'
      ${dateCondition}
    GROUP BY oi.product_name
  `;

  try {
    const { rows } = await pool.query(sql, params);
    const labels = rows.map(r => r.product_name);
    const data = rows.map(r => Number(r.total_quantity));
    res.json({ labels, data });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/userorders/statistics', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const accessToken = authHeader.split(' ')[1];

  try {
    const { data: profile } = await axios.get('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const userId = profile.userId;

    const sql = `
      SELECT oi.product_name, SUM(oi.quantity) AS total_quantity
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.user_id = $1
      GROUP BY oi.product_name
    `;
    const { rows } = await pool.query(sql, [userId]);
    if (rows.length === 0) return res.json({ base64: null });

    const labels = rows.map(r => r.product_name);
    const data = rows.map(r => Number(r.total_quantity));
    const base64Chart = await generateChartBase64(labels, data);

    res.json({ base64: base64Chart });
  } catch (err) {
    console.error('❌ Token verification or DB error:', err.message);
    res.status(403).json({ error: 'Invalid token' });
  }
});

app.post('/payments', async (req, res) => {
  const { order_id, payment_status, payment_method, payment_date, amount } = req.body;
  const sql = `
    INSERT INTO payments (order_id, payment_status, payment_method, payment_date, amount)
    VALUES ($1, $2, $3, $4, $5)
  `;
  try {
    await pool.query(sql, [order_id, payment_status, payment_method, payment_date, amount]);
    res.json({ success: true, message: 'บันทึกการชำระเงินสำเร็จ' });
  } catch (err) {
    console.error('Error inserting payment:', err);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

app.put('/orders/:orderId/delivery', async (req, res) => {
  const { user_id, customer_name, delivery_status, delivery_eta } = req.body;
  const orderId = req.params.orderId;
  if (!user_id || !customer_name || !delivery_status || !delivery_eta) {
    return res.status(400).json({ error: 'ข้อมูลไม่ครบ' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'UPDATE orders SET delivery_status = $1, delivery_eta = $2 WHERE order_id = $3',
      [delivery_status, delivery_eta, orderId]
    );
    await client.query('COMMIT');

    const message = {
      to: user_id,
      messages: [{
        type: 'text',
        text: `📦 คำสั่งซื้อของคุณ (หมายเลข: ${orderId})\n🚚 สถานะ: ${delivery_status}\n🕒 จะถึงภายใน: ${delivery_eta} นาที`
      }]
    };

    await axios.post('https://api.line.me/v2/bot/message/push', message, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      }
    });

    res.json({ success: true, message: 'อัปเดตและส่งแจ้งเตือนสำเร็จแล้ว' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('อัปเดตหรือส่งแจ้งเตือนล้มเหลว:', err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

app.get('/orders', async (req, res) => {
  // MySQL: GROUP_CONCAT + CONCAT → Postgres: string_agg + format
  const sql = `
    SELECT 
      o.order_id,
      p.payment_status,
      o.customer_name,
      o.phone,
      o.address,
      o.order_date,
      o.total_price,
      o.user_id,
      string_agg(
        format('%s|%s|%s|%s|%s', oi.product_id, oi.product_name, oi.price, oi.quantity, oi.subtotal),
        ';'
      ) AS items
    FROM orders o
    LEFT JOIN payments p ON o.order_id = p.order_id
    JOIN order_items oi ON o.order_id = oi.order_id
    GROUP BY o.order_id, p.payment_status
    ORDER BY o.order_date DESC
  `;
  try {
    const { rows } = await pool.query(sql);
    const results = rows.map(order => ({
      ...order,
      items: order.items
        ? order.items.split(';').map(i => {
            const [product_id, product_name, price, quantity, subtotal] = i.split('|');
            return {
              product_id: Number(product_id),
              product_name,
              price: Number(price),
              quantity: Number(quantity),
              subtotal: Number(subtotal),
            };
          })
        : []
    }));
    res.json(results);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).send('Database error');
  }
});

app.get('/userorders', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  const accessToken = authHeader.split(' ')[1];

  try {
    const { data: userProfile } = await axios.get('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const userId = userProfile.userId;

    const sql = `
      SELECT 
        o.order_id,
        p.payment_status,
        o.customer_name,
        o.phone,
        o.address,
        o.order_date,
        o.total_price,
        string_agg(
          format('%s|%s|%s|%s|%s', oi.product_id, oi.product_name, oi.price, oi.quantity, oi.subtotal),
          ';'
        ) AS items
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      LEFT JOIN payments p ON o.order_id = p.order_id
      WHERE o.user_id = $1
      GROUP BY o.order_id, p.payment_status
      ORDER BY o.order_date DESC
    `;
    const { rows } = await pool.query(sql, [userId]);

    const formatted = rows.map(order => ({
      ...order,
      items: order.items
        ? order.items.split(';').map(i => {
            const [product_id, product_name, price, quantity, subtotal] = i.split('|');
            return {
              product_id: Number(product_id),
              product_name,
              price: Number(price),
              quantity: Number(quantity),
              subtotal: Number(subtotal),
            };
          })
        : [],
    }));

    res.json(formatted);
  } catch (err) {
    console.error('❌ Token verification failed:', err.response?.data || err.message);
    res.status(403).json({ error: 'Invalid or expired token' });
  }
});

app.get('/products', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM products');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/products', async (req, res) => {
  const { product_name, price, quantity, image_url } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO products (product_name, price, quantity, image_url)
       VALUES ($1,$2,$3,$4) RETURNING product_id, product_name, price, quantity, image_url`,
      [product_name, price, quantity, image_url]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/products/:id', async (req, res) => {
  const { product_name, price, quantity, image_url } = req.body;
  try {
    await pool.query(
      `UPDATE products SET product_name=$1, price=$2, quantity=$3, image_url=$4 WHERE product_id=$5`,
      [product_name, price, quantity, image_url, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/products/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM products WHERE product_id=$1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/orders', async (req, res) => {
  const { user_id, customer_name, phone, address, items, total_price, delivery_method } = req.body;
  if (!user_id || !customer_name || !phone || !address || !items || items.length === 0) {
    return res.status(400).json({ message: 'ข้อมูลไม่ครบถ้วน' });
  }
  for (const item of items) {
    if (item.subtotal === undefined || item.subtotal === null) {
      return res.status(400).json({ message: 'subtotal ไม่ถูกต้อง' });
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const insertOrder = `
      INSERT INTO orders (user_id, customer_name, phone, address, total_price, delivery_method)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING order_id
    `;
    const { rows } = await client.query(insertOrder, [
      user_id, customer_name, phone, address, total_price, delivery_method
    ]);
    const orderId = rows[0].order_id;

    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, price, quantity, subtotal)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [orderId, item.product_id, item.product_name, item.price, item.quantity, item.subtotal]
      );
      await client.query(
        `UPDATE products SET quantity = quantity - $1 WHERE product_id = $2`,
        [item.quantity, item.product_id]
      );
    }

    await client.query('COMMIT');

    // ส่ง LINE
    const message =
`รายละเอียดออเดอร์ที่สั่ง
🧑 ชื่อลูกค้า: ${customer_name}
📞 เบอร์โทร: ${phone}
🏠 ที่อยู่: ${address}
📦 รหัสคำสั่งซื้อ: ${orderId}
🚚 วิธีรับสินค้า: ${getDeliveryLabel(delivery_method)}
💰 ยอดรวม: ฿${total_price}

🛍️ รายการสินค้า:
${items.map(i => `- ${i.product_name} x ${i.quantity} กิโลกรัม`).join('\n')}

🙏 ขอบคุณที่สั่งซื้อกับเรา`;

    if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
      console.error('🚫 LINE_CHANNEL_ACCESS_TOKEN ไม่ถูกต้องหรือไม่ได้ตั้งค่า');
    } else {
      await axios.post('https://api.line.me/v2/bot/message/push', {
        to: user_id,
        messages: [{ type: 'text', text: message }]
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'คำสั่งซื้อสำเร็จ',
      orderId,
      total_price,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Transaction error:', err.message);
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
});

app.post('/update-profile', async (req, res) => {
  const { displayName, address, phone } = req.body;
  try {
    await pool.query(
      `UPDATE users SET address=$1, phone=$2 WHERE display_name=$3`,
      [address, phone, displayName]
    );
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    console.error('DB Error:', err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

app.get('/get-user/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const { rows } = await pool.query(`SELECT * FROM users WHERE line_user_id = $1`, [userId]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('❌ Database Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/verify-access-token', async (req, res) => {
  const { accessToken, userId, displayName, pictureUrl, statusMessage } = req.body;
  if (!accessToken) return res.status(400).json({ success: false, error: 'Access Token is required' });

  try {
    const { data } = await axios.get('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    // อ่าน role ปัจจุบัน (ถ้ามี)
    const roleQuery = await pool.query(`SELECT role FROM users WHERE line_user_id = $1`, [userId]);
    let role = roleQuery.rows[0]?.role || 'user';

    // Upsert ด้วย ON CONFLICT (ต้องมี unique ที่ line_user_id)
    await pool.query(
      `INSERT INTO users (line_user_id, display_name, picture_url, status_message, role)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (line_user_id)
       DO UPDATE SET
         display_name = EXCLUDED.display_name,
         picture_url = EXCLUDED.picture_url,
         status_message = EXCLUDED.status_message,
         role = EXCLUDED.role`,
      [userId, displayName, pictureUrl, statusMessage, role]
    );

    res.json({ success: true, message: 'User saved successfully', role });
  } catch (err) {
    console.error('❌ Error verifying or saving user:', err.response?.data || err.message);
    res.status(401).json({ success: false, error: 'Invalid Access Token or DB Error' });
  }
});

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
};

const sendMessage = async (userId, message, flexMessage) => {
  const messages = [];
  if (message && typeof message === 'string' && message.trim() !== '') {
    messages.push({ type: 'text', text: message.trim() });
  }
  if (flexMessage && flexMessage.type === 'flex' && flexMessage.contents) {
    messages.push(flexMessage);
  }
  if (messages.length === 0) throw new Error('❌ ไม่มีข้อความที่จะส่ง');

  const body = { to: userId, messages };
  const response = await axios.post('https://api.line.me/v2/bot/message/push', body, {
    headers: {
      'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
  return response;
};

app.post('/send-message', async (req, res) => {
  try {
    const { userId, message } = req.body;
    const response = await sendMessage(userId, message);
    res.json({ message: 'Send message success', responseData: response.data });
  } catch (error) {
    console.log('error', error.response?.data || error.message);
    res.status(500).json({ error: 'ส่งข้อความไม่สำเร็จ' });
  }
});

// หมายเหตุ: ส่วนอัปโหลดรูปเดิมใช้ req.files แต่ไม่ได้เปิด middleware
// หากต้องใช้จริงให้ติดตั้งและเปิดใช้งาน express-fileupload:
// const fileUpload = require('express-fileupload');
// app.use(fileUpload());
// แล้วจึงใช้โค้ดอัปโหลดตามเดิม

app.post('/send-promotion', async (req, res) => {
  const { targetUserId, productName, description, link, imageUrl } = req.body;
  if (!productName || !link || !imageUrl) {
    return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  const flex = {
    type: 'flex',
    altText: `📢 โปรโมชันใหม่: ${productName}`,
    contents: {
      type: 'bubble',
      hero: { type: 'image', url: imageUrl, size: 'full', aspectRatio: '20:13', aspectMode: 'cover' },
      body: {
        type: 'box', layout: 'vertical',
        contents: [
          { type: 'text', text: productName, weight: 'bold', size: 'lg', wrap: true },
          { type: 'text', text: description || '', size: 'sm', wrap: true }
        ]
      },
      footer: {
        type: 'box', layout: 'vertical',
        contents: [{
          type: 'button', style: 'primary', color: '#f97316',
          action: { type: 'uri', label: '🛒 สั่งซื้อเลย', uri: link }
        }]
      }
    }
  };

  try {
    if (targetUserId === 'all') {
      const { rows } = await pool.query('SELECT line_user_id FROM users');
      await Promise.all(rows.map(u =>
        axios.post('https://api.line.me/v2/bot/message/push',
          { to: u.line_user_id, messages: [flex] },
          { headers: { Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`, 'Content-Type': 'application/json' } }
        )
      ));
      res.json({ success: true, message: `✅ ส่งให้ทั้งหมด ${rows.length} คน` });
    } else {
      await axios.post('https://api.line.me/v2/bot/message/push',
        { to: targetUserId, messages: [flex] },
        { headers: { Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`, 'Content-Type': 'application/json' } }
      );
      res.json({ success: true, message: '✅ ส่งโปรโมชันสำเร็จ' });
    }
  } catch (err) {
    console.error('❌ LINE API Error:', err.response?.data || err.message);
    res.status(500).json({ error: '❌ ส่งข้อความไม่สำเร็จ' });
  }
});

app.post('/webhook', async (req, res) => {
  const { events } = req.body || {};
  if (!events || events.length <= 0) return res.json({ message: 'OK' });

  try {
    const lineEvent = events[0];
    const userId = lineEvent.source.userId;
    const richMenuId = process.env.DEFAULT_MEMBER_RICH_MENU;

    if (lineEvent.message?.text === 'สมัครสมาชิก') {
      await axios.post(`${LINE_BOT_API}/user/${userId}/richmenu/${richMenuId}`, {}, { headers });
      await sendMessage(userId, 'ยินดีด้วยสมาชิกใหม่');
    }
    res.json({ message: 'Send message success' });
  } catch (error) {
    console.log('error', error.response?.data || error.message);
    res.status(500).json({ error: 'Webhook error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Express running in ${process.env.NODE_ENV || 'development'} mode at http://0.0.0.0:${PORT}`);
});
