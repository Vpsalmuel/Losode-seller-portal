import { useEffect, useState, type FormEvent } from 'react';
import type { Store } from '../api/types';
import { Badge, Loading, PageHeader, Pager } from '../components/ui';
import { longDate, maskAccount, naira, transactions, type Tone, type Transaction } from '../lib/format';
import { useSellerData } from '../state/SellerData';

const PAGE_SIZE = 6;

const BANKS: { name: string; code: string }[] = [
  { name: 'GTBank', code: 'GTB' },
  { name: 'Access Bank', code: 'ACC' },
  { name: 'Zenith Bank', code: 'ZEN' },
  { name: 'First Bank', code: 'FBN' },
  { name: 'UBA', code: 'UBA' },
  { name: 'Stanbic IBTC', code: 'SIB' },
  { name: 'Fidelity Bank', code: 'FID' },
  { name: 'Kuda', code: 'KDA' },
  { name: 'Moniepoint', code: 'MNP' },
  { name: 'Opay', code: 'OPY' },
];

const bankCode = (name: string) => BANKS.find((b) => b.name === name)?.code ?? name.slice(0, 3).toUpperCase();

const STATUS_TONE: Record<Transaction['status'], Tone> = { Completed: 'success', Pending: 'warning', Failed: 'danger' };

/** "Nov 1st" */
const dayWithSuffix = (iso: string) => {
  const d = new Date(iso);
  const n = d.getDate();
  const suffix = n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th';
  return `${d.toLocaleDateString('en-US', { month: 'short' })} ${n}${suffix}`;
};

export function Payments() {
  const { loading, stats, store, payouts, orders } = useSellerData();
  const [page, setPage] = useState(1);
  const [editingBank, setEditingBank] = useState(false);
  if (loading || !stats || !store) return <Loading />;

  const rows = transactions(orders, payouts);
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const next = payouts.filter((p) => p.status === 'scheduled').sort((a, b) => a.date.localeCompare(b.date))[0];
  const last = payouts.filter((p) => p.status === 'paid').sort((a, b) => b.date.localeCompare(a.date))[0];

  return (
    <div className="pay">
      <PageHeader title="My Payments" subtitle="View metrics, earnings records, and bank transfers" />

      <div className="pay-summary">
        <div className="pay-cards">
          <div className="pay-card">
            <p className="pay-card__label">Total Earnings</p>
            <p className="pay-card__value pay-card__value--green">{naira(stats.totalRevenue)}</p>
            <p className="pay-card__foot">Accumulated sales balance</p>
          </div>
          <div className="pay-card">
            <p className="pay-card__label">Pending Payout</p>
            <p className="pay-card__value pay-card__value--amber">{naira(next?.amount ?? 0)}</p>
            <p className="pay-card__foot">{next ? `Releasing on ${dayWithSuffix(next.date)}` : 'Nothing scheduled yet'}</p>
          </div>
          <div className="pay-card">
            <p className="pay-card__label">Last Payout</p>
            <p className="pay-card__value">{naira(last?.amount ?? 0)}</p>
            <p className="pay-card__foot">{last ? `Transferred ${longDate(last.date)}` : 'No payouts yet'}</p>
          </div>
        </div>

        <div className="pay-bank">
          <div className="pay-bank__head">
            <p className="pay-card__label">Payout Destination</p>
            <button type="button" className="pay-bank__change" onClick={() => setEditingBank(true)}>
              Change
            </button>
          </div>
          <div className="pay-bank__account">
            <span className="pay-bank__code">{bankCode(store.bankName)}</span>
            <div>
              <p className="pay-bank__number">
                {store.bankName} {maskAccount(store.accountNumber)}
              </p>
              <p className="pay-card__foot">{store.accountName.toUpperCase()}</p>
            </div>
          </div>
        </div>
      </div>

      <section className="pay-history">
        <h2 className="pay-history__title">Transaction History</h2>
        <div className="pay-table">
          <div className="pay-table__scroll">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th className="is-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((t) => {
                  // A failed payout never left the account, so it is shown without a sign or colour.
                  const sign = t.status === 'Failed' ? 0 : Math.sign(t.amount);
                  return (
                    <tr key={t.id}>
                      <td className="pay-table__date">{longDate(t.date)}</td>
                      <td className="pay-table__desc">{t.description}</td>
                      <td className="pay-table__type">{t.type}</td>
                      <td className={`pay-table__amount${sign > 0 ? ' is-in' : sign < 0 ? ' is-out' : ''}`}>
                        {sign > 0 ? '+ ' : sign < 0 ? '- ' : ''}
                        {naira(Math.abs(t.amount))}
                      </td>
                      <td className="is-right">
                        <Badge tone={STATUS_TONE[t.status]}>{t.status}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length === 0 && <p className="empty">No transactions yet. Sales and payouts will appear here.</p>}
          </div>
          <div className="pay-table__foot">
            <span>
              Showing {rows.length ? (current - 1) * PAGE_SIZE + 1 : 0}-{Math.min(current * PAGE_SIZE, rows.length)} of {rows.length} transactions
            </span>
            <Pager page={current} pageCount={pageCount} onChange={setPage} label="Transaction pages" />
          </div>
        </div>
      </section>

      {editingBank && <BankDialog store={store} onClose={() => setEditingBank(false)} />}
    </div>
  );
}

function BankDialog({ store, onClose }: { store: Store; onClose: () => void }) {
  const { updateStore, notify } = useSellerData();
  const [bankName, setBankName] = useState(BANKS.some((b) => b.name === store.bankName) ? store.bankName : BANKS[0].name);
  const [accountNumber, setAccountNumber] = useState(store.accountNumber);
  const [accountName, setAccountName] = useState(store.accountName);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(accountNumber)) return setError('Nigerian account numbers (NUBAN) have 10 digits.');
    if (!accountName.trim()) return setError('Enter the name on the account.');
    setError(null);
    setSaving(true);
    try {
      await updateStore({ bankName, accountNumber, accountName: accountName.trim() });
      notify(`Payouts will now go to ${bankName} ${maskAccount(accountNumber)}`);
      onClose();
    } catch {
      notify('Could not update the account — please try again');
      setSaving(false);
    }
  };

  return (
    <>
      <div className="drawer-scrim" onClick={onClose} />
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="bank-title">
        <h2 id="bank-title" className="dialog__title">
          Change payout account
        </h2>
        <form className="dialog__form" onSubmit={submit} noValidate>
          <p className="od-muted">Losóde verifies new accounts before the next payout. The account name must match your registered business.</p>
          <label className="lf-field">
            <span className="lf-label">Bank</span>
            <select className="lf-input lf-select" value={bankName} onChange={(e) => setBankName(e.target.value)}>
              {BANKS.map((b) => (
                <option key={b.name}>{b.name}</option>
              ))}
            </select>
          </label>
          <label className="lf-field">
            <span className="lf-label">Account number</span>
            <input
              className="lf-input"
              inputMode="numeric"
              maxLength={10}
              autoFocus
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
            />
          </label>
          <label className="lf-field">
            <span className="lf-label">Account name</span>
            <input className="lf-input" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
          </label>
          {error && <p className="field__error">{error}</p>}
          <div className="dialog__actions">
            <button type="button" className="od-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="od-btn od-btn--dark" disabled={saving}>
              {saving ? 'Saving…' : 'Save account'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
