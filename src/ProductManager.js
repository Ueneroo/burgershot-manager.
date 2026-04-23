import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5000';

function ProductManager({ user }) {
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    type: 'item'
  });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingProduct) {
        await axios.put(`${API_URL}/api/products/${editingProduct.id}`, formData, {
          headers: { 'x-discord-id': user.discordId }
        });
        showNotification('Produit modifié avec succès!');
      } else {
        await axios.post(`${API_URL}/api/products`, formData, {
          headers: { 'x-discord-id': user.discordId }
        });
        showNotification('Produit ajouté avec succès!');
      }
      
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      showNotification('Erreur lors de l\'enregistrement', 'error');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      category: product.category,
      type: product.type
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit?')) return;

    try {
      await axios.delete(`${API_URL}/api/products/${id}`, {
        headers: { 'x-discord-id': user.discordId }
      });
      showNotification('Produit supprimé avec succès!');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', price: '', category: '', type: 'item' });
    setEditingProduct(null);
    setShowForm(false);
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

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
          <h2>Gestion des Produits</h2>
          <p>Ajoutez, modifiez ou supprimez des produits</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
        >
          <Plus size={18} />
          Nouveau Produit
        </button>
      </div>

      {showForm && (
        <div className="form-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3>{editingProduct ? 'Modifier le produit' : 'Nouveau produit'}</h3>
            <button onClick={resetForm} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Nom du produit</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Prix ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Catégorie</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="item">Produit à l'unité</option>
                  <option value="menu">Menu</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="submit" className="btn btn-primary">
                <Save size={18} />
                {editingProduct ? 'Modifier' : 'Créer'}
              </button>
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Catégorie</th>
              <th>Type</th>
              <th>Prix</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td style={{ fontWeight: 600 }}>{product.name}</td>
                <td>{product.category}</td>
                <td>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '1rem',
                    fontSize: '0.875rem',
                    background: product.type === 'menu' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: product.type === 'menu' ? 'var(--accent-yellow)' : 'var(--accent-red)'
                  }}>
                    {product.type === 'menu' ? '📦 Menu' : '🍔 Produit'}
                  </span>
                </td>
                <td style={{ fontWeight: 600, color: 'var(--accent-yellow)' }}>
                  {formatCurrency(product.price)}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => handleEdit(product)}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-yellow)', cursor: 'pointer' }}
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(product.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProductManager;