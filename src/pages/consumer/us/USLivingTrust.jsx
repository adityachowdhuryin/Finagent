import React, { useState } from 'react';
import { FileText, Download, Check, Sparkles, Shield, ArrowRight, Home, DollarSign } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useApp } from '../../../context/AppContext';

export default function USLivingTrust() {
  const { state } = useApp();
  const [step, setStep] = useState(1);
  const [grantorName, setGrantorName] = useState(state.consumer?.user?.name || 'Alex Morgan');
  const [stateOfRes, setStateOfRes] = useState('California');
  const [county, setCounty] = useState('San Francisco County');
  const [successorTrustee, setSuccessorTrustee] = useState('Jordan Morgan');
  const [successorRelation, setSuccessorRelation] = useState('Sibling');
  const [primaryBeneficiary, setPrimaryBeneficiary] = useState('Jordan Morgan');
  const [primarySharePct, setPrimarySharePct] = useState(100);
  const [propertyAddress, setPropertyAddress] = useState('1240 Valencia St, San Francisco, CA 94110');
  const [brokerageName, setBrokerageName] = useState('Charles Schwab & Fidelity Accounts');
  const [generatedDoc, setGeneratedDoc] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerateTrust() {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/us-trust/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grantorName,
          stateOfResidence: stateOfRes,
          county,
          successorTrusteeName: successorTrustee,
          successorTrusteeRelation: successorRelation,
          beneficiaries: [
            { name: primaryBeneficiary, relation: 'Primary Beneficiary', sharePct: Number(primarySharePct) },
          ],
          realEstateProperties: [
            { address: propertyAddress, apnParcelNo: '3589-021' },
          ],
          brokerageAccounts: [
            { institution: brokerageName, accountType: 'Brokerage & Liquid Accounts' },
          ],
          executorName: successorTrustee,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedDoc(data);
        setStep(4);
      }
    } catch (err) {
      console.error('Trust generation error:', err);
    } finally {
      setLoading(false);
    }
  }

  function downloadTrustPDF() {
    if (!generatedDoc?.trustLegalText) return;
    const doc = new jsPDF();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    const splitText = doc.splitTextToSize(generatedDoc.trustLegalText, 180);
    doc.text(splitText, 14, 20);

    // Add new page for Pour-Over Will
    doc.addPage();
    const splitWill = doc.splitTextToSize(generatedDoc.pourOverWillText, 180);
    doc.text(splitWill, 14, 20);

    doc.save(`${grantorName.replace(/\s+/g, '_')}_Revocable_Living_Trust.pdf`);
  }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            <span>🇺🇸</span> ZERO PROBATE COURT ARCHITECTURE
          </div>
          <h1 className="text-h1">US Revocable Living Trust & Estate OS</h1>
          <p className="text-sm text-secondary mt-1">Bypass probate court fees (~4% statutory in CA), protect privacy, and ensure seamless asset transfer</p>
        </div>

        {generatedDoc && (
          <button onClick={downloadTrustPDF} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={14} /> Download Notarization PDF
          </button>
        )}
      </div>

      {/* Avoided Probate Fee Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08), var(--surface))',
        border: '1px solid rgba(34, 197, 94, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.5rem' }}>⚖️</span>
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>
              Bypasses Estimated $38,000 in California Statutory Probate Fees
            </div>
          </div>
          <p className="text-xs text-secondary" style={{ marginTop: 4, maxWidth: 620 }}>
            Under California Probate Code § 10810, estates with real property over $184,500 must go through probate court without a Living Trust. A Revocable Trust transfers real estate and brokerages privately and instantly.
          </p>
        </div>
        <span className="badge badge-green">100% Private (No Public Court Records)</span>
      </div>

      {/* Guided 4-Step Wizard */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
          {[
            { n: 1, label: 'Grantor & Jurisdiction' },
            { n: 2, label: 'Successor Trustee & Heirs' },
            { n: 3, label: 'Schedule A Property Funding' },
            { n: 4, label: 'Notarization Dossier' },
          ].map(s => (
            <button
              key={s.n}
              onClick={() => s.n < 4 && setStep(s.n)}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: step === s.n ? '2px solid var(--primary)' : '2px solid transparent',
                color: step === s.n ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.8rem',
                padding: '0.5rem 0.75rem',
                cursor: 'pointer',
              }}
            >
              Step {s.n}: {s.label}
            </button>
          ))}
        </div>

        {/* Step 1: Grantor & State */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 500 }}>
            <div>
              <label className="text-xs text-muted">Grantor Full Legal Name (You)</label>
              <input
                type="text"
                value={grantorName}
                onChange={e => setGrantorName(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '0.6rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontWeight: 600 }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="text-xs text-muted">State of Primary Residence</label>
                <input
                  type="text"
                  value={stateOfRes}
                  onChange={e => setStateOfRes(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '0.6rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="text-xs text-muted">County</label>
                <input
                  type="text"
                  value={county}
                  onChange={e => setCounty(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '0.6rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
            <button onClick={() => setStep(2)} className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}>
              Next: Successor Trustee & Heirs <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* Step 2: Successor Trustee & Heirs */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 500 }}>
            <div>
              <label className="text-xs text-muted">Successor Trustee (Takes over in event of incapacity or passing)</label>
              <input
                type="text"
                value={successorTrustee}
                onChange={e => setSuccessorTrustee(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '0.6rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontWeight: 600 }}
              />
            </div>
            <div>
              <label className="text-xs text-muted">Relationship to Successor Trustee</label>
              <input
                type="text"
                value={successorRelation}
                onChange={e => setSuccessorRelation(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '0.6rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="text-xs text-muted">Primary Beneficiary & Distribution %</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={primaryBeneficiary}
                  onChange={e => setPrimaryBeneficiary(e.target.value)}
                  style={{ flex: 1, padding: '0.6rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                />
                <input
                  type="number"
                  value={primarySharePct}
                  onChange={e => setPrimarySharePct(Number(e.target.value))}
                  style={{ width: 70, padding: '0.6rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', textAlign: 'center' }}
                />
                <span style={{ alignSelf: 'center', fontWeight: 700 }}>%</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button onClick={() => setStep(1)} className="btn btn-secondary">Back</button>
              <button onClick={() => setStep(3)} className="btn btn-primary">
                Next: Property Funding <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Schedule A Property Funding */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 500 }}>
            <div>
              <label className="text-xs text-muted">Primary Residence Real Estate Address</label>
              <input
                type="text"
                value={propertyAddress}
                onChange={e => setPropertyAddress(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '0.6rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="text-xs text-muted">Brokerage & Investment Accounts</label>
              <input
                type="text"
                value={brokerageName}
                onChange={e => setBrokerageName(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '0.6rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button onClick={() => setStep(2)} className="btn btn-secondary">Back</button>
              <button onClick={handleGenerateTrust} disabled={loading} className="btn btn-primary">
                {loading ? 'Compiling Legal Trust...' : 'Generate Legal Trust & Pour-Over Will'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Complete & Preview */}
        {step === 4 && generatedDoc && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 className="text-h3">{generatedDoc.trustName}</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ready for execution before a certified Notary Public and two attesting witnesses</div>
              </div>
              <button onClick={downloadTrustPDF} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Download size={14} /> Download Complete Legal PDF
              </button>
            </div>

            <pre style={{
              background: 'var(--surface-raised)',
              padding: '1.25rem',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--glass-border)',
              fontSize: '0.75rem',
              lineHeight: 1.6,
              maxHeight: 280,
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              color: 'var(--text-secondary)'
            }}>
              {generatedDoc.trustLegalText}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
