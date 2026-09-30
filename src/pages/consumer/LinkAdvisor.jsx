import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { Search, Link as LinkIcon, CheckCircle, XCircle } from 'lucide-react';

export default function LinkAdvisor() {
  const { user, userProfile } = useAuth();
  const uid = user?.uid;
  const [activeTab, setActiveTab] = useState('code'); // code, search, invite
  const [code, setCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [linkedAdvisor, setLinkedAdvisor] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    // Check URL for invite code
    const urlParams = new URLSearchParams(window.location.search);
    const inviteCode = urlParams.get('code');
    if (inviteCode) {
      setCode(inviteCode.toUpperCase());
      setActiveTab('code');
    }
  }, []);

  useEffect(() => {
    const fetchLinkedAdvisor = async () => {
      if (!userProfile?.linkedAdvisorId) {
        setLinkedAdvisor(null);
        return;
      }
      const advDoc = await getDoc(doc(db, 'advisors', userProfile.linkedAdvisorId));
      if (advDoc.exists()) {
        setLinkedAdvisor({ id: advDoc.id, ...advDoc.data() });
      }
    };
    if (userProfile) fetchLinkedAdvisor();
  }, [userProfile]);

  const handleFindAdvisor = async () => {
    if (!code) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'advisors'), where('advisorCode', '==', code.toUpperCase()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setSearchResults(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } else {
        setSearchResults([]);
        showToast('No advisor found with this code');
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSearchAdvisors = async () => {
    if (!searchQuery) return;
    setLoading(true);
    try {
      // Basic search by sebiRegNo first
      let q = query(collection(db, 'advisors'), where('sebiRegNo', '==', searchQuery.toUpperCase()));
      let snap = await getDocs(q);
      
      if (snap.empty) {
        // Fallback to name search
        q = query(collection(db, 'advisors'), where('name', '>=', searchQuery), where('name', '<=', searchQuery + '\uf8ff'));
        snap = await getDocs(q);
      }
      
      if (!snap.empty) {
        setSearchResults(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } else {
        setSearchResults([]);
        showToast('No advisors found. Try a different name or SEBI number.');
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSendRequest = async (advisor) => {
    try {
      const now = new Date().toISOString();
      await setDoc(doc(db, 'advisors', advisor.id, 'pendingLinks', uid), {
        investorId: uid,
        investorName: userProfile?.name || 'Anonymous',
        investorEmail: user?.email || '',
        timestamp: now,
        status: 'pending'
      });
      showToast(`Request sent to ${advisor.name}! They'll accept within 24 hours.`);
    } catch (e) {
      console.error(e);
      showToast('Error sending request');
    }
  };

  const handleUnlink = async () => {
    if (!uid) return;
    try {
      await updateDoc(doc(db, 'investors', uid), { linkedAdvisorId: null });
      setLinkedAdvisor(null);
      showToast('Advisor unlinked successfully');
    } catch (e) { console.error(e); }
  };

  const handleInviteLinkPaste = (e) => {
    const text = e.target.value;
    try {
      const url = new URL(text);
      const extractedCode = url.searchParams.get('code');
      if (extractedCode) {
        setCode(extractedCode.toUpperCase());
        setActiveTab('code');
      }
    } catch (err) {
      // Not a valid URL, ignore
    }
  };

  const styles = {
    page: { padding: '32px 24px', maxWidth: 800, margin: '0 auto' },
    card: { background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 24, marginBottom: 24 },
    tabs: { display: 'flex', gap: 16, borderBottom: '1px solid var(--glass-border)', marginBottom: 24 },
    tab: (active) => ({ padding: '12px 0', fontWeight: 600, color: active ? 'var(--primary)' : 'var(--text-muted)', borderBottom: active ? '2px solid var(--primary)' : 'none', cursor: 'pointer', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', fontSize: 15 }),
    input: { width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', background: 'var(--surface-raised)', color: 'var(--text-primary)', marginBottom: 16, fontSize: 15 },
    advisorCard: { display: 'flex', alignItems: 'center', gap: 16, padding: 16, border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', background: 'var(--surface-raised)', marginBottom: 12 },
    avatar: { width: 48, height: 48, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 },
    toast: { position: 'fixed', bottom: 30, right: 30, background: 'var(--green)', color: '#fff', padding: '12px 24px', borderRadius: 'var(--radius)', fontWeight: 600, zIndex: 9999 },
  };

  return (
    <div style={styles.page}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Link with your Advisor</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Connect with your financial advisor to share your portfolio and goals.</p>

      {linkedAdvisor && (
        <div style={{ ...styles.card, borderColor: 'var(--primary)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><CheckCircle size={18} /> Currently Linked Advisor</div>
          <div style={styles.advisorCard}>
            <div style={styles.avatar}>{linkedAdvisor.name?.slice(0, 2).toUpperCase()}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{linkedAdvisor.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{linkedAdvisor.firm || 'Independent'} • SEBI: {linkedAdvisor.sebiRegNo || 'N/A'}</div>
            </div>
            <button className="btn btn-ghost" onClick={handleUnlink} style={{ color: 'var(--red)' }}>Unlink</button>
          </div>
        </div>
      )}

      <div style={styles.card}>
        <div style={styles.tabs}>
          <button style={styles.tab(activeTab === 'code')} onClick={() => { setActiveTab('code'); setSearchResults([]); }}>Enter Code</button>
          <button style={styles.tab(activeTab === 'search')} onClick={() => { setActiveTab('search'); setSearchResults([]); }}>Search Advisors</button>
          <button style={styles.tab(activeTab === 'invite')} onClick={() => { setActiveTab('invite'); setSearchResults([]); }}>Invite Link</button>
        </div>

        {activeTab === 'code' && (
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>6-Character Advisor Code</label>
            <div style={{ display: 'flex', gap: 12 }}>
              <input 
                style={{ ...styles.input, textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'monospace', fontSize: 18 }} 
                value={code} 
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))} 
                placeholder="E.g. MEERA7" 
                maxLength={6} 
              />
              <button className="btn btn-primary" onClick={handleFindAdvisor} disabled={loading || code.length < 6} style={{ marginBottom: 16 }}>
                {loading ? 'Searching...' : 'Find Advisor'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Search by Name or SEBI Reg No</label>
            <div style={{ display: 'flex', gap: 12 }}>
              <input 
                style={styles.input} 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                placeholder="E.g. INA000014523 or Rahul" 
                onKeyDown={(e) => e.key === 'Enter' && handleSearchAdvisors()}
              />
              <button className="btn btn-primary" onClick={handleSearchAdvisors} disabled={loading || !searchQuery} style={{ marginBottom: 16 }}>
                <Search size={18} />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'invite' && (
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Have an invite link? Paste it here</label>
            <input 
              style={styles.input} 
              placeholder="https://finagent.app/link?code=..." 
              onChange={handleInviteLinkPaste} 
            />
          </div>
        )}

        {searchResults.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Results</h3>
            {searchResults.map(adv => (
              <div key={adv.id} style={styles.advisorCard}>
                <div style={styles.avatar}>{adv.name?.slice(0, 2).toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{adv.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{adv.firm || 'Independent'} • SEBI: {adv.sebiRegNo || 'N/A'}</div>
                </div>
                <button className="btn btn-primary" onClick={() => handleSendRequest(adv)} disabled={linkedAdvisor?.id === adv.id}>
                  {linkedAdvisor?.id === adv.id ? 'Already Linked' : 'Send Request'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {toast && <div style={styles.toast}>{toast}</div>}
    </div>
  );
}
