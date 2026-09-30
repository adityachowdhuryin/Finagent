import { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

// Live real-time listener on the current user's profile document
export function useUserProfile() {
  const { currentUser, userRole } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || !userRole) { setLoading(false); return; }
    const collection = userRole === 'investor' ? 'investors' : 'advisors';
    const ref = doc(db, collection, currentUser.uid);
    const unsub = onSnapshot(ref, snap => {
      setProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [currentUser, userRole]);

  return { profile, loading };
}

// Live listener on investor portfolio specifically
export function usePortfolio() {
  const { currentUser } = useAuth();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) { setLoading(false); return; }
    const ref = doc(db, 'investors', currentUser.uid);
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) {
        const data = snap.data();
        setPortfolio({
          holdings: data.holdings || {},
          netWorth: data.netWorth || 0,
          goals: data.goals || [],
          insurance: data.insurance || [],
          loans: data.loans || [],
          sips: data.sips || [],
        });
      }
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [currentUser]);

  return { portfolio, loading };
}

// Fetch all clients of an advisor (one-time, refreshable)
export function useAdvisorClients() {
  const { currentUser, userProfile } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchClients() {
    if (!userProfile?.clients?.length) { setClients([]); setLoading(false); return; }
    try {
      const snapshots = await Promise.all(
        userProfile.clients.map(uid => getDocs(query(collection(db, 'investors'), where('__name__', '==', uid))))
      );
      setClients(snapshots.flatMap(s => s.docs.map(d => ({ id: d.id, ...d.data() }))));
    } catch { setClients([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchClients(); }, [userProfile]);

  return { clients, loading, refetch: fetchClients };
}
