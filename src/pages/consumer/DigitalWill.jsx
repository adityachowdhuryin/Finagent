import React, { useState } from 'react';
import {
  FileText, Shield, Download, Copy, Check, Sparkles, User, Users,
  HeartHandshake, ChevronRight, ChevronLeft, Landmark, Home, Globe
} from 'lucide-react';
import { jsPDF } from 'jspdf';

const DEFAULT_STATE = {
  testator: {
    fullName: 'Arjun Sharma',
    fatherName: 'Ramesh Sharma',
    age: 38,
    pan: 'ABCPS1234F',
    address: 'Flat 402, Green Glen Layout, Bellandur, Bengaluru, Karnataka 560103',
  },
  executors: [
    { name: 'Priya Sharma', relation: 'Spouse', isAlternate: false },
    { name: 'Vikram Sharma', relation: 'Brother', isAlternate: true },
  ],
  guardian: {
    name: 'Sunita Sharma',
    relation: 'Maternal Grandmother',
    minorNames: 'Aarav Sharma',
  },
  assets: [
    { category: 'Demat / Stocks & Mutual Funds', identifier: 'Zerodha Demat (BO ID: 1208160012345678)', beneficiary: 'Priya Sharma (Spouse)', sharePct: 100 },
    { category: 'Bank Accounts & FDs', identifier: 'HDFC Bank A/C No. 50100234567890 & FDs', beneficiary: 'Priya Sharma (Spouse)', sharePct: 100 },
    { category: 'Real Estate / Property', identifier: 'Apartment 402, Green Glen, Bellandur', beneficiary: 'Priya Sharma (50%) & Aarav Sharma (50%)', sharePct: 100 },
    { category: 'Digital & Cloud Accounts', identifier: 'Google Cloud, Apple ID, Financial Portals', beneficiary: 'Priya Sharma (Spouse)', sharePct: 100 },
  ],
  witnesses: [
    { name: 'Dr. Rajesh Nair', address: 'Indiranagar, Bengaluru' },
    { name: 'Ananya Deshmukh', address: 'Koramangala, Bengaluru' },
  ],
};

