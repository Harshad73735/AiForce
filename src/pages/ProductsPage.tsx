import { useMemo, useState, type FormEvent } from 'react';
import { useApp } from '../app/AppContext';
import type { ProductForm } from '../app/types';
import { ConfirmDialog, EmptyState, FormField, Modal } from '../components/common';
import { formatDateTime, formatPrice } from '../utils/date';

const blank: ProductForm = { name: '', description: '', category: '', price: '' };

export function ProductsPage() {
  const { products, createProduct, updateProduct, deleteProduct, productSaving } = useApp();
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(blank);
  const [error, setError] = useState('');

  const filtered = useMemo(() => [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).filter((product) => product.name.toLowerCase().includes(query.toLowerCase())), [products, query]);

  const openCreate = () => { setEditingId(null); setForm(blank); setModalOpen(true); };
  const openEdit = (id: string) => {
    const product = products.find((entry) => entry.id === id);
    if (!product) return;
    setEditingId(id);
    setForm({ name: product.name, description: product.description, category: product.category, price: String(product.price) });
    setModalOpen(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!form.name.trim() || !form.price.trim() || Number.isNaN(Number(form.price))) {
      setError('Name and numeric price are required.');
      return;
    }
    if (editingId) await updateProduct(editingId, form); else await createProduct(form);
    setModalOpen(false);
  };

  return (
    <div className="grid" style={{ gap: '1rem' }}>
      <section className="panel">
        <div className="panel-header">
          <div><h2>Products</h2><p>Manage the product catalog used across drafts and AI prompts.</p></div>
          <div style={{ display: 'flex', gap: '0.75rem' }}><input placeholder="Search by product name" value={query} onChange={(event) => setQuery(event.target.value)} /><button className="btn" onClick={openCreate}>Add product</button></div>
        </div>
        {filtered.length === 0 ? (
          <EmptyState title="No products found" description="Try a different search or create a new product." action={<button className="btn" onClick={openCreate}>Create product</button>} />
        ) : (
          <table className="table">
            <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Created</th><th /></tr></thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id}>
                  <td><strong>{product.name}</strong><div className="muted-text">{product.description}</div></td>
                  <td>{product.category}</td>
                  <td>{formatPrice(product.price)}</td>
                  <td>{formatDateTime(product.createdAt)}</td>
                  <td style={{ display: 'flex', gap: '0.5rem' }}><button className="btn btn-secondary" onClick={() => openEdit(product.id)}>Edit</button><button className="btn btn-danger" onClick={() => setDeleteId(product.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {modalOpen ? (
        <Modal title={editingId ? 'Edit product' : 'Add product'} onClose={() => setModalOpen(false)}>
          <form className="grid two" onSubmit={submit}>
            {error ? <div className="panel" style={{ gridColumn: '1 / -1', borderColor: 'rgba(248,113,113,0.35)', color: '#ffb4b4' }}>{error}</div> : null}
            <FormField label="Name"><input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></FormField>
            <FormField label="Category"><input value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} /></FormField>
            <FormField label="Price"><input type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} /></FormField>
            <FormField label="Description" ><textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></FormField>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn" disabled={productSaving}>{productSaving ? 'Saving...' : 'Save product'}</button>
            </div>
          </form>
        </Modal>
      ) : null}

      {deleteId ? (
        <ConfirmDialog title="Delete product" description="This removes the product from the catalog and clears draft links that use it." confirmLabel="Delete" onCancel={() => setDeleteId(null)} onConfirm={async () => { await deleteProduct(deleteId); setDeleteId(null); }} />
      ) : null}
    </div>
  );
}