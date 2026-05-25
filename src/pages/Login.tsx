import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { KeyRound, Mail, Eye, EyeOff, AlertTriangle } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMsg("Adresse email ou mot de passe incorrect.");
        } else {
          setErrorMsg(error.message);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Une erreur inattendue est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.backgroundGlow1}></div>
      <div style={styles.backgroundGlow2}></div>

      <div className="glass-panel animate-fade-in animate-pulse-glow" style={styles.loginCard}>
        <div style={styles.header}>
          <div style={styles.logoBadge}>AINA</div>
          <h1 style={styles.title}>Gestion Aina Pièces</h1>
          <p style={styles.subtitle}>Mini-ERP de Gestion de Pièces Automobiles</p>
        </div>

        {errorMsg && (
          <div style={styles.errorAlert} className="animate-fade-in">
            <AlertTriangle size={18} color="var(--accent-red)" />
            <span style={styles.errorText}>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={styles.form}>
          <div className="form-group">
            <label className="form-label">Adresse Email</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                type="email"
                required
                className="form-input"
                style={styles.inputWithIcon}
                placeholder="nom@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Mot de Passe</label>
            <div style={styles.inputWrapper}>
              <KeyRound size={18} style={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="form-input"
                style={styles.inputWithIcon}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={styles.submitBtn}
            disabled={loading}
          >
            {loading ? (
              <span style={styles.spinner}></span>
            ) : (
              "Se connecter"
            )}
          </button>
        </form>

        <div style={styles.footer}>
          <p>© {new Date().getFullYear()} Aina Pièces Auto. Tous droits réservés.</p>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100dvh',
    width: '100%',
    backgroundColor: 'var(--bg-main)',
    padding: '1.5rem',
    position: 'relative',
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  backgroundGlow1: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,242,254,0.12) 0%, rgba(0,0,0,0) 70%)',
    top: '-10%',
    left: '-5%',
    zIndex: 1,
  },
  backgroundGlow2: {
    position: 'absolute',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, rgba(0,0,0,0) 70%)',
    bottom: '-15%',
    right: '-5%',
    zIndex: 1,
  },
  loginCard: {
    width: '100%',
    maxWidth: '460px',
    padding: '2.5rem',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: '1.75rem',
    margin: 'auto',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '0.5rem',
  },
  logoBadge: {
    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
    color: '#090d16',
    fontWeight: '800',
    fontSize: '0.85rem',
    padding: '4px 12px',
    borderRadius: '9999px',
    letterSpacing: '0.15em',
    marginBottom: '0.5rem',
    fontFamily: "'Outfit', sans-serif",
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: 'var(--text-main)',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    lineHeight: '1.4',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
  inputWithIcon: {
    paddingLeft: '48px',
    paddingRight: '48px',
  },
  eyeButton: {
    position: 'absolute',
    right: '16px',
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    outline: 'none',
  },
  submitBtn: {
    marginTop: '1rem',
    width: '100%',
    height: '46px',
    fontSize: '1rem',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    borderRadius: 'var(--radius-sm)',
    padding: '12px 16px',
  },
  errorText: {
    fontSize: '0.85rem',
    color: 'var(--text-main)',
    fontWeight: '500',
  },
  footer: {
    textAlign: 'center',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '0.5rem',
  },
  spinner: {
    display: 'inline-block',
    width: '20px',
    height: '20px',
    border: '2px solid rgba(9, 13, 22, 0.3)',
    borderTop: '2px solid #090d16',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};
