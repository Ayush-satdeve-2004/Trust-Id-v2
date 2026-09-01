import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Breadcrumbs } from './components/Breadcrumbs';
import { Screen1MerchantDirectory } from './components/Screen1MerchantDirectory';
import { Screen2MerchantProfile } from './components/Screen2MerchantProfile';
import { Screen3UserProfile } from './components/Screen3UserProfile';
import { Screen4TrustIDDetail } from './components/Screen4TrustIDDetail';
import { CustomerVerificationForm } from './components/CustomerVerificationForm';
import { EmailSimulatorModal } from './components/EmailSimulatorModal';
import { AlertsDrawer } from './components/AlertsDrawer';
import { SimulationControls } from './components/SimulationControls';
import { OnboardMerchantModal } from './components/OnboardMerchantModal';
import { CreateOrderModal } from './components/CreateOrderModal';
import { Merchant, AlertItem } from './types';

export const App: React.FC = () => {
  // Data State
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [unreadAlertCount, setUnreadAlertCount] = useState<number>(0);
  const [latestAlert, setLatestAlert] = useState<AlertItem | null>(null);

  // Navigation State (Screen 1, 2, 3, 4)
  const [currentScreen, setCurrentScreen] = useState<number>(1);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedTrustId, setSelectedTrustId] = useState<string | null>(null);

  // Modals & Panels State
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isEmailsOpen, setIsEmailsOpen] = useState(false);
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);
  const [createOrderForMerchantId, setCreateOrderForMerchantId] = useState<string | null>(null);
  const [customerVerificationTargetTid, setCustomerVerificationTargetTid] = useState<string | null>(null);

  // Mode: Dedicated Customer Verification Webpage (/verify)
  const [isStandaloneVerification, setIsStandaloneVerification] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string>('');

  const wsRef = useRef<WebSocket | null>(null);

  // Initial Fetch & Route Check
  useEffect(() => {
    fetchInitialData();
    setupWebSocket();

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const trustId = urlParams.get('trustId');
    
    // Dedicated customer webpage route check (/verify or token+trustId in URL)
    if (window.location.pathname.startsWith('/verify') || (token && trustId)) {
      setIsStandaloneVerification(true);
      if (token) setVerificationToken(token);
      if (trustId) setCustomerVerificationTargetTid(trustId);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const fetchInitialData = async () => {
    try {
      const [mRes, aRes] = await Promise.all([
        fetch('/api/merchants'),
        fetch('/api/alerts'),
      ]);

      if (mRes.ok) {
        const mData = await mRes.json();
        if (mData.success) setMerchants(mData.merchants);
      }

      if (aRes.ok) {
        const aData = await aRes.json();
        if (aData.success) {
          setAlerts(aData.alerts);
          setUnreadAlertCount(aData.alerts.length);
          if (aData.alerts.length > 0) {
            setLatestAlert(aData.alerts[0]);
          }
        }
      }
    } catch (err) {
      console.warn('Backend API warming up...', err);
    }
  };

  const setupWebSocket = () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'INITIAL_SYNC') {
            setMerchants(data.payload.merchants);
            setAlerts(data.payload.alerts);
          } else if (data.type === 'ALERT_ADDED') {
            setAlerts((prev) => [data.payload, ...prev]);
            setLatestAlert(data.payload);
            setUnreadAlertCount((c) => c + 1);
          } else {
            fetchInitialData();
          }
        } catch (err) {
          console.error('WS Parse Error:', err);
        }
      };

      ws.onerror = (_err) => {};

      ws.onclose = () => {
        setTimeout(setupWebSocket, 5000);
      };
    } catch (err) {
      setTimeout(setupWebSocket, 5000);
    }
  };

  // Hierarchy Helpers
  const activeMerchant = merchants.find((m) => m.merchant_id === selectedMerchantId);
  const activeUser = activeMerchant?.users.find((u) => u.user_id === selectedUserId);
  const activeTrustId = activeUser?.trust_ids.find((t) => t.trust_id === selectedTrustId);

  // Drill-down Navigation Handlers
  const handleSelectMerchant = (merchantId: string) => {
    setSelectedMerchantId(merchantId);
    setSelectedUserId(null);
    setSelectedTrustId(null);
    setCurrentScreen(2);
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    setSelectedTrustId(null);
    setCurrentScreen(3);
  };

  const handleSelectTrustId = (trustId: string) => {
    for (const m of merchants) {
      for (const u of m.users) {
        if (u.trust_ids.some((t) => t.trust_id === trustId)) {
          setSelectedMerchantId(m.merchant_id);
          setSelectedUserId(u.user_id);
          setSelectedTrustId(trustId);
          setCurrentScreen(4);
          return;
        }
      }
    }
  };

  const handleBreadcrumbNavigate = (screenNum: number) => {
    setCurrentScreen(screenNum);
    if (screenNum === 1) {
      setSelectedMerchantId(null);
      setSelectedUserId(null);
      setSelectedTrustId(null);
    } else if (screenNum === 2) {
      setSelectedUserId(null);
      setSelectedTrustId(null);
    } else if (screenNum === 3) {
      setSelectedTrustId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-500 selection:text-white">
      
      {/* If standalone customer verification route (/verify), render ONLY the customer webpage */}
      {isStandaloneVerification ? (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold text-slate-900">Razorpay Trust-ID Handover</h1>
            <p className="text-xs text-slate-500 mt-1">Dedicated Customer Order Verification Webpage (Email 2 Link)</p>
          </div>
          <CustomerVerificationForm
            trustId={customerVerificationTargetTid || (merchants[0]?.users[0]?.trust_ids[0]?.trust_id || '')}
            token={verificationToken}
            onClose={() => {
              window.location.href = '/';
            }}
            onVerificationSuccess={() => fetchInitialData()}
          />
        </div>
      ) : (
        /* Razorpay Internal Ops Console Flow */
        <>
          <Navbar
            alerts={alerts}
            unreadAlertCount={unreadAlertCount}
            onOpenAlerts={() => {
              setIsAlertsOpen(true);
              setUnreadAlertCount(0);
            }}
            onOpenEmails={() => setIsEmailsOpen(true)}
            onOpenSimulation={() => setIsSimulationOpen(true)}
          />

          <Breadcrumbs
            currentScreen={currentScreen}
            merchantId={activeMerchant?.merchant_id}
            merchantName={activeMerchant?.business_name}
            userId={activeUser?.user_id}
            trustId={activeTrustId?.trust_id}
            onNavigate={handleBreadcrumbNavigate}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {currentScreen === 1 && (
              <Screen1MerchantDirectory
                merchants={merchants}
                latestAlert={latestAlert}
                onSelectMerchant={handleSelectMerchant}
                onOpenOnboardModal={() => setIsOnboardOpen(true)}
              />
            )}

            {currentScreen === 2 && activeMerchant && (
              <Screen2MerchantProfile
                merchant={activeMerchant}
                onBack={() => handleBreadcrumbNavigate(1)}
                onSelectUser={handleSelectUser}
                onOpenCreateOrder={(mid) => setCreateOrderForMerchantId(mid)}
              />
            )}

            {currentScreen === 3 && activeMerchant && activeUser && (
              <Screen3UserProfile
                merchant={activeMerchant}
                user={activeUser}
                onBack={() => handleBreadcrumbNavigate(2)}
                onSelectTrustId={handleSelectTrustId}
              />
            )}

            {currentScreen === 4 && activeMerchant && activeUser && activeTrustId && (
              <Screen4TrustIDDetail
                trustId={activeTrustId}
                merchant={activeMerchant}
                user={activeUser}
                onBack={() => handleBreadcrumbNavigate(3)}
                onOpenCustomerVerification={(tid) => setCustomerVerificationTargetTid(tid)}
              />
            )}
          </main>
        </>
      )}

      {/* Customer Verification Modal (when opened inside Ops Console) */}
      {customerVerificationTargetTid && !isStandaloneVerification && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <CustomerVerificationForm
            trustId={customerVerificationTargetTid}
            onClose={() => setCustomerVerificationTargetTid(null)}
            onVerificationSuccess={() => {
              fetchInitialData();
              setCustomerVerificationTargetTid(null);
            }}
          />
        </div>
      )}

      {/* Modals & Drawers */}
      <AlertsDrawer
        alerts={alerts}
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        onSelectMerchant={handleSelectMerchant}
        onSelectTrustId={handleSelectTrustId}
      />

      {isEmailsOpen && (
        <EmailSimulatorModal
          onClose={() => setIsEmailsOpen(false)}
          onOpenVerificationForm={(tid, tok) => {
            window.open(`/verify?token=${tok || ''}&trustId=${tid}`, '_blank');
          }}
        />
      )}

      <SimulationControls
        isOpen={isSimulationOpen}
        onClose={() => setIsSimulationOpen(false)}
        merchants={merchants}
        onSelectTrustId={handleSelectTrustId}
        onOpenEmails={() => setIsEmailsOpen(true)}
      />

      {isOnboardOpen && (
        <OnboardMerchantModal
          onClose={() => setIsOnboardOpen(false)}
          onSuccess={(mid) => {
            fetchInitialData();
            handleSelectMerchant(mid);
          }}
        />
      )}

      {createOrderForMerchantId && (
        <CreateOrderModal
          merchantId={createOrderForMerchantId}
          onClose={() => setCreateOrderForMerchantId(null)}
          onSuccess={(tid) => {
            fetchInitialData();
            handleSelectTrustId(tid);
          }}
        />
      )}

    </div>
  );
};
