import React, { useState, useEffect } from 'react';
import { Utensils, Plus, Package } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5000';

function Kitchen({ user }) {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products`, {
        headers: { 'x-discord-id': user.discordId }
      });
      setProducts(response.data.filter(p => p.type === 'item'));
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleCraft = async () => {
    if (!selectedProduct || quantity < 1) return;

    try {
      await axios.post(`${API_URL}/api/crafts`, {
        product_id: parseInt(selectedProduct),
        quantity: parseInt(quantity)
      }, {
        headers: { 'x-discord-id': user.discordId }
      });

      showNotification(`Craft enregistré: ${quantity}x produit(s) 🍔`);
      setQuantity(1);
      setSelectedProduct('');
    } catch (error) {
      console.error('Error saving craft:', error);
      showNotification('Erreur lors de l\'enregistrement', 'error');
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="fade-in">
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="header">
        <div>
          <h2>Cuisine</h2>
          <p>Enregistrez la production</p>
        </div>
      </div>

      <div className="form-container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <div className="form-group">
              <label>Produit fabriqué</label>
              <select 
                value={selectedProduct} 
                onChange={(e) => setSelectedProduct(e.target.value)}
              >
                <option value="">Sélectionner un produit</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} - {product.category}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Quantité</label>
              <input 
                type="number" 
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            <button 
              onClick={handleCraft}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1rem' }}
            >
              <Plus size={18} />
              Enregistrer la production
            </button>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '1rem' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Package size={20} />
              Produits disponibles
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {products.map(product => (
                <div 
                  key={product.id}
                  style={{ 
                    padding: '1rem', 
                    background: 'var(--bg-secondary)', 
                    borderRadius: '0.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{product.name}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {product.category}
                    </div>
                  </div>
                  <div style={{ color: 'var(--accent-yellow)', fontWeight: 600 }}>
                    ${product.price}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Kitchen;