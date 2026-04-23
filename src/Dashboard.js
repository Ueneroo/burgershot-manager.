import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, DollarSign, ShoppingCart, 
  Wallet, Calendar, ArrowUp, ArrowDown 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import axios from 'axios';

const API_URL = 'http://localhost:5000';

function Dashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(7);

  useEffect(() => {
    fetchStats();
  }, [period, user]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/stats/dashboard`, {
        headers: { 'x-discord-id': user.discordId },
        params: { days: period }
      });
      setStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  if (loading) return <div>Chargement...</div>;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  return (
    <div className="fade-in">
      <div className="header">
        <div>
          <h2>Tableau de Bord</h2>
          <p>Bienvenue, {user.username} 👋</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[7, 14, 30].map(days => (
            <button
              key={days}
              onClick={() => setPeriod(days)}
              className={`btn ${period === days ? 'btn-primary' : 'btn-secondary'}`}
            >
              {days}j
            </button>
          ))}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>
            <ShoppingCart size={18} />
            Mes Ventes
          </h3>
          <div className="value">{stats?.totalSales || 0}</div>
          <div className="change positive">
            <ArrowUp size={16} />
            Cette période
          </div>
          <div className="stat-icon">
            <ShoppingCart size={24} />
          </div>
        </div>

        <div className="stat-card">
          <h3>
            <DollarSign size={18} />
            Chiffre d'Affaires
          </h3>
          <div className="value" style={{ color: 'var(--accent-green)' }}>
            {formatCurrency(stats?.totalRevenue || 0)}
          </div>
          <div className="change positive">
            <ArrowUp size={16} />
            +12% vs semaine dernière
          </div>
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="stat-card">
          <h3>
            <ShoppingCart size={18} />
            Panier Moyen
          </h3>
          <div className="value" style={{ color: 'var(--accent-yellow)' }}>
            {formatCurrency(stats?.averageCart || 0)}
          </div>
          <div className="change negative">
            <ArrowDown size={16} />
            -3% vs semaine dernière
          </div>
          <div className="stat-icon">
            <Wallet size={24} />
          </div>
        </div>

        <div className="stat-card">
          <h3>
            <Wallet size={18} />
            Salaire Estimé
          </h3>
          <div className="value" style={{ color: 'var(--accent-red)' }}>
            {formatCurrency(stats?.salary || 0)}
          </div>
          <div className="change positive">
            Basé sur vos ventes
          </div>
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-card">
          <h3>
            <TrendingUp size={20} />
            Évolution sur {period} jours
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats?.evolution || []}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8"
                tickFormatter={formatDate}
              />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #475569',
                  borderRadius: '8px'
                }}
                formatter={(value) => [formatCurrency(value), 'Revenus']}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#ef4444" 
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Résumé de la période</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total des ventes</span>
              <span style={{ fontWeight: 600 }}>{stats?.totalSales || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Chiffre d'affaires</span>
              <span style={{ fontWeight: 600, color: 'var(--accent-green)' }}>
                {formatCurrency(stats?.totalRevenue || 0)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Salaire gagné</span>
              <span style={{ fontWeight: 600, color: 'var(--accent-red)' }}>
                {formatCurrency(stats?.salary || 0)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Panier moyen</span>
              <span style={{ fontWeight: 600, color: 'var(--accent-yellow)' }}>
                {formatCurrency(stats?.averageCart || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;