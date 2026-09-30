import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Building2,
  UserCircle,
  Search,
  Plus,
  X,
  Pencil,
  Trash2,
  Loader2,
  Mail,
  UploadCloud,
} from 'lucide-react';
import contactService from '../../services/contactService';
import EmptyState from '../../components/EmptyState';
import Skeleton from '../../components/Skeleton';
import ContextMenu from '../../components/ContextMenu';
import Pagination from '../../components/Pagination';
import PageHeader from '../../components/PageHeader';
import toast from 'react-hot-toast';

const typeStyles = {
  supplier: 'bg-emerald/10 text-emerald border-emerald/20',
  client: 'bg-navy/10 text-navy dark:text-gold border-navy/20 dark:border-gold/20',
};

const tabs = [
  { key: 'all', label: 'All', icon: Users },
  { key: 'supplier', label: 'Suppliers', icon: Building2 },
  { key: 'client', label: 'Clients', icon: UserCircle },
];

// A rejected field comes back as {email: ["A contact with this email already
// exists."]}; a failed action as {error}. Show whichever message we got.
const apiErrorMessage = (err, fallback) => {
  const data = err?.response?.data;
  if (!data) return fallback;
  if (data.error) return data.error;
  const [first] = Object.values(data);
  if (Array.isArray(first) && first.length) return first[0];
  if (typeof first === 'string') return first;
  return fallback;
};

const InlineEdit = ({ value, onSave, onCancel }) => {
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') onSave(editValue);
    if (e.key === 'Escape') onCancel();
  };

  return (
    <input
      ref={inputRef}
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => onSave(editValue)}
      className="w-full px-2 py-1 text-sm border border-gold rounded bg-white dark:bg-navy-light text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-gold/30"
    />
  );
};

