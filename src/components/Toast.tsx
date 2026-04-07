import { useApp } from '../app/AppContext';

export function ToastHost() {
  const { toasts, dismissToast } = useApp();

  return (
    <div className="toast-host">
      {toasts.map((toast) => (
        <button key={toast.id} className={`toast ${toast.kind}`} onClick={() => dismissToast(toast.id)}>
          <strong>{toast.title}</strong>
          {toast.description ? <span>{toast.description}</span> : null}
        </button>
      ))}
    </div>
  );
}