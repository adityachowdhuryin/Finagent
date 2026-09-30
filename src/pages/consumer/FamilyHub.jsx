import React, { useState, useEffect } from 'react';
import {
  Users, UserPlus, Shield, TrendingUp, DollarSign, Award,
  ArrowRight, CheckCircle2, AlertCircle, X, Sparkles, Building2, Heart
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#6366f1', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'];

export default function FamilyHub() {
  const [profiles, setProfiles] = useState([]);
  const [selectedId, setSelectedId] = useState('all');
  const [taxData, setTaxData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    pan: '',
    relationship: 'Spouse',
    isSeniorCitizen: false,
    netWorth: '',
    annualIncome: '',
  });

  useEffect(() => {
    fetchFamilyData();
  }, []);

  async function fetchFamilyData() {
    setLoading(true);
    try {
      const [pRes, tRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/family/profiles`),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/family/optimize-tax`, { method: 'POST' }),
      ]);
      const pData = await pRes.json();
      const tData = await tRes.json();
      if (pData.success) setProfiles(pData.profiles || []);
      if (tData.success) setTaxData(tData);
    } catch (e) {
      console.error('Failed to load family hub data:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMember(e) {
    e.preventDefault();
    if (!newMember.name || !newMember.pan) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/family/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setNewMember({ name: '', pan: '', relationship: 'Spouse', isSeniorCitizen: false, netWorth: '', annualIncome: '' });
        fetchFamilyData();
      }
    } catch (err) {
      alert('Failed to add family member: ' + err.message);
    }
  }

  const formatINR = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

  const totalFamilyNetWorth = profiles.reduce((s, p) => s + (p.netWorth || 0), 0);
  const activeProfile = selectedId === 'all' ? null : profiles.find(p => p.id === selectedId);

  const pieData = profiles.map(p => ({
    name: p.name.split(' ')[0],
    value: p.netWorth,
  }));

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.75rem' }}>👨‍👩‍👧‍👦</span>
            <h1 className="text-h1">Multi-PAN Family Office Hub</h1>
          </div>
          <p className="text-sm text-secondary">
            Consolidate your family's net worth across multiple PANs (Self, Spouse, HUF, Parents) and unlock cross-PAN tax arbitrage.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <UserPlus size={16} /> Add Family Member
        </button>
      </div>

      {/* Member Switcher Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        paddingBottom: '0.25rem',
        borderBottom: '1px solid var(--glass-border)'
      }}>
        <button
          onClick={() => setSelectedId('all')}
          style={{
            padding: '0.625rem 1.125rem',
            background: selectedId === 'all' ? 'var(--primary)' : 'var(--surface)',
            color: selectedId === 'all' ? 'white' : 'var(--text-secondary)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius)',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem'
          }}
        >
          <Users size={16} /> Consolidated Family ({profiles.length})
        </button>

        {profiles.map(p => (
          <button
            key={p.id}
            onClick={() => setSelectedId(p.id)}
            style={{
              padding: '0.625rem 1.125rem',
              background: selectedId === p.id ? 'var(--primary)' : 'var(--surface)',
              color: selectedId === p.id ? 'white' : 'var(--text-secondary)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius)',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span>{p.relationship === 'HUF' ? '🏛️' : p.isSeniorCitizen ? '👴' : '👤'}</span>
            <span>{p.name.split('(')[0].trim()}</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.8, fontFamily: 'Space Grotesk' }}>
              ({formatINR(p.netWorth)})
            </span>
          </button>
        ))}
      </div>

      {/* Top Banner: Inter-PAN Tax Arbitrage */}
      {taxData && taxData.suggestions?.length > 0 && (
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(15, 15, 35, 0.95))',
          border: '1px solid rgba(16, 185, 129, 0.3)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.2rem 0.6rem', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--green)', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                <Sparkles size={14} /> CROSS-PAN TAX ARBITRAGE DETECTED
              </div>
              <h3 className="text-h2">
                Potential Family Tax Savings: <span style={{ color: 'var(--green)', fontFamily: 'Space Grotesk' }}>{formatINR(taxData.totalPotentialTaxSaved)}</span>
              </h3>
            </div>
            <span className="badge badge-green">{taxData.suggestions.length} High-Impact Actions</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.875rem' }}>
            {taxData.suggestions.map(s => (
              <div key={s.id} style={{
                background: 'var(--surface)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.5rem'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                    <span className="badge badge-surface" style={{ fontSize: '0.6875rem' }}>{s.category}</span>
                    <span style={{ fontFamily: 'Space Grotesk', fontWeight: 800, color: 'var(--green)', fontSize: '0.9rem' }}>
                      Save +{formatINR(s.taxSaved)}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.25rem' }}>{s.title}</div>
                  <p className="text-xs text-secondary" style={{ lineHeight: 1.5 }}>{s.description}</p>
                </div>
                <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--glass-border)22', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                  👉 {s.action}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main View: Consolidated vs Individual */}
      {selectedId === 'all' ? (
        <>
          {/* Consolidated KPI Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="card">
              <div className="text-xs text-muted" style={{ textTransform: 'uppercase' }}>Consolidated Family Net Worth</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--primary)', marginTop: '0.375rem' }}>
                {formatINR(totalFamilyNetWorth)}
              </div>
              <div className="text-xs text-secondary" style={{ marginTop: '0.25rem' }}>Across {profiles.length} family legal entities</div>
            </div>

            <div className="card">
              <div className="text-xs text-muted" style={{ textTransform: 'uppercase' }}>Equities Across Family</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Space Grotesk', marginTop: '0.375rem' }}>
                {formatINR(profiles.reduce((s, p) => s + (p.holdings?.equities || 0), 0))}
              </div>
              <div className="text-xs text-secondary" style={{ marginTop: '0.25rem' }}>Direct stocks exposure</div>
            </div>

            <div className="card">
              <div className="text-xs text-muted" style={{ textTransform: 'uppercase' }}>Mutual Funds Across Family</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Space Grotesk', marginTop: '0.375rem' }}>
                {formatINR(profiles.reduce((s, p) => s + (p.holdings?.mutualFunds || 0), 0))}
              </div>
              <div className="text-xs text-secondary" style={{ marginTop: '0.25rem' }}>Combined portfolio</div>
            </div>

            <div className="card">
              <div className="text-xs text-muted" style={{ textTransform: 'uppercase' }}>Family Fixed Deposits</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: 'var(--gold)', marginTop: '0.375rem' }}>
                {formatINR(profiles.reduce((s, p) => s + (p.holdings?.fixedDeposits || 0), 0))}
              </div>
              <div className="text-xs text-secondary" style={{ marginTop: '0.25rem' }}>Safe debt cushion</div>
            </div>
          </div>

          {/* Wealth Distribution by Member */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            <div className="card">
              <h3 className="text-h3" style={{ marginBottom: '0.25rem' }}>Family Wealth Ownership</h3>
              <p className="text-xs text-secondary" style={{ marginBottom: '1rem' }}>Net worth distribution among family PAN holders</p>
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => [formatINR(val), 'Net Worth']} contentStyle={{ background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Member Summary List */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h3 className="text-h3" style={{ marginBottom: '0.25rem' }}>Family Entity Summary</h3>
              {profiles.map((p, idx) => (
                <div key={p.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  background: 'var(--surface-raised)',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: `4px solid ${COLORS[idx % COLORS.length]}`
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.name}</div>
                    <div className="text-xs text-muted">
                      PAN: {p.pan} · <span style={{ color: 'var(--primary)' }}>{p.relationship}</span>
                      {p.isSeniorCitizen && <span style={{ color: 'var(--gold)', marginLeft: 6 }}>• Senior Citizen</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.05rem' }}>{formatINR(p.netWorth)}</div>
                    <div className="text-xs text-secondary">{((p.netWorth / totalFamilyNetWorth) * 100).toFixed(1)}% of total</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : activeProfile ? (
        /* Individual PAN View */
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 className="text-h2">{activeProfile.name}</h2>
                <span className="badge badge-surface">PAN: {activeProfile.pan}</span>
                {activeProfile.isSeniorCitizen && <span className="badge badge-gold">Senior Citizen (Age 60+)</span>}
              </div>
              <div className="text-xs text-muted" style={{ marginTop: 4 }}>Role: {activeProfile.relationship}</div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div className="text-xs text-muted">Net Worth Under This PAN</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--primary)' }}>
                {formatINR(activeProfile.netWorth)}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)' }}>
              <div className="text-xs text-muted">Equities</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'Space Grotesk', marginTop: 4 }}>
                {formatINR(activeProfile.holdings?.equities)}
              </div>
            </div>
            <div style={{ padding: '1rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)' }}>
              <div className="text-xs text-muted">Mutual Funds</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'Space Grotesk', marginTop: 4 }}>
                {formatINR(activeProfile.holdings?.mutualFunds)}
              </div>
            </div>
            <div style={{ padding: '1rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)' }}>
              <div className="text-xs text-muted">Fixed Deposits</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'Space Grotesk', marginTop: 4 }}>
                {formatINR(activeProfile.holdings?.fixedDeposits)}
              </div>
            </div>
            <div style={{ padding: '1rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)' }}>
              <div className="text-xs text-muted">Unused ₹1.25L LTCG Exemption</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'Space Grotesk', color: 'var(--green)', marginTop: 4 }}>
                {formatINR(activeProfile.taxMetrics?.ltcgExemptionRemaining)}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Add Member Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '1.5rem',
            maxWidth: 480, width: '100%', position: 'relative', border: '1px solid var(--glass-border)'
          }}>
            <button
              onClick={() => setShowModal(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={20} />
            </button>

            <h2 className="text-h2" style={{ marginBottom: '0.25rem' }}>Add Family Member</h2>
            <p className="text-xs text-secondary" style={{ marginBottom: '1.25rem' }}>Link a spouse, parent, child, or HUF to enable consolidated wealth tracking & tax optimization.</p>

            <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <label className="text-xs text-muted">Full Legal Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Pooja Chowdhury"
                  value={newMember.name}
                  onChange={e => setNewMember({ ...newMember, name: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.5rem 0.75rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', marginTop: 4 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="text-xs text-muted">PAN Number</label>
                  <input
                    required
                    type="text"
                    maxLength={10}
                    placeholder="ABCDE1234F"
                    value={newMember.pan}
                    onChange={e => setNewMember({ ...newMember, pan: e.target.value.toUpperCase() })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.5rem 0.75rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', textTransform: 'uppercase', marginTop: 4 }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted">Relationship</label>
                  <select
                    value={newMember.relationship}
                    onChange={e => setNewMember({ ...newMember, relationship: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.5rem 0.75rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', marginTop: 4 }}
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="HUF">HUF</option>
                    <option value="Parent">Parent</option>
                    <option value="Child">Child (Minor/Major)</option>
                    <option value="Sibling">Sibling</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="text-xs text-muted">Estimated Net Worth (₹)</label>
                  <input
                    type="number"
                    placeholder="1000000"
                    value={newMember.netWorth}
                    onChange={e => setNewMember({ ...newMember, netWorth: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.5rem 0.75rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', marginTop: 4 }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted">Annual Income (₹)</label>
                  <input
                    type="number"
                    placeholder="800000"
                    value={newMember.annualIncome}
                    onChange={e => setNewMember({ ...newMember, annualIncome: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.5rem 0.75rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', marginTop: 4 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 4 }}>
                <input
                  type="checkbox"
                  id="senior"
                  checked={newMember.isSeniorCitizen}
                  onChange={e => setNewMember({ ...newMember, isSeniorCitizen: e.target.checked })}
                />
                <label htmlFor="senior" className="text-xs text-secondary">
                  Senior Citizen (Age 60+ — eligible for Section 80TTB & higher slab benefits)
                </label>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                Save Member & Re-calculate Arbitrage
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
