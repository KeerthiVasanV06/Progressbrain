// Navbar.jsx
import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import logo from '../assets/logo.png';
import styles from '../styles/Navbar.module.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link to="/" className={styles.logoContainer}>
          <img src={logo} alt="ProgressBrain Logo" className={styles.logoImage} />
          <span className={styles.logoText}>ProgressBrain</span>
        </Link>

        <button
          className={styles.menuToggle}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          ☰
        </button>

        <div className={`${styles.navLinks} ${mobileMenuOpen ? styles.active : ''}`}>
          <Link to="/" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>
            Home
          </Link>
          <Link to="/study" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>
            Study
          </Link>
          <Link to="/reports" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>
            Reports
          </Link>
        </div>

        <div className={styles.userSection}>
          {user ? (
            <>
              <span className={styles.username}>{user.username}</span>
              <button onClick={handleLogout} className={styles.logoutBtn}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={styles.authBtn}>
                Login
              </Link>
              <Link to="/register" className={`${styles.authBtn} ${styles.primary}`}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
