const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { ObjectId } = require('mongodb');
require('dotenv').config();

const { connectDB } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// ADMIN IDs (séparés par virgules dans .env)
const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',') : [];

// Middleware Auth simple
const authMiddleware = (req, res, next) => {
  const discordId = req.headers['x-discord-id'];
  if (!discordId) return res.status(401).json({ error: 'Unauthorized' });
  req.user = { discordId };
  next();
};

// --- ROUTES AUTH DISCORD ---
app.get('/auth/discord', (req, res) => {
  const url = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.DISCORD_REDIRECT_URI)}&response_type=code&scope=identify`;
  res.json({ url });
});

// Route de callback Discord
app.get('/auth/discord/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ error: 'Code d\'autorisation manquant' });
    }

    const tokenResponse = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI
      }),
      {
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded' 
        }
      }
    );

    const accessToken = tokenResponse.data.access_token;

    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: { 
        Authorization: `Bearer ${accessToken}` 
      }
    });

    const userData = userResponse.data;
    const discordId = userData.id;
    const username = userData.username;
    const avatar = userData.avatar;
    
    const isAdminUser = ADMIN_IDS.includes(discordId);

    // Sauvegarder via la base MongoDB
    const db = require('./database');
    await db.saveUser({
      discord_id: discordId,
      username: username,
      avatar: avatar,
      is_admin: isAdminUser ? 1 : 0
    });

    const frontendUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?discord_id=${discordId}&username=${encodeURIComponent(username)}&avatar=${encodeURIComponent(avatar || '')}&is_admin=${isAdminUser ? 'true' : 'false'}`;
    
    res.redirect(frontendUrl);
    
  } catch (error) {
    console.error('Erreur d\'authentification Discord:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Échec de l\'authentification',
      details: error.message 
    });
  }
});

// --- ROUTES PRODUITS ---
app.get('/api/products', authMiddleware, async (req, res) => {
  try {
    const db = require('./database');
    const products = await db.getProducts();
    // Convertir _id en id pour le frontend
    const formatted = products.map(p => ({ ...p, id: p._id.toString() }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products', authMiddleware, async (req, res) => {
  try {
    const db = require('./database');
    const product = await db.addProduct(req.body);
    res.json({ ...product, id: product._id.toString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/products/:id', authMiddleware, async (req, res) => {
  try {
    const db = require('./database');
    await db.updateProduct(req.params.id, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/products/:id', authMiddleware, async (req, res) => {
  try {
    const db = require('./database');
    await db.deleteProduct(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ROUTES VENTES ---
app.get('/api/sales', authMiddleware, async (req, res) => {
  try {
    const db = require('./database');
    let sales = await db.getSales();
    if (req.query.userId) sales = sales.filter(s => s.user_id === req.query.userId);
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sales', authMiddleware, async (req, res) => {
  try {
    const db = require('./database');
    const sale = await db.addSale({
      user_id: req.user.discordId,
      items: JSON.stringify(req.body.items),
      total: req.body.total,
      created_at: new Date().toISOString()
    });
    res.json({ id: sale._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ROUTES CRAFTS ---
app.get('/api/crafts', authMiddleware, async (req, res) => {
  try {
    const db = require('./database');
    let crafts = await db.getCrafts();
    if (req.query.userId) crafts = crafts.filter(c => c.user_id === req.query.userId);
    
    const products = await db.getProducts();
    const result = crafts.map(c => {
      const product = products.find(p => p._id.toString() === c.product_id.toString());
      return { ...c, product_name: product ? product.name : 'Inconnu', id: c._id.toString() };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/crafts', authMiddleware, async (req, res) => {
  try {
    const db = require('./database');
    const craft = await db.addCraft({
      user_id: req.user.discordId,
      product_id: req.body.product_id,
      quantity: req.body.quantity,
      created_at: new Date().toISOString()
    });
    res.json({ id: craft._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- STATS DASHBOARD ---
app.get('/api/stats/dashboard', authMiddleware, async (req, res) => {
  try {
    const userId = req.query.userId || req.user.discordId;
    const days = parseInt(req.query.days) || 7;
    
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const db = require('./database');
    const allSales = await db.getSales();
    const userSales = allSales.filter(s => s.user_id === userId && new Date(s.created_at) >= cutoff);

    const totalRevenue = userSales.reduce((sum, s) => sum + s.total, 0);
    const salary = (totalRevenue * 0.05) + (userSales.length * 2);

    const evolution = [];
    for(let i = days - 1; i >= 0; i--) {
       const d = new Date();
       d.setDate(d.getDate() - i);
       const dateStr = d.toISOString().split('T')[0];
       const daySales = userSales.filter(s => s.created_at.startsWith(dateStr));
       evolution.push({
         date: dateStr,
         count: daySales.length,
         revenue: daySales.reduce((s, sale) => s + sale.total, 0)
       });
    }

    res.json({
      totalSales: userSales.length,
      totalRevenue,
      averageCart: userSales.length ? totalRevenue / userSales.length : 0,
      salary,
      evolution
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- STATS FINANCIÈRES (ADMIN UNIQUEMENT) ---
app.get('/api/stats/financial', authMiddleware, async (req, res) => {
  try {
    const db = require('./database');
    const users = await db.getUsers();
    const user = users.find(u => u.discord_id === req.user.discordId);
    
    if (!user || !user.is_admin) {
      return res.status(403).json({ error: 'Accès refusé - Admin uniquement' });
    }

    const days = parseInt(req.query.days) || 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const allSales = await db.getSales();
    const filteredSales = allSales.filter(s => new Date(s.created_at) >= cutoff);

    const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
    const totalExpenses = 0;
    const totalSalaries = totalRevenue * 0.10;
    const netProfit = totalRevenue - totalExpenses - totalSalaries;

    const revenueEvolution = [];
    for(let i = days - 1; i >= 0; i--) {
       const d = new Date();
       d.setDate(d.getDate() - i);
       const dateStr = d.toISOString().split('T')[0];
       const daySales = filteredSales.filter(s => s.created_at.startsWith(dateStr));
       revenueEvolution.push({
         date: dateStr,
         revenue: daySales.reduce((s, sale) => s + sale.total, 0)
       });
    }

    res.json({
      totalRevenue,
      totalExpenses,
      totalSalaries,
      netProfit,
      revenueEvolution
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ROUTE UTILISATEURS ---
app.get('/api/users', authMiddleware, async (req, res) => {
  try {
    const db = require('./database');
    const users = await db.getUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🍔 BurgerShot Backend running on port ${PORT}`);
  console.log(`📝 Admin IDs configurés: ${ADMIN_IDS.join(', ') || 'Aucun'}`);
  connectDB(); // Connexion à MongoDB
});