export default function DigitalWill() {
  const [data, setData] = useState(DEFAULT_STATE);
  const [step, setStep] = useState(1);
  const [generatedWill, setGeneratedWill] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch('/api/will/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        setGeneratedWill(json.data);
        setStep(5); // Jump to preview
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function downloadWillPDF() {
    if (!generatedWill) return;
    const doc = new jsPDF();
    const margin = 18;
    let y = 20;

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('LAST WILL AND TESTAMENT', 105, y, { align: 'center' });
    y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`OF ${data.testator.fullName.toUpperCase()}`, 105, y, { align: 'center' });
    y += 12;

    doc.setFontSize(9);
    const p1 = `I, ${data.testator.fullName}, aged about ${data.testator.age} years, son/daughter of ${data.testator.fatherName}, residing at ${data.testator.address}, holding PAN ${data.testator.pan}, do hereby make, publish and declare this to be my Last Will and Testament, hereby revoking all prior Wills and Codicils made by me heretofore.`;
    const splitP1 = doc.splitTextToSize(p1, 174);
    doc.text(splitP1, margin, y);
    y += splitP1.length * 5 + 6;

    // Clause 1
    doc.setFont('helvetica', 'bold');
    doc.text('1. DECLARATION OF SOUND MIND', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    const p2 = 'I declare that I am in sound health and disposing state of mind, and am making this Will voluntarily, of my own free will and accord, without any coercion, duress, or undue influence from anyone whatsoever.';
    const splitP2 = doc.splitTextToSize(p2, 174);
    doc.text(splitP2, margin, y);
    y += splitP2.length * 5 + 6;

    // Clause 2
    doc.setFont('helvetica', 'bold');
    doc.text('2. APPOINTMENT OF EXECUTORS', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    const p3 = `I hereby nominate and appoint ${data.executors[0]?.name || 'my spouse'} as the sole Executor of this my Will. In case of their inability or pre-decease, I nominate ${data.executors[1]?.name || 'my sibling'} as the Alternate Executor.`;
    const splitP3 = doc.splitTextToSize(p3, 174);
    doc.text(splitP3, margin, y);
    y += splitP3.length * 5 + 6;

    // Clause 3
    doc.setFont('helvetica', 'bold');
    doc.text('3. ASSET BEQUESTS AND ALLOCATION', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    data.assets.forEach((a, i) => {
      const line = `(${i + 1}) ${a.category}: ${a.identifier} -> Bequeathed to ${a.beneficiary} (${a.sharePct}%)`;
      const splitLine = doc.splitTextToSize(line, 170);
      doc.text(splitLine, margin + 4, y);
      y += splitLine.length * 4.5 + 2;
    });

    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('4. WITNESS EXECUTION CLAUSE', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.text(`Signed and executed by the Testator on this ${dateStr}.`, margin, y);
    y += 15;

    doc.text('________________________________________', margin, y);
    doc.text('TESTATOR SIGNATURE', margin, y + 5);

    y += 20;
    doc.text('WITNESS 1:', margin, y);
    doc.text(`Name: ${data.witnesses[0]?.name || ''}`, margin, y + 5);
    doc.text('Signature: __________________________', margin, y + 10);

    doc.text('WITNESS 2:', 110, y);
    doc.text(`Name: ${data.witnesses[1]?.name || ''}`, 110, y + 5);
    doc.text('Signature: __________________________', 110, y + 10);

    doc.save(`Last_Will_${data.testator.fullName.replace(/\s+/g, '_')}.pdf`);
  }

  function copyText() {
    if (!generatedWill?.legalDraftText) return;
    navigator.clipboard.writeText(generatedWill.legalDraftText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="page-container" style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <FileText size={24} color="var(--primary)" />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Legal Digital Will & Estate Dossier</h1>
            <span className="badge" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
              Indian Succession Act, 1925
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
            Ensure hassle-free succession of your demat portfolios, bank deposits, and digital accounts without court disputes.
          </p>
        </div>

        <button onClick={() => { setData(DEFAULT_STATE); setTimeout(handleGenerate, 50); }} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sparkles size={14} /> Try Sample Family Will
        </button>
      </div>

      {/* Progress Steps */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {[
          { num: 1, label: '1. Testator Details' },
          { num: 2, label: '2. Executors & Guardian' },
          { num: 3, label: '3. Asset Distribution' },
          { num: 4, label: '4. Witnesses' },
          { num: 5, label: '5. Legal Draft & PDF' },
        ].map(s => (
          <button
            key={s.num}
            onClick={() => setStep(s.num)}
            className={`btn btn-sm ${step === s.num ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem', whiteSpace: 'nowrap' }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Step Content */}
      <div className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
        {step === 1 && (
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} color="var(--primary)" /> Testator Identity & Declaration
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Full Legal Name (as on PAN/Aadhaar)</label>
                <input
                  type="text"
                  className="input"
                  value={data.testator.fullName}
                  onChange={e => setData({ ...data, testator: { ...data.testator, fullName: e.target.value } })}
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Son / Daughter of</label>
                <input
                  type="text"
                  className="input"
                  value={data.testator.fatherName}
                  onChange={e => setData({ ...data, testator: { ...data.testator, fatherName: e.target.value } })}
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Age (Years)</label>
                <input
                  type="number"
                  className="input"
                  value={data.testator.age}
                  onChange={e => setData({ ...data, testator: { ...data.testator, age: Number(e.target.value) } })}
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PAN Number</label>
                <input
                  type="text"
                  className="input"
                  value={data.testator.pan}
                  onChange={e => setData({ ...data, testator: { ...data.testator, pan: e.target.value } })}
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                />
              </div>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Permanent Residential Address</label>
              <input
                type="text"
                className="input"
                value={data.testator.address}
                onChange={e => setData({ ...data, testator: { ...data.testator, address: e.target.value } })}
                style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setStep(2)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                Next: Executors <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} color="var(--primary)" /> Appointment of Executors & Minor Guardian
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'var(--surface-raised)', borderRadius: 10, padding: '1rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-light)', marginBottom: '0.5rem' }}>Primary Executor</div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Name & Relationship</label>
                <input
                  type="text"
                  className="input"
                  value={data.executors[0]?.name || ''}
                  onChange={e => {
                    const ex = [...data.executors];
                    ex[0] = { ...ex[0], name: e.target.value };
                    setData({ ...data, executors: ex });
                  }}
                  style={{ width: '100%', padding: '0.45rem', marginTop: '0.2rem', marginBottom: '0.5rem' }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Responsible for executing the will and distributing assets.</span>
              </div>

              <div style={{ background: 'var(--surface-raised)', borderRadius: 10, padding: '1rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#4ade80', marginBottom: '0.5rem' }}>Alternate Executor</div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Name & Relationship</label>
                <input
                  type="text"
                  className="input"
                  value={data.executors[1]?.name || ''}
                  onChange={e => {
                    const ex = [...data.executors];
                    ex[1] = { ...ex[1], name: e.target.value };
                    setData({ ...data, executors: ex });
                  }}
                  style={{ width: '100%', padding: '0.45rem', marginTop: '0.2rem', marginBottom: '0.5rem' }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Takes over if primary executor is unable or predeceases.</span>
              </div>
            </div>

            <div style={{ background: 'var(--surface-raised)', borderRadius: 10, padding: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f59e0b', marginBottom: '0.5rem' }}>Guardian for Minor Children</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Guardian Name</label>
                  <input
                    type="text"
                    className="input"
                    value={data.guardian.name}
                    onChange={e => setData({ ...data, guardian: { ...data.guardian, name: e.target.value } })}
                    style={{ width: '100%', padding: '0.45rem', marginTop: '0.2rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Minor Child Name(s)</label>
                  <input
                    type="text"
                    className="input"
                    value={data.guardian.minorNames}
                    onChange={e => setData({ ...data, guardian: { ...data.guardian, minorNames: e.target.value } })}
                    style={{ width: '100%', padding: '0.45rem', marginTop: '0.2rem' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(1)} className="btn btn-secondary">
                <ChevronLeft size={16} /> Back
              </button>
              <button onClick={() => setStep(3)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                Next: Asset Distribution <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Landmark size={18} color="var(--primary)" /> Asset Distribution Register
            </h3>
            <div style={{ marginBottom: '1.5rem' }}>
              {data.assets.map((a, i) => (
                <div key={i} style={{ background: 'var(--surface-raised)', borderRadius: 10, padding: '1rem', marginBottom: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '0.75rem', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-light)' }}>{a.category}</span>
                  </div>
                  <div>
                    <input
                      type="text"
                      className="input"
                      value={a.identifier}
                      onChange={e => {
                        const newAssets = [...data.assets];
                        newAssets[i] = { ...newAssets[i], identifier: e.target.value };
                        setData({ ...data, assets: newAssets });
                      }}
                      style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem' }}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      className="input"
                      value={a.beneficiary}
                      onChange={e => {
                        const newAssets = [...data.assets];
                        newAssets[i] = { ...newAssets[i], beneficiary: e.target.value };
                        setData({ ...data, assets: newAssets });
                      }}
                      style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem' }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(2)} className="btn btn-secondary">
                <ChevronLeft size={16} /> Back
              </button>
              <button onClick={() => setStep(4)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                Next: Witnesses <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HeartHandshake size={18} color="var(--primary)" /> Two Witnesses Requirement (Section 63)
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Under Indian law, a Will MUST be attested by <strong>two independent witnesses</strong> who physically see you sign. A beneficiary should NEVER be a witness.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {data.witnesses.map((w, i) => (
                <div key={i} style={{ background: 'var(--surface-raised)', borderRadius: 10, padding: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Witness {i + 1}</div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Full Legal Name</label>
                  <input
                    type="text"
                    className="input"
                    value={w.name}
                    onChange={e => {
                      const wit = [...data.witnesses];
                      wit[i] = { ...wit[i], name: e.target.value };
                      setData({ ...data, witnesses: wit });
                    }}
                    style={{ width: '100%', padding: '0.45rem', marginTop: '0.2rem', marginBottom: '0.5rem' }}
                  />
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>City / Address</label>
                  <input
                    type="text"
                    className="input"
                    value={w.address}
                    onChange={e => {
                      const wit = [...data.witnesses];
                      wit[i] = { ...wit[i], address: e.target.value };
                      setData({ ...data, witnesses: wit });
                    }}
                    style={{ width: '100%', padding: '0.45rem', marginTop: '0.2rem' }}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(3)} className="btn btn-secondary">
                <ChevronLeft size={16} /> Back
              </button>
              <button onClick={handleGenerate} disabled={loading} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={16} /> {loading ? 'Compiling Legal Will…' : 'Generate Legal Will Draft'}
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                Formal Indian Last Will & Testament
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={copyText} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  {copied ? <Check size={14} color="#4ade80" /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy Text'}
                </button>
                <button onClick={downloadWillPDF} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Download size={14} /> Download Notarization-Ready PDF
                </button>
              </div>
            </div>

            <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: '1.5rem', fontFamily: 'monospace', fontSize: '0.8rem', lineHeight: 1.6, maxHeight: 400, overflowY: 'auto', whiteSpace: 'pre-wrap', color: 'var(--text-primary)', marginBottom: '1rem' }}>
              {generatedWill?.legalDraftText || 'Draft loading...'}
            </div>

            <div style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.25)', borderRadius: 10, padding: '1rem', fontSize: '0.8rem', color: 'var(--green)' }}>
              <strong>Next Steps to Make It Binding:</strong> Print this document on plain A4 paper, sign in ink in the presence of both witnesses, and store a signed copy in your <strong>FinAgent Family Emergency Vault</strong>. Registration at your local Sub-Registrar is optional but recommended.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
