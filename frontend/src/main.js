// Main App component using React.createElement (no JSX)
const { useState, useEffect } = React;

function App() {
  const [currentRoute, setCurrentRoute] = useState('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication status
    const token = localStorage.getItem('docuchain_token');
    const user = localStorage.getItem('docuchain_user');
    
    if (token && user) {
      setIsAuthenticated(true);
      // If authenticated and on login/register, redirect to dashboard
      if (currentRoute === 'login' || currentRoute === 'register') {
        setCurrentRoute('dashboard');
      }
    }
    
    // Simple client-side routing based on hash
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1) || 'login';
      setCurrentRoute(hash);
    };
    
    // Set initial route
    handleHashChange();
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const renderCurrentRoute = () => {
    switch (currentRoute) {
      case 'register':
        return React.createElement(Register);
      case 'dashboard':
        return React.createElement(Dashboard);
      case 'create-institution':
        return React.createElement(CreateInstitution);
      case 'login':
      default:
        return React.createElement(Login);
    }
  };

  return React.createElement('div', { className: 'app' },
    renderCurrentRoute()
  );
}

// Simple Dashboard component
function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('docuchain_user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('docuchain_token');
    localStorage.removeItem('docuchain_user');
    localStorage.removeItem('docuchain_wallet');
    window.location.hash = 'login';
    window.location.reload();
  };

  if (!user) {
    return React.createElement('div', { style: { padding: '50px', textAlign: 'center' } },
      React.createElement('p', null, 'Loading...')
    );
  }

  return React.createElement('div', { style: { padding: '50px', maxWidth: '800px', margin: '0 auto' } },
    React.createElement('h1', null, `Welcome, ${user.name}!`),
    React.createElement('p', null, `Role: ${user.role}`),
    React.createElement('p', null, `Email: ${user.email}`),
    user.wallet && React.createElement('p', null, `Wallet: ${user.wallet}`),
    React.createElement('button', {
      onClick: handleLogout,
      style: {
        padding: '10px 20px',
        backgroundColor: '#dc2626',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        marginTop: '20px'
      }
    }, 'Logout'),
    React.createElement('div', { style: { marginTop: '30px' } },
      React.createElement('h2', null, 'Quick Actions'),
      React.createElement('div', { style: { display: 'flex', gap: '10px', flexWrap: 'wrap' } },
        React.createElement('button', {
          style: {
            padding: '10px 15px',
            backgroundColor: '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }
        }, 'Upload Document'),
        React.createElement('button', {
          style: {
            padding: '10px 15px',
            backgroundColor: '#0d9488',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }
        }, 'View Documents'),
        React.createElement('button', {
          style: {
            padding: '10px 15px',
            backgroundColor: '#0891b2',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }
        }, 'Verify Document'),
        user.role === 'admin' && React.createElement('button', {
          key: 'admin',
          style: {
            padding: '10px 15px',
            backgroundColor: '#7c3aed',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }
        }, 'Manage Institution')
      )
    )
  );
}

// Simple CreateInstitution component
function CreateInstitution() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    window.location.hash = 'dashboard';
  };

  return React.createElement('div', { className: 'shell' },
    React.createElement('div', { style: { textAlign: 'center', padding: '50px' } },
      React.createElement('h1', null, 'Institution Setup'),
      React.createElement('p', null, `Step ${step} of 3`),
      React.createElement('div', { style: { margin: '30px 0' } },
        step === 1 && React.createElement('div', null,
          React.createElement('h2', null, 'Institution Details'),
          React.createElement('p', null, 'Configure your institution settings.')
        ),
        step === 2 && React.createElement('div', null,
          React.createElement('h2', null, 'Verification'),
          React.createElement('p', null, 'Verify your email and documents.')
        ),
        step === 3 && React.createElement('div', null,
          React.createElement('h2', null, 'Complete Setup'),
          React.createElement('p', null, 'Finalize your institution setup.')
        )
      ),
      React.createElement('div', { style: { display: 'flex', gap: '10px', justifyContent: 'center' } },
        step > 1 && React.createElement('button', {
          onClick: () => setStep(step - 1),
          style: {
            padding: '10px 20px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }
        }, 'Previous'),
        step < 3 ? React.createElement('button', {
          onClick: () => setStep(step + 1),
          style: {
            padding: '10px 20px',
            backgroundColor: '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }
        }, 'Next') : React.createElement('button', {
          onClick: handleComplete,
          disabled: loading,
          style: {
            padding: '10px 20px',
            backgroundColor: '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }
        }, loading ? 'Setting up...' : 'Complete Setup')
      )
    )
  );
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('root');
  if (root) {
    ReactDOM.render(React.createElement(App), root);
  }
});