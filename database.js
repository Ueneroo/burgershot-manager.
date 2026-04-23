const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db('burgershot');
    console.log('✅ Connecté à MongoDB Atlas');
    
    // Créer les collections si elles n'existent pas
    const collections = ['users', 'products', 'sales', 'crafts', 'expenses'];
    for (const col of collections) {
      const exists = await db.listCollections({ name: col }).toArray();
      if (exists.length === 0) {
        await db.createCollection(col);
      }
    }
    
    // Ajouter produits par défaut si vide
    const productsCount = await db.collection('products').countDocuments();
    if (productsCount === 0) {
      await db.collection('products').insertMany([
        { name: 'Burger Shot', price: 12.50, category: 'Burgers', type: 'item' },
        { id: 2, name: 'Cheeseburger', price: 15.00, category: 'Burgers', type: 'item' },
        { id: 3, name: 'Double Burger', price: 18.50, category: 'Burgers', type: 'item' },
        { id: 4, name: 'Frites', price: 5.00, category: 'Accompagnements', type: 'item' },
        { id: 5, name: 'Boisson', price: 3.50, category: 'Boissons', type: 'item' },
        { id: 6, name: 'Menu Classique', price: 20.00, category: 'Menus', type: 'menu' },
        { id: 7, name: 'Menu Double', price: 25.00, category: 'Menus', type: 'menu' },
        { id: 8, name: 'Menu Famille', price: 45.00, category: 'Menus', type: 'menu' }
      ]);
    }
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error);
  }
}

module.exports = {
  connectDB,
  
  getProducts: async () => {
    return await db.collection('products').find().toArray();
  },
  
  addProduct: async (product) => {
    const result = await db.collection('products').insertOne(product);
    return { ...product, _id: result.insertedId };
  },
  
  updateProduct: async (id, data) => {
    await db.collection('products').updateOne(
      { _id: new ObjectId(id) },
      { $set: data }
    );
  },
  
  deleteProduct: async (id) => {
    await db.collection('products').deleteOne({ _id: new ObjectId(id) });
  },
  
  getSales: async () => {
    return await db.collection('sales').find().sort({ created_at: -1 }).toArray();
  },
  
  addSale: async (sale) => {
    const result = await db.collection('sales').insertOne(sale);
    return { ...sale, _id: result.insertedId };
  },
  
  getCrafts: async () => {
    return await db.collection('crafts').find().sort({ created_at: -1 }).toArray();
  },
  
  addCraft: async (craft) => {
    const result = await db.collection('crafts').insertOne(craft);
    return { ...craft, _id: result.insertedId };
  },
  
  getUsers: async () => {
    return await db.collection('users').find().toArray();
  },
  
  saveUser: async (user) => {
    await db.collection('users').updateOne(
      { discord_id: user.discord_id },
      { $set: user },
      { upsert: true }
    );
  }
};