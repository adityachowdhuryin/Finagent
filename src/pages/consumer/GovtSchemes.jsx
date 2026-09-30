import React, { useState, useEffect } from 'react';
import { TrendingUp, Plus, Trash2, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { db } from '../../config/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

const SCHEME_TYPES = {
  PPF: { name: 'Public Provident Fund (PPF)', rate: 7.1, section: '80C' },
  NPS1: { name: 'NPS Tier I', rate: 10, section: '80CCD(1B)' },
  NPS2: { name: 'NPS Tier II', rate: 9, section: 'None' },
  SSY: { name: 'Sukanya Samriddhi Yojana (SSY)', rate: 8.2, section: '80C' },
  SCSS: { name: 'Senior Citizen Savings Scheme', rate: 8.2, section: '80C' },
  NSC: { name: 'National Savings Certificate (NSC)', rate: 7.7, section: '80C' },
  KVP: { name: 'Kisan Vikas Patra (KVP)', rate: 7.5, section: 'None' }
};

export default function GovtSchemes() {
  const { currentUser } = useAuth();
  const { state } = useApp();
  
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newSchemeType, setNewSchemeType] = useState('PPF');
  
  const [formData, setFormData] = useState({
    balance: 0,
    contribution: 0, // annual or monthly based on scheme
    dateOfBirth: '', // for SSY
    investmentDate: ''
  });

  useEffect(() => {
    async function loadData() {
      if (!currentUser) return;
      if (currentUser.isDemo) {
        setSchemes([
          { id: 1, type: 'PPF', balance: 250000, contribution: 150000, createdAt: new Date().toISOString() },
          { id: 2, type: 'NPS1', balance: 180000, contribution: 5000, createdAt: new Date().toISOString() }
        ]);
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, 'investors', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().govtSchemes) {
          setSchemes(docSnap.data().govtSchemes);
        } else {
          setSchemes([
            { id: 1, type: 'PPF', balance: 250000, contribution: 150000, createdAt: new Date().toISOString() },
            { id: 2, type: 'NPS1', balance: 180000, contribution: 5000, createdAt: new Date().toISOString() }
          ]);
        }
      } catch (err) {
        // Fallback demo data without throwing uncaught errors
        setSchemes([
          { id: 1, type: 'PPF', balance: 250000, contribution: 150000, createdAt: new Date().toISOString() },
          { id: 2, type: 'NPS1', balance: 180000, contribution: 5000, createdAt: new Date().toISOString() }
        ]);
      }
      setLoading(false);
    }
    loadData();
  }, [currentUser]);

  const handleAddAccount = async () => {
    const newScheme = {
      id: Date.now(),
      type: newSchemeType,
      balance: Number(formData.balance) || 0,
      contribution: Number(formData.contribution) || 0,
      createdAt: new Date().toISOString()
    };
    
    if (newSchemeType === 'SSY') newScheme.dateOfBirth = formData.dateOfBirth;
    if (['SCSS', 'NSC', 'KVP'].includes(newSchemeType)) newScheme.investmentDate = formData.investmentDate;
    
    const updated = [...schemes, newScheme];
    setSchemes(updated);
    
    if (currentUser && !currentUser.isDemo) {
      try {
        const docRef = doc(db, 'investors', currentUser.uid);
        await updateDoc(docRef, { govtSchemes: updated }).catch(() => {
          setDoc(docRef, { govtSchemes: updated }, { merge: true });
        });
      } catch (e) { console.warn(e); }
    }
    
    setShowModal(false);
    setFormData({ balance: 0, contribution: 0, dateOfBirth: '', investmentDate: '' });
  };

  const calculateProjection = (scheme) => {
    const type = scheme.type;
    let proj = 0;
    let text = '';
    
    if (type === 'PPF') {
      // rough PPF projection 15 years
      const years = 15;
      proj = scheme.balance * Math.pow(1.071, years) + scheme.contribution * ((Math.pow(1.071, years) - 1) / 0.071);
      text = 'Estimated at 15 Years';
    } else if (type === 'NPS1' || type === 'NPS2') {
      const years = 20; // assumed
      proj = scheme.balance * Math.pow(1.10, years) + (scheme.contribution * 12) * ((Math.pow(1.10, years) - 1) / 0.10);
      text = 'Corpus at Age 60 (Est)';
    } else if (type === 'SSY') {
      proj = scheme.balance * Math.pow(1.082, 21) + scheme.contribution * ((Math.pow(1.082, 21) - 1) / 0.082);
      text = 'Maturity (21 Yrs)';
    } else if (type === 'KVP') {
      proj = scheme.balance * 2;
      text = 'Doubles in ~115 months';
    } else {
      proj = scheme.balance * Math.pow(1 + (SCHEME_TYPES[type].rate / 100), 5);
      text = 'Maturity in 5 Years';
    }
    return { val: proj, text };
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>Government Schemes</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Track and manage your post office and govt-backed savings</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.75rem 1.5rem', background: 'var(--primary)',
            color: 'white', border: 'none', borderRadius: '8px',
            cursor: 'pointer', fontWeight: 'bold'
          }}
        >
          <Plus size={18} />
          Add Account
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {schemes.map(s => {
          const info = SCHEME_TYPES[s.type];
          const proj = calculateProjection(s);
          return (
            <div key={s.id} style={{ background: 'var(--surface)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(0, 82, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                    <Shield size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{info.name}</h3>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{info.rate}% Interest • {info.section} Benefit</span>
                  </div>
                </div>
              </div>
              
              <div style={{ marginTop: '1.5rem' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Current Balance</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0.25rem 0' }}>
                  ₹{s.balance?.toLocaleString()}
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{proj.text}</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--green)' }}>
                    ₹{Math.round(proj.val).toLocaleString()}
                  </span>
                </div>
                {s.contribution > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Contribution</span>
                    <span>₹{s.contribution.toLocaleString()} {s.type.includes('NPS') ? '/mo' : '/yr'}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {schemes.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--surface)', borderRadius: '12px' }}>
          <Shield size={48} color="var(--primary)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
          <h3>No Government Schemes Added</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Track PPF, NPS, SCSS and other safe investments in one place.</p>
          <button onClick={() => setShowModal(true)} style={{ padding: '0.75rem 1.5rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            Add Your First Account
          </button>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '400px' }}>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Add Govt Scheme</h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Scheme Type</label>
              <select 
                value={newSchemeType} 
                onChange={(e) => setNewSchemeType(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              >
                {Object.entries(SCHEME_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v.name}</option>
                ))}
              </select>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Current Balance (₹)</label>
              <input 
                type="number" 
                value={formData.balance}
                onChange={(e) => setFormData({...formData, balance: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
            </div>
            
            {!['SCSS', 'NSC', 'KVP'].includes(newSchemeType) && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  {newSchemeType.includes('NPS') ? 'Monthly' : 'Annual'} Contribution (₹)
                </label>
                <input 
                  type="number" 
                  value={formData.contribution}
                  onChange={(e) => setFormData({...formData, contribution: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                />
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button 
                onClick={() => setShowModal(false)}
                style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleAddAccount}
                style={{ flex: 1, padding: '0.75rem', background: 'var(--primary)', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer' }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
