import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Utensils, Receipt, 
  TrendingUp, Package, Users, LogOut, Menu, X
} from 'lucide-react';
import axios from 'axios';
import './index.css';

// Components
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CashRegister from './components/CashRegister';
import Kitchen from './components/Kitchen';
import Invoices from './components/Invoices';
import FinancialDashboard from './components/FinancialDashboard';
import ProductManager from './components/ProductManager';

const API_URL = 'http://localhost:5000';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('burgershot_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    localStorage.setItem('burgershot_user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('burgershot_user');
    setUser(null);
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <Router>
      {!user ? (
        <Login onLogin={handleLogin} />
      ) : (
        <div className="app-container">
          <Sidebar user={user} onLogout={handleLogout} />
          <div className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard user={user} />} />
              <Route path="/caisse" element={<CashRegister user={user} />} />
              <Route path="/cuisine" element={<Kitchen user={user} />} />
              <Route path="/factures" element={<Invoices user={user} />} />
              <Route path="/produits" element={<ProductManager user={user} />} />
              {user.isAdmin && (
                <Route path="/finances" element={<FinancialDashboard user={user} />} />
              )}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      )}
    </Router>
  );
}

function Sidebar({ user, onLogout }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/caisse', icon: ShoppingCart, label: 'Caisse' },
    { path: '/cuisine', icon: Utensils, label: 'Cuisine' },
    { path: '/factures', icon: Receipt, label: 'Factures' },
    { path: '/produits', icon: Package, label: 'Produits' },
    ...(user.isAdmin ? [{ path: '/finances', icon: TrendingUp, label: 'Finances' }] : []),
  ];

  return (
    <>
      <button 
        className="mobile-menu-btn"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        style={{ display: 'none' }}
      >
        {mobileMenuOpen ? <X /> : <Menu />}
      </button>
      
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="logo">
          <div className="logo-icon">BS</div>
          <div className="logo-text">
            <h1>BurgerShot</h1>
            <p>Management System</p>
          </div>
        </div>

        <nav className="nav-menu">
          {menuItems.map((item) => (
            <a
              key={item.path}
              href={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="user-profile">
          <div className="user-avatar">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <h4>{user.username}</h4>
            <p>{user.isAdmin ? 'Administrateur' : 'Employé'}</p>
          </div>
          <button onClick={onLogout} className="btn-icon" style={{ marginLeft: 'auto' }}>
            <LogOut size={18} />
          </button>
        </div>
      </aside>
    </>
  );
}

export default App;