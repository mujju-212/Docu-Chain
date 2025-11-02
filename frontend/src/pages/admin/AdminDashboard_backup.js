import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { WalletProvider, useWallet } from '../../contexts/WalletContext';

const AdminDashboard = () => {
  const { user, logout } = useAuth();

  // Test each import one by one
  return (
    <WalletProvider>
      <div>
        <h1>Admin Dashboard Test</h1>
        <p>User: {user ? user.username : 'No user'}</p>
      </div>
    </WalletProvider>
  );
};

export default AdminDashboard;