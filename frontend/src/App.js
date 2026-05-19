import React, { useState, useEffect } from 'react';
import './App.css';
import { UserProvider, useUser } from './userContext';
import Onboarding from './components/Onboarding';
import Feed from './components/Feed';
import Missions from './components/Missions';
import Library from './components/Library';
import Explore from './components/Explore';
import Profile from './components/Profile';
import BottomNav from './components/BottomNav';
import LevelUpOverlay from './components/LevelUpOverlay';

function AppShell() {
  const { profile, fetchProfile } = useUser();
  const [tab, setTab] = useState('feed');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetchProfile().finally(() => setReady(true));
  }, [fetchProfile]);

  if (!ready) {
    return (
      <div style={splash.screen} data-testid="splash-screen">
        <div style={splash.mascot}>🌱</div>
        <h1 style={splash.brand}>STEMScroll</h1>
        <p style={splash.tagline}>Every swipe makes you smarter</p>
        <div style={splash.spinner} />
      </div>
    );
  }

  if (!profile?.onboarded) {
    return <Onboarding onDone={() => fetchProfile()} />;
  }

  const SCREENS = {
    feed:     <Feed />,
    missions: <Missions />,
    library:  <Library />,
    explore:  <Explore />,
    me:       <Profile />,
  };

  return (
    <div style={appStyles.root} data-testid="main-app">
      <div style={appStyles.content}>
        {SCREENS[tab] || <Feed />}
      </div>
      <BottomNav active={tab} onChange={setTab} />
      <LevelUpOverlay />
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AppShell />
    </UserProvider>
  );
}

const splash = {
  screen: { height: '100vh', background: '#0B0F2E', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 },
  mascot: { fontSize: 80, filter: 'drop-shadow(0 0 30px rgba(123,97,255,0.5))' },
  brand: { color: '#F0F4FF', fontSize: 36, fontWeight: 900, margin: 0, letterSpacing: 1 },
  tagline: { color: '#8892B0', fontSize: 16, margin: 0 },
  spinner: { width: 32, height: 32, border: '3px solid #1E2545', borderTopColor: '#7B61FF', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginTop: 20 },
};

const appStyles = {
  root: { height: '100vh', display: 'flex', flexDirection: 'column', background: '#0B0F2E', maxWidth: 480, margin: '0 auto', boxShadow: '0 0 80px rgba(0,0,0,0.6)', position: 'relative' },
  content: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
};
