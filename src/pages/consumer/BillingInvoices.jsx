import React, { useState, useEffect } from 'react';
import {
  CreditCard, Download, FileText, CheckCircle2, ShieldCheck,
  Building, Calendar, DollarSign, Award, RefreshCw
} from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function BillingInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/billing/invoices')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setInvoices(data.invoices);
          setCompany(data.company);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function downloadInvoicePDF(inv) {
    const doc = new jsPDF();
    const margin = 16;
    let y = 18;

    // Header Box
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('TAX INVOICE', margin, 18);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Issued under Rule 46 of Central Goods and Services Tax (CGST) Rules, 2017', margin, 25);

    // Supplier & Invoice Metadata
    y = 44;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(company?.legalName || 'FinAgent Technologies Pvt Ltd', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(company?.address || 'Koramangala, Bengaluru, Karnataka 560034', margin, y + 5);
    doc.text(`GSTIN: ${company?.gstin || '29AABCU9603R1ZM'} | PAN: ${company?.pan || 'AABCU9603R'}`, margin, y + 10);
    doc.text(`State: Karnataka (Code: 29)`, margin, y + 15);

    // Invoice Meta Right-aligned
    doc.setFont('helvetica', 'bold');
    doc.text(`Invoice No: ${inv.invoiceNumber}`, 140, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice Date: ${inv.date}`, 140, y + 5);
    doc.text(`Payment Mode: ${inv.paymentMethod}`, 140, y + 10);
    doc.text(`Status: PAID`, 140, y + 15);

    // Bill To
    y = 75;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y - 5, 210 - margin, y - 5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('BILL TO (CUSTOMER):', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${inv.customerName}`, margin, y + 5);
    doc.text(`Email: ${inv.customerEmail}`, margin, y + 10);
    doc.text(`Place of Supply: Karnataka (Code 29)`, margin, y + 15);

    // Table Header
    y = 105;
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, 178, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Description of Service', margin + 4, y + 5.5);
    doc.text('SAC Code', 110, y + 5.5);
    doc.text('Taxable Value (INR)', 135, y + 5.5);
    doc.text('Total (INR)', 175, y + 5.5);

    // Table Row
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.text(inv.planName, margin + 4, y);
    doc.text(company?.sacCode || '998314', 110, y);
    doc.text(`INR ${inv.baseAmountINR.toLocaleString('en-IN')}`, 135, y);
    doc.text(`INR ${inv.grossAmountINR.toLocaleString('en-IN')}`, 175, y);

    // Tax Breakdown Box
    y = 145;
    doc.line(margin, y, 210 - margin, y);
    y += 8;
    doc.text(`Taxable Amount:`, 130, y);
    doc.text(`INR ${inv.baseAmountINR.toLocaleString('en-IN')}`, 175, y);
    y += 6;
    doc.text(`CGST @ 9%:`, 130, y);
    doc.text(`INR ${inv.cgstINR.toLocaleString('en-IN')}`, 175, y);
    y += 6;
    doc.text(`SGST @ 9%:`, 130, y);
    doc.text(`INR ${inv.sgstINR.toLocaleString('en-IN')}`, 175, y);
    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Amount Paid:`, 130, y);
    doc.text(`INR ${inv.grossAmountINR.toLocaleString('en-IN')}`, 175, y);

    // Footer
    y = 250;
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Whether tax is payable on reverse charge basis: NO', margin, y);
    doc.text('This is a computer-generated tax invoice and requires no physical signature.', margin, y + 5);

    doc.save(`Invoice_${inv.invoiceNumber}.pdf`);
  }

  return (
    <div className="page-container" style={{ padding: '1.5rem', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <CreditCard size={24} color="var(--primary)" />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Billing & GST Tax Invoices</h1>
          <span className="badge" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' }}>
            Active Subscription
          </span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
          Manage your FinAgent Pro membership, auto-debit receipts, and download GST tax invoices for business reimbursement.
        </p>
      </div>

      {/* Subscription Card */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Current Active Plan
            </span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0.25rem 0', color: '#fff' }}>
              FinAgent Pro — Annual Wealth Intelligence
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={15} color="#4ade80" /> Billed Annually (₹2,999/yr)
              </span>
              <span>·</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ShieldCheck size={15} color="#38bdf8" /> GST Input Credit Eligible
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="badge" style={{ background: '#22c55e', color: '#000', fontWeight: 700 }}>
              AUTO-RENEW ACTIVE
            </span>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.35rem' }}>Next Billing: 15 Jan 2026</div>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={18} color="var(--primary)" /> GST Invoices History
        </h3>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading invoices...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Invoice #</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Date</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Plan Description</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Base + 18% GST</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{inv.invoiceNumber}</td>
                    <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>{inv.date}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{inv.planName}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <strong>₹{inv.grossAmountINR.toLocaleString('en-IN')}</strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>
                        (₹{inv.baseAmountINR} + ₹{inv.gstAmountINR} GST)
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <span style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', padding: '0.15rem 0.5rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                      <button
                        onClick={() => downloadInvoicePDF(inv)}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <Download size={13} /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
