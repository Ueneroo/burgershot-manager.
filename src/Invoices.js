import React, { useState, useEffect } from 'react';
import { Receipt, Filter, Download } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5000';

function Invoices({ user }) {
  const [sales, setSales] = useState([]);
  const [crafts, setCrafts] = useState([]);
  const [users, setUsers] = useState([]);
  const [filterUser, setFilterUser] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [filterUser, filterType]);

  const fetchData = async () => {
    try {
      const [salesRes, craftsRes, usersRes] = await Promise.all([
        axios.get(`${API_URL}/api/sales`, {
          headers: { 'x-discord-id': user.discordId },
          params: { userId: filterUser || undefined }
        }),
        axios.get(`${API_URL}/api/crafts`, {
          headers: { 'x-discord-id': user.discordId },
          params: { userId: filterUser || undefined }
        }),
        axios.get(`${API_URL}/api/users`, {
          headers: { 'x-discord-id': user.discordId }
        })
      ]);

      setSales(salesRes.data);
      setCrafts(craftsRes.data);
      setUsers(usersRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('fr-FR');
  };

  const allData = filterType === 'all' 
    ? [...sales.map(s => ({ ...s, type: 'sale' })), ...crafts.map(c => ({ ...c, type: 'craft' }))]
    : filterType === 'sale'
    ? sales.map(s => ({ ...s, type: 'sale' }))
    : crafts.map(c => ({ ...c, type: 'craft' }));

  allData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div className="fade-in">
      <div className="header">
        <div>
          <h2>Factures & Historique</h2>
          <p>Consultez l'historique complet</p>
        </div>
      </div>

      <div className="form-container" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label>Filtrer par employé</label>
            <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
              <option value="">Tous les employés</option>
              {users.map(u => (
                <option key={u.discord_id} value={u.discord_id}>
                  {u.username}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Type</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">Tous</option>
              <option value="sale">Ventes</option>
              <option value="craft">Crafts</option>
            </select>
          </div>

          <button className="btn btn-secondary">
            <Filter size={18} />
            Filtrer
          </button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Employé</th>
              <th>Détails</th>
              <th>Montant/Qté</th>
            </tr>
          </thead>
          <tbody>
            {allData.map((item, index) => (
              <tr key={index}>
                <td>{formatDate(item.created_at)}</td>
                <td>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '1rem',
                    fontSize: '0.875rem',
                    background: item.type === 'sale' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                    color: item.type === 'sale' ? 'var(--accent-red)' : 'var(--accent-yellow)'
                  }}>
                    {item.type === 'sale' ? '💰 Vente' : '🍔 Craft'}
                  </span>
                </td>
                <td>{item.username || 'Inconnu'}</td>
                <td>
                  {item.type === 'sale' 
                    ? `${JSON.parse(item.items).length} article(s)`
                    : `${item.product_name} x${item.quantity}`
                  }
                </td>
                <td style={{ fontWeight: 600 }}>
                  {item.type === 'sale' 
                    ? formatCurrency(item.total)
                    : `${item.quantity} unités`
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Invoices;