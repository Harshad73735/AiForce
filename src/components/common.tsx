import { useState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';

export function Loader({ label = 'Loading...' }: { label?: string }) {
  return <div className="loader">{label}</div>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <article className="stat-card reveal">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {hint ? <div className="stat-hint">{hint}</div> : null}
    </article>
  );
}

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="modal-panel" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, description, confirmLabel, onCancel, onConfirm }: { title: string; description: string; confirmLabel: string; onCancel: () => void; onConfirm: () => void; }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="muted-text">{description}</p>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn btn-danger" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}

export function FormField({ label, error, children, help }: { label: string; error?: string; children: ReactNode; help?: string }) {
  return (
    <label className="form-field">
      <span className="field-label">{label}</span>
      {children}
      {help ? <span className="field-help">{help}</span> : null}
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
}

export function Alert({
  kind,
  title,
  description,
  dismissible = true,
}: {
  kind: 'success' | 'info' | 'warning' | 'error';
  title: string;
  description?: string;
  dismissible?: boolean;
}) {
  const [visible, setVisible] = useState(true);

  if (!visible) {
    return null;
  }

  const iconByKind = {
    success: CheckCircle2,
    info: Info,
    warning: TriangleAlert,
    error: AlertCircle,
  }[kind];
  const Icon = iconByKind;

  return (
    <div className={`alert ${kind}`} role="status">
      <Icon size={18} strokeWidth={2.1} />
      <div>
        <strong>{title}</strong>
        {description ? <p>{description}</p> : null}
      </div>
      {dismissible ? (
        <button type="button" className="alert-dismiss" onClick={() => setVisible(false)} aria-label="Remove alert">
          ×
        </button>
      ) : null}
    </div>
  );
}
