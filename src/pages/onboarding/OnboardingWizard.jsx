import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import AddHoldingForm from './AddHoldingForm';
import { CheckCircle } from 'lucide-react';

export default function OnboardingWizard() {
  const { currentUser, userProfile } = useAuth();
  const { state } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Profile fields
  const [city, setCity] = useState('');
  const [dob, setDob] = useState('');
  const [income, setIncome] = useState('');
  const [empType, setEmpType] = useState('Salaried');
  const [riskProfile, setRiskProfile] = useState('Moderate');

  const completeOnboarding = () => {
    // Mark done locally so the redirect guard in ConsumerApp doesn't loop
    localStorage.setItem('finagent_onboarding_done', 'true');
    // Fire-and-forget Firestore write — navigate immediately
    if (currentUser && !currentUser.isDemo) {
      try {
        updateDoc(doc(db, 'investors', currentUser.uid), {
          onboardingComplete: true
        }).catch(() => {}); // silently ignore if Firestore not ready
      } catch {}
    }
    navigate('/app/dashboard');
  };

  const handleProfileNext = () => {
    // Save profile in background — advance step immediately
    if (currentUser && !currentUser.isDemo) {
      try {
        updateDoc(doc(db, 'investors', currentUser.uid), {
          city, dob, income: Number(income), empType, riskProfile
        }).catch(() => {}); // silently ignore if Firestore not ready
      } catch {}
    }
    setStep(3);
  };


  useEffect(() => {
    if (userProfile?.onboardingComplete) {
      navigate('/app/dashboard');
    }
  }, [userProfile?.onboardingComplete, navigate]);

  if (userProfile?.onboardingComplete) {
    return null;
  }

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--purple))', margin: '0 auto 2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 800, color: '#fff' }}>F</div>
            <h1 className="text-h1" style={{ marginBottom: '1rem' }}>Welcome, {currentUser?.displayName?.split(' ')[0] || 'User'}!</h1>
            <p className="text-secondary" style={{ marginBottom: '2rem' }}>Let's set up your financial profile.</p>
            <button className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }} onClick={() => setStep(2)}>Get Started →</button>
          </div>
        );
      case 2:
        return (
          <div>
            <h2 className="text-h2" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Your Profile</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Name</label>
                <input type="text" value={currentUser?.displayName || ''} readOnly style={{ width: '100%', padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-muted)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Email</label>
                <input type="email" value={currentUser?.email || ''} readOnly style={{ width: '100%', padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-muted)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>City</label>
                <input type="text" value={city} onChange={e => setCity(e.target.value)} style={{ width: '100%', padding: '0.6rem 1rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Date of Birth</label>
                <input type="date" value={dob} onChange={e => setDob(e.target.value)} style={{ width: '100%', padding: '0.6rem 1rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Annual Income (₹)</label>
                <input type="number" value={income} onChange={e => setIncome(e.target.value)} style={{ width: '100%', padding: '0.6rem 1rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Employment Type</label>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {['Salaried', 'Self-employed', 'Business Owner', 'Other'].map(t => (
                    <label key={t}><input type="radio" name="empType" checked={empType === t} onChange={() => setEmpType(t)} /> {t}</label>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Risk Profile</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {[
                    { id: 'Conservative', desc: 'Focus on capital protection' },
                    { id: 'Moderate', desc: 'Balanced growth & risk' },
                    { id: 'Aggressive', desc: 'High growth potential' }
                  ].map(r => (
                    <div 
                      key={r.id} 
                      onClick={() => setRiskProfile(r.id)}
                      style={{ flex: 1, padding: '1rem', background: 'var(--surface-raised)', border: riskProfile === r.id ? '2px solid var(--primary)' : '2px solid transparent', borderRadius: 'var(--radius)', cursor: 'pointer', textAlign: 'center' }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{r.id}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
              <button className="btn btn-primary" onClick={handleProfileNext} disabled={loading} style={{ width: '100%', padding: '1rem', marginTop: '1rem' }}>Next →</button>
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            <h2 className="text-h2" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Choose Import Path</h2>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <div 
                className="card" 
                style={{ flex: 1, cursor: 'pointer', textAlign: 'center', padding: '2rem' }}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'application/pdf';
                  input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setLoading(true);
                      const formData = new FormData();
                      formData.append('file', file);
                      fetch('/api/cams/parse-pdf', { method: 'POST', body: formData })
                        .then(() => setStep(5))
                        .catch(err => { console.error(err); setStep(5); })
                        .finally(() => setLoading(false));
                    }
                  };
                  input.click();
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📂</div>
                <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Import from CAMS / NSDL</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Upload your consolidated statement PDF and we'll fill everything automatically</div>
              </div>
              <div 
                className="card" 
                style={{ flex: 1, cursor: 'pointer', textAlign: 'center', padding: '2rem' }}
                onClick={() => setStep(4)}
              >
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✏️</div>
                <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Add Manually</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Enter your holdings one by one. Takes 3–5 minutes.</div>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div>
            <h2 className="text-h2" style={{ marginBottom: '1rem', textAlign: 'center' }}>Add First Asset</h2>
            <div style={{ height: '60vh', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              <AddHoldingForm onSave={() => setStep(5)} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', alignItems: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setStep(5)}>I'll add more later →</button>
            </div>
          </div>
        );
      case 5:
        return (
          <div style={{ textAlign: 'center' }}>
            <style>
              {`
                @keyframes pulse {
                  0% { transform: scale(1); }
                  50% { transform: scale(1.1); }
                  100% { transform: scale(1); }
                }
              `}
            </style>
            <CheckCircle size={80} color="var(--green)" style={{ margin: '0 auto 2rem', animation: 'pulse 2s infinite' }} />
            <h1 className="text-h1" style={{ marginBottom: '1rem' }}>All Done!</h1>
            <p className="text-secondary" style={{ marginBottom: '2rem' }}>Your FinAgent is ready!</p>
            <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(16,185,129,0.1)' }}>
              <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                {(() => {
                  const h = state.consumer.holdings;
                  return (h.equities?.length || 0) + (h.mutualFunds?.length || 0) +
                    (h.fixedDeposits?.length || 0) + (h.gold?.length || 0) +
                    (h.realEstate?.length || 0) + (h.epf ? 1 : 0);
                })()} assets added
              </div>
            </div>
            <button className="btn btn-primary" onClick={completeOnboarding} style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>Go to Dashboard →</button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', color: 'var(--text-primary)' }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 4, background: 'var(--surface-raised)' }}>
        <div style={{ height: '100%', width: `${(step / 5) * 100}%`, background: 'var(--primary)', transition: 'width 0.3s ease' }} />
      </div>
      <div style={{ width: '100%', maxWidth: 560, background: 'var(--surface)', padding: '2.5rem', borderRadius: '1rem', border: '1px solid var(--glass-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        {renderStep()}
        {step < 5 && (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button 
              onClick={completeOnboarding} 
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
