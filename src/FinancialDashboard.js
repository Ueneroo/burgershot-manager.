import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, DollarSign, Wallet, 
  PieChart as PieChartIcon, ArrowUpRight 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar, Legend
} from 'recharts';
import axios from 'axios';

const API_URL = 'http://localhost:5000';
const COLORS = ['#ef4444', '#eab308', '#10b981', '#3b82f6'];

function FinancialDashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/stats/financial`, {
        headers: { 'x-discord-id': user.discordId }
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

  const expenseData = [
    { name: 'Revenus', value: stats?.totalRevenue || 0 },
    { name: 'Salaires', value: stats?.totalSalaries || 0 },
    { name: 'Dépenses', value: stats?.totalExpenses || 0 },
  ];

  return (
    <div className="fade-in">
      <div className="header">
        <div>
          <h2>Tableau de Bord Financier</h2>
          <p>Vue d'ensemble des finances (Admin)</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>
            <DollarSign size={18} />
            Chiffre d'Affaires Total
          </h3>
          <div className="value" style={{ color: 'var(--accent-green)' }}>
            {formatCurrency(stats?.totalRevenue || 0)}
          </div>
          <div className="change positive">
            <ArrowUpRight size={16} />
            Période en cours
          </div>
        </div>

        <div className="stat-card">
          <h3>
            <Wallet size={18} />
            Dépenses
          </h3>
          <div className="value" style={{ color: 'var(--accent-red)' }}>
            {formatCurrency(stats?.totalExpenses || 0)}
          </div>
          <div className="change negative">
            Charges diverses
          </div>
        </div>

        <div className="stat-card">
          <h3>
            <TrendingUp size={18} />
            Salaires
          </h3>
          <div className="value" style={{ color: 'var(--accent-yellow)' }}>
            {formatCurrency(stats?.totalSalaries || 0)}
          </div>
          <div className="change">
            10% du CA
          </div>
        </div>

        <div className="stat-card">
          <h3>
            <PieChartIcon size={18} />
            Bénéfice Net
          </h3>
          <div className="value" style={{ 
            color: (stats?.netProfit || 0) >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' 
          }}>
            {formatCurrency(stats?.netProfit || 0)}
          </div>
          <div className="change positive">
            Marge nette
          </div>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-card">
          <h3>Évolution des Revenus (30 jours)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats?.revenueEvolution || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8"
                tickFormatter={(date) => {
                  const d = new Date(date);
                  return `${d.getDate()}/${d.getMonth() + 1}`;
                }}
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
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#ef4444" 
                strokeWidth={3}
                dot={{ fill: '#ef4444' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Répartition Financière</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expenseData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {expenseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #475569',
                  borderRadius: '8px'
                }}
                formatter={(value) => formatCurrency(value)}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-card" style={{ marginTop: '2rem' }}>
        <h3>Détails des Performances</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
          <div style={{ padding: '1.5rem', background: 'var(--bg-card)', borderRadius: '1rem' }}>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Marge Brute</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-green)' }}>
              {((stats?.netProfit / stats?.totalRevenue) * 100 || 0).toFixed(1)}%
            </div>
          </div>
          <div style={{ padding: '1.5rem', background: 'var(--bg-card)', borderRadius: '1rem' }}>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Ratio Dépenses/CA</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-red)' }}>
              {((stats?.totalExpenses / stats?.totalRevenue) * 100 || 0).toFixed(1)}%
            </div>
          </div>
          <div style={{ padding: '1.5rem', background: 'var(--bg-card)', borderRadius: '1rem' }}>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Ratio Salaires/CA</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-yellow)' }}>
              {((stats?.totalSalaries / stats?.totalRevenue) * 100 || 0).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FinancialDashboard;