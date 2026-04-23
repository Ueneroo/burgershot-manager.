import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Trash2, Save } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5000';

function CashRegister({ user }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products`, {
        headers: { 'x-discord-id': user.discordId }
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const addToCart = (product) => {
    setCart([...cart, { ...product, cartId: Date.now() }]);
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  const handleSale = async () => {
    if (cart.length === 0) return;

    try {
      await axios.post(`${API_URL}/api/sales`, {
        items: cart.map(item => ({ name: item.name, price: item.price })),
        total: total
      }, {
        headers: { 'x-discord-id': user.discordId }
      });

      showNotification('Vente enregistrée avec succès! 🎉');
      setCart([]);
    } catch (error) {
      console.error('Error saving sale:', error);
      showNotification('Erreur lors de l\'enregistrement', 'error');
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const categories = ['all', ...new Set(products.map(p => p.category))];
  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
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
          <h2>Caisse Enregistreuse</h2>
          <p>Enregistrez une nouvelle vente</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div>
          <div className="form-container">
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Catégorie
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`btn ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {cat === 'all' ? 'Tous' : cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="product-grid">
              {filteredProducts.map(product => (
                <div 
                  key={product.id} 
                  className="product-item"
                  onClick={() => addToCart(product)}
                >
                  <h4>{product.name}</h4>
                  <div className="price">{formatCurrency(product.price)}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    {product.type === 'menu' ? '📦 Menu' : '🍔 Produit'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="cart-summary">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingCart size={20} />
              Panier ({cart.length})
            </h3>
            
            {cart.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                Panier vide
              </p>
            ) : (
              <>
                {cart.map((item, index) => (
                  <div key={item.cartId} className="cart-item">
                    <div>
                      <div style={{ fontWeight: 500 }}>{item.name}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {formatCurrency(item.price)}
                      </div>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.cartId)}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                
                <div className="cart-total">
                  <span>Total</span>
                  <span style={{ color: 'var(--accent-yellow)' }}>{formatCurrency(total)}</span>
                </div>

                <button 
                  onClick={handleSale}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}
                >
                  <Save size={18} />
                  Enregistrer la vente
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CashRegister;