const ContactDrawer = ({ contact, onClose, onSave, onDelete }) => {
  const isNew = !contact?.id;
  const [form, setForm] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    type: 'supplier',
    tags: '',
    tax_id: '',
    notes: '',
    ...contact,
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [] });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 scrim backdrop-blur-sm animate-fadeIn" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-navy shadow-xl border-l border-border-light dark:border-white/10 animate-slideInRight overflow-y-auto">
        <div className="sticky top-0 bg-white/90 dark:bg-navy/90 backdrop-blur-md border-b border-border-light dark:border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-700 dark:text-white">
            {isNew ? 'Add Contact' : 'Edit Contact'}
          </h2>
          <button onClick={onClose} className="text-slate-400 dark:text-white/60 hover:text-slate-700 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-slate-400 dark:text-white/60">Company Name</label>
            <input name="company_name" value={form.company_name} onChange={handleChange} required
              className="w-full px-3 py-2 rounded-lg bg-ivory dark:bg-navy-light border border-border-light dark:border-white/20 text-slate-700 dark:text-white text-sm focus:outline-none focus:border-gold" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-slate-400 dark:text-white/60">Contact Person</label>
            <input name="contact_person" value={form.contact_person} onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg bg-ivory dark:bg-navy-light border border-border-light dark:border-white/20 text-slate-700 dark:text-white text-sm focus:outline-none focus:border-gold" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-slate-400 dark:text-white/60">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg bg-ivory dark:bg-navy-light border border-border-light dark:border-white/20 text-slate-700 dark:text-white text-sm focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-slate-400 dark:text-white/60">Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg bg-ivory dark:bg-navy-light border border-border-light dark:border-white/20 text-slate-700 dark:text-white text-sm focus:outline-none focus:border-gold" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-slate-400 dark:text-white/60">Type</label>
            <select name="type" value={form.type} onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg bg-ivory dark:bg-navy-light border border-border-light dark:border-white/20 text-slate-700 dark:text-white text-sm focus:outline-none focus:border-gold">
              <option value="supplier">Supplier</option>
              <option value="client">Client</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-slate-400 dark:text-white/60">Tags (comma separated)</label>
            <input name="tags" value={form.tags} onChange={handleChange} placeholder="metal, steel, premium"
              className="w-full px-3 py-2 rounded-lg bg-ivory dark:bg-navy-light border border-border-light dark:border-white/20 text-slate-700 dark:text-white text-sm focus:outline-none focus:border-gold" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-slate-400 dark:text-white/60">Tax / VAT ID</label>
            <input name="tax_id" value={form.tax_id} onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg bg-ivory dark:bg-navy-light border border-border-light dark:border-white/20 text-slate-700 dark:text-white text-sm focus:outline-none focus:border-gold" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-slate-400 dark:text-white/60">Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={4}
              className="w-full px-3 py-2 rounded-lg bg-ivory dark:bg-navy-light border border-border-light dark:border-white/20 text-slate-700 dark:text-white text-sm focus:outline-none focus:border-gold resize-none" />
          </div>
          <div className="flex items-center justify-between pt-2">
            {!isNew && (
              <button type="button" onClick={() => onDelete(contact)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-danger/30 text-danger hover:bg-danger/10 text-sm font-medium transition-all duration-200">
                <Trash2 size={16} />
                Delete
              </button>
            )}
            <div className="flex gap-3 ml-auto">
              <button type="button" onClick={onClose}
                className="py-2.5 px-4 rounded-lg border border-border-light dark:border-white/20 text-slate-400 dark:text-white/60 hover:text-slate-700 dark:hover:text-white text-sm transition-all duration-200">
                Cancel
              </button>
              <button type="submit"
                className="py-2.5 px-4 bg-gold text-navy font-semibold rounded-lg text-sm hover:bg-gold-dark hover:shadow-gold active:scale-[0.98] transition-all duration-200">
                {isNew ? 'Create Contact' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const Contacts = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [editingCell, setEditingCell] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [syncingId, setSyncingId] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const searchTimer = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, debouncedSearch, pageSize]);

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', activeTab, page, pageSize, debouncedSearch],
    queryFn: () => contactService.getContacts(activeTab, {
      page,
      page_size: pageSize,
      search: debouncedSearch || undefined,
    }),
  });

  const contacts = data?.results ?? [];
  const total = data?.count ?? 0;

  const createMutation = useMutation({
    mutationFn: contactService.createContact,
    onSuccess: () => {
      queryClient.invalidateQueries(['contacts']);
      setDrawerOpen(false);
      toast.success('Contact created');
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, 'Failed to create contact'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => contactService.updateContact(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['contacts']);
      toast.success('Contact updated');
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, 'Failed to update contact'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: contactService.deleteContact,
    onSuccess: () => {
      queryClient.invalidateQueries(['contacts']);
      toast.success('Contact deleted');
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, 'Failed to delete contact'));
    },
  });

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selected.length === contacts.length) {
      setSelected([]);
    } else {
      setSelected(contacts.map((c) => c.id));
    }
  };

  const handleCellSave = (contact, field, value) => {
    updateMutation.mutate({ id: contact.id, data: { [field]: value } });
    setEditingCell(null);
  };

  const handleDrawerSave = (data) => {
    if (editingContact?.id) {
      updateMutation.mutate({ id: editingContact.id, data });
    } else {
      createMutation.mutate(data);
    }
    setEditingContact(null);
  };

  const openEdit = (contact) => {
    setEditingContact(contact);
    setDrawerOpen(true);
  };

  const handleContextMenu = (e, contact) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, contact });
  };

  const bulkDelete = () => {
    selected.forEach((id) => deleteMutation.mutate(id));
    setSelected([]);
  };

  const handleSyncToBc = async (contact, e) => {
    e.stopPropagation();
    setSyncingId(contact.id);
    try {
      const response = await contactService.syncToBusinessCentral(contact.id);
      toast.success(
        response.already_synced
          ? 'Customer already synced to Business Central'
          : 'Customer synced to Business Central'
      );
    } catch {
      toast.error('Failed to sync customer to Business Central');
    } finally {
      setSyncingId(null);
    }
  };

  const columns = [
    { key: 'company_name', label: 'Company', width: 'w-1/5' },
    { key: 'contact_person', label: 'Contact Person', width: 'w-1/6' },
    { key: 'email', label: 'Email', width: 'w-1/5' },
    { key: 'phone', label: 'Phone', width: 'w-1/6' },
    { key: 'type', label: 'Type', width: 'w-1/12' },
    { key: 'tags', label: 'Tags', width: 'w-1/6' },
  ];

  return (
    <div className="min-h-screen animate-fadeInUp">
      <PageHeader
        icon={Users}
        title="Contacts"
        subtitle="Manage suppliers and clients"
        actions={
          <button
            onClick={() => { setEditingContact(null); setDrawerOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gold text-navy rounded-lg text-sm font-semibold hover:bg-gold-dark hover:shadow-gold active:scale-[0.98] transition-all duration-200 shadow-gold"
          >
            <Plus size={18} />
            Add Contact
          </button>
        }
      />

      <div className="card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 ${
                  activeTab === tab.key
                    ? 'bg-gold text-navy shadow-gold'
                    : 'text-slate-400 dark:text-white/60 hover:bg-ivory dark:hover:bg-navy-light hover:text-slate-700 dark:hover:text-white'
                }`}
              >
                <Icon size={16} strokeWidth={1.5} />
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="relative ml-auto w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/60" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-ivory dark:bg-navy-light border border-border-light dark:border-white/20 text-slate-700 dark:text-white text-sm placeholder:text-slate-300 dark:placeholder:text-white/30 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/25 transition-all"
          />
        </div>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-gold/10 border border-gold/30 rounded-lg">
          <span className="text-sm text-slate-700 dark:text-white font-medium">{selected.length} selected</span>
          <button onClick={bulkDelete} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-danger bg-danger/10 rounded hover:bg-danger/20 transition-all">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}

      {isLoading ? (
        <Skeleton rows={6} />
      ) : contacts.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Your trusted network begins here"
          description="Add your first supplier or client to start building your contact network."
          action={() => { setEditingContact(null); setDrawerOpen(true); }}
          actionLabel="Add Contact"
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-border-light dark:border-white/10 bg-ivory dark:bg-navy-light">
                  <th className="px-4 py-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={selected.length === contacts.length && contacts.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-border-light dark:border-white/20 text-gold focus:ring-2 focus:ring-gold/40"
                    />
                  </th>
                  {columns.map((col) => (
                    <th key={col.key} className={`px-4 py-3.5 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-400 dark:text-white/60 font-mono ${col.width}`}>
                      {col.label}
                    </th>
                  ))}
                  <th className="px-4 py-3.5 w-40" />
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className={`border-b border-border-light dark:border-white/5 transition-all duration-150 hover:shadow-gold hover:bg-gold/[0.02] cursor-pointer ${
                      selected.includes(contact.id) ? 'selected-row' : ''
                    }`}
                    onContextMenu={(e) => handleContextMenu(e, contact)}
                    onClick={() => openEdit(contact)}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(contact.id)}
                        onChange={() => toggleSelect(contact.id)}
                        className="w-4 h-4 rounded border-border-light dark:border-white/20 text-gold focus:ring-2 focus:ring-gold/40"
                      />
                    </td>
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                        {editingCell?.id === contact.id && editingCell?.field === col.key ? (
                          <InlineEdit
                            value={contact[col.key] || (col.key === 'tags' ? (contact.tags || []).join(', ') : '')}
                            onSave={(val) => handleCellSave(contact, col.key, col.key === 'tags' ? val.split(',').map(t => t.trim()) : val)}
                            onCancel={() => setEditingCell(null)}
                          />
                        ) : col.key === 'type' ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-mono font-semibold uppercase tracking-wider border ${typeStyles[contact.type] || ''}`}>
                            {contact.type}
                          </span>
                        ) : col.key === 'tags' ? (
                          <div className="flex gap-1 flex-wrap">
                            {(contact.tags || []).slice(0, 3).map((tag, i) => (
                              <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono bg-ivory dark:bg-navy-light text-slate-400 dark:text-white/60 border border-border-light dark:border-white/10">
                                {tag}
                              </span>
                            ))}
                            {(contact.tags || []).length > 3 && (
                              <span className="text-[9px] text-slate-400 dark:text-white/60 font-mono">+{contact.tags.length - 3}</span>
                            )}
                          </div>
                        ) : (
                          <div
                            className="cursor-pointer"
                            onDoubleClick={() => setEditingCell({ id: contact.id, field: col.key })}
                          >
                            <span
                              className={`text-sm ${
                                contact[col.key]
                                  ? 'text-slate-700 dark:text-white'
                                  : 'text-slate-400 dark:text-white/40 italic'
                              }`}
                            >
                              {contact[col.key] || (col.key === 'phone' ? 'no PH Found' : '-')}
                            </span>
                          </div>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleSyncToBc(contact, e)}
                        disabled={syncingId === contact.id}
                        title="Sync to BC"
                        className="inline-flex items-center justify-center w-7 h-7 rounded-md text-gold hover:text-gold-dark hover:bg-gold/10 transition-colors duration-200 mr-2 disabled:opacity-60"
                      >
                        {syncingId === contact.id ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(contact); }}
                        title="Edit"
                        className="inline-flex items-center justify-center w-7 h-7 rounded-md text-slate-400 dark:text-white/60 hover:text-gold hover:bg-gold/10 transition-colors duration-200"
                      >
                        <Pencil size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={total > 0 ? Math.ceil(total / pageSize) : 1}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
          />
        </div>
      )}

      {drawerOpen && (
        <ContactDrawer
          contact={editingContact}
          onClose={() => { setDrawerOpen(false); setEditingContact(null); }}
          onSave={handleDrawerSave}
          onDelete={(contact) => { setDrawerOpen(false); setEditingContact(null); deleteMutation.mutate(contact.id); }}
        />
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={[
            { label: 'Edit', icon: Pencil, action: () => { openEdit(contextMenu.contact); setContextMenu(null); } },
            { label: 'Copy Email', icon: Mail, action: () => { navigator.clipboard.writeText(contextMenu.contact.email || ''); toast.success('Email copied'); setContextMenu(null); } },
            { label: 'Delete', icon: Trash2, danger: true, action: () => { deleteMutation.mutate(contextMenu.contact.id); setContextMenu(null); } },
          ]}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};

export default Contacts;
