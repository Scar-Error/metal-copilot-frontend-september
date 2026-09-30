import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useParams, Link, useNavigate } from 'react-router-dom';
import rfqService from '../services/rfqService';
import contactService from '../services/contactService';
import { Search, Edit3, Trash2, Save, X, Loader2, FileSearch } from 'lucide-react';
import toast from 'react-hot-toast';
import Pagination from '../components/Pagination';
import PageHeader from '../components/PageHeader';
import CategoryTag from '../components/CategoryTag';
import DateInput from '../components/DateInput';

const ALLOWED_UNITS = ['pc', 'pcs', 'kg', 'ltr'];
const ITEM_FIELD_MAX_LEN = 99;

// Splits item descriptions longer than 99 chars into "comment" continuation items.
const normalizeItems = (items = []) => {
  const out = [];
  for (const item of items) {
    const part = String(item.item_code || '').slice(0, ITEM_FIELD_MAX_LEN);
    const name = String(item.item_name || item.description || '');
    const chunks = name ? name.match(new RegExp(`.{1,${ITEM_FIELD_MAX_LEN}}`, 'gs')) : [''];
    const rawUnit = String(item.unit || '').trim().toLowerCase();
    const unit = ALLOWED_UNITS.includes(rawUnit) ? rawUnit : 'pc';
    const qty = item.quantity != null ? item.quantity : 1;
    const unitPrice = item.unit_price != null ? item.unit_price : null;
    const totalPrice = item.total_price != null ? item.total_price : null;
    chunks.forEach((chunk, i) => {
      const primary = i === 0;
      out.push({
        id: primary ? item.id : undefined,
        item_name: chunk,
        item_code: primary ? part : 'comment',
        description: chunk,
        quantity: primary ? qty : 0,
        unit: primary ? unit : '',
        unit_price: primary ? unitPrice : null,
        total_price: primary ? totalPrice : null,
      });
    });
  }
  return out;
};

const RFQList = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const { rfqNumber } = useParams();
  const navigate = useNavigate();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ search: '' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchRFQs();
  }, [filters, page, pageSize]);

  const fetchRFQs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.search) params.search = filters.search;
      params.page = page;
      params.page_size = pageSize;
      const data = await rfqService.getRFQs(params);
      setRfqs(data.results || []);
      setTotal(data.count || 0);
      setError(null);
    } catch (err) {
      setError('Failed to fetch RFQ data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const [editRFQ, setEditRFQ] = useState(null);
  const [editDetail, setEditDetail] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editItems, setEditItems] = useState([]);
  const [deletedItemIds, setDeletedItemIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedRFQs, setSelectedRFQs] = useState([]);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const handleEditRFQ = async (rfq) => {
    setEditRFQ(rfq);
    setEditLoading(true);
    setEditDetail(null);
    setEditItems([]);
    setDeletedItemIds([]);
    // Update URL to include RFQ number
    navigate(`/rfqs/${rfq.rfq_number}`, { replace: true });
    try {
      const detail = await rfqService.getRFQById(rfq.id);
      setEditDetail(detail);
      setEditItems(normalizeItems(detail.items || []));
    } catch {
      toast.error('Failed to load RFQ details');
      setEditRFQ(null);
      navigate('/rfqs', { replace: true });
    } finally {
      setEditLoading(false);
    }
  };

  // Check if we need to open a specific RFQ from navigation state
  useEffect(() => {
    if (location.state?.openRFQId) {
      const openRFQ = async () => {
        try {
          // Fetch the RFQ detail directly
          const detail = await rfqService.getRFQById(location.state.openRFQId);
          
          // Use handleEditRFQ to open it
          await handleEditRFQ(detail);
          
          // Clear the state to prevent reopening on refresh
          window.history.replaceState({}, document.title);
        } catch (err) {
          console.error('Failed to fetch RFQ:', err);
          toast.error('Failed to open RFQ');
        }
      };
      
      openRFQ();
    }
  }, [location.state]);

  // Check if we need to open a specific RFQ from URL parameter
  useEffect(() => {
    if (rfqNumber) {
      const openRFQByNumber = async () => {
        try {
          // Fetch all RFQs without pagination to find the matching one
          const params = { page: 1, page_size: 1000 };
          const data = await rfqService.getRFQs(params);
          // Case-insensitive comparison for RFQ number
          const matchingRFQ = data.results?.find(r => 
            r.rfq_number?.toLowerCase() === rfqNumber.toLowerCase()
          );
          
          if (matchingRFQ) {
            await handleEditRFQ(matchingRFQ);
          } else {
            console.error('RFQ not found. Looking for:', rfqNumber, 'Available RFQs:', data.results?.map(r => r.rfq_number));
            toast.error('RFQ not found');
            navigate('/rfqs', { replace: true });
          }
        } catch (err) {
          console.error('Failed to fetch RFQ:', err);
          toast.error('Failed to open RFQ');
          navigate('/rfqs', { replace: true });
        }
      };
      
      openRFQByNumber();
    }
  }, [rfqNumber]);

  const handleEditChange = (field, value) => {
    setEditDetail(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index, field, value) => {
    setEditItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddItem = () => {
    setEditItems(prev => [...prev, {
      item_name: '',
      item_code: '',
      description: '',
      quantity: 1,
      unit: 'pc',
      unit_price: null,
      total_price: null,
    }]);
  };

  const handleRemoveItem = (index) => {
    const item = editItems[index];
    if (item.id) {
      setDeletedItemIds(prev => [...prev, item.id]);
    }
    setEditItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditSave = async () => {
    if (!editRFQ || !editDetail) return;
    setSaving(true);
    try {
      const payload = { ...editDetail };
      delete payload.id;
      delete payload.items;
      delete payload.created_at;
      delete payload.updated_at;
      await rfqService.updateRFQ(editRFQ.id, payload);

      for (const id of deletedItemIds) {
        await rfqService.deleteRFQItem(id);
      }

      for (const item of editItems) {
        const itemPayload = {
          order: editRFQ.id,
          item_name: item.item_name || '',
          item_code: item.item_code || '',
          description: item.description || '',
          quantity: item.quantity || 0,
          unit: item.unit || '',
          unit_price: item.unit_price || null,
          total_price: item.total_price || null,
        };
        if (item.id) {
          await rfqService.updateRFQItem(item.id, itemPayload);
        } else {
          await rfqService.createRFQItem(itemPayload);
        }
      }

      toast.success('RFQ updated');
      setEditRFQ(null);
      setEditDetail(null);
      setEditItems([]);
      setDeletedItemIds([]);
      navigate('/rfqs', { replace: true });
      fetchRFQs();
    } catch {
      toast.error('Failed to update RFQ');
    } finally {
      setSaving(false);
    }
  };

  const handleEditDelete = async () => {
    if (!editRFQ) return;
    try {
      await rfqService.deleteRFQ(editRFQ.id);
      toast.success('RFQ deleted');
      setEditRFQ(null);
      setEditDetail(null);
      setDeleteConfirm(null);
      navigate('/rfqs', { replace: true });
      fetchRFQs();
    } catch {
      toast.error('Failed to delete RFQ');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRFQs.length === 0) return;
    setBulkDeleting(true);
    try {
      await rfqService.bulkDeleteRFQs(selectedRFQs);
      toast.success(`${selectedRFQs.length} RFQ(s) deleted successfully`);
      setSelectedRFQs([]);
      setBulkDeleteConfirm(false);
      fetchRFQs();
    } catch {
      toast.error('Failed to delete RFQs');
    } finally {
      setBulkDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-100px)] gap-3">
        <Loader2 size={32} className="animate-spin text-gold" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 dark:text-white/60">Loading documents...</span>
      </div>
    );
  }

  return (
    <div className="min-h-0 w-full max-w-full overflow-x-hidden animate-fadeInUp">
      <PageHeader
        icon={FileSearch}
        title="RFQ"
        accent="Management"
        subtitle="Review, analyze, and manage quotation requests."
      />

      <div className="card p-4 mb-6 relative z-10">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/60" />
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Company, RFQ number, or subject..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-ivory dark:bg-navy-light border border-border-light dark:border-white/20 text-slate-700 dark:text-white text-sm placeholder:text-slate-300 dark:placeholder:text-white/30 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/25 transition-all duration-200"
            />
          </div>
          {selectedRFQs.length > 0 && (
            <button
              onClick={() => setBulkDeleteConfirm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 transition-all duration-200 text-sm font-medium"
            >
              <Trash2 size={16} />
              Delete Selected ({selectedRFQs.length})
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg mb-6 text-sm border border-danger/30 bg-danger/10 text-danger relative z-10">
          {error}
        </div>
      )}

      <div className="card relative z-10 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border-light dark:border-white/10 bg-ivory dark:bg-navy-light">
                <th scope="col" className="px-5 py-3.5 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-400 dark:text-white/60 font-mono w-10">
                  <input
                    type="checkbox"
                    checked={selectedRFQs.length === rfqs.length && rfqs.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRFQs(rfqs.map(r => r.id));
                      } else {
                        setSelectedRFQs([]);
                      }
                    }}
                    className="w-4 h-4 rounded border-border-light dark:border-white/20 text-gold focus:ring-2 focus:ring-gold/40"
                  />
                </th>
                <th scope="col" className="px-5 py-3.5 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-400 dark:text-white/60 font-mono">RFQ Serial</th>
                <th scope="col" className="px-5 py-3.5 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-400 dark:text-white/60 font-mono">Tag</th>
                <th scope="col" className="px-5 py-3.5 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-400 dark:text-white/60 font-mono">Client Partner</th>
                <th scope="col" className="px-5 py-3.5 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-400 dark:text-white/60 font-mono">Date</th>
                <th scope="col" className="px-5 py-3.5 text-right text-[9px] font-semibold uppercase tracking-wider text-slate-400 dark:text-white/60 font-mono">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rfqs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FileSearch size={32} className="text-slate-300 dark:text-white/30" />
                      <p className="text-sm font-mono text-slate-400 dark:text-white/60">No records match your filter criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                rfqs.map((rfq) => (
                  <tr
                    key={rfq.id}
                    onClick={() => handleEditRFQ(rfq)}
                    className="border-b border-border-light dark:border-white/5 transition-all duration-150 hover:shadow-gold hover:bg-gold/[0.02] cursor-pointer"
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedRFQs.includes(rfq.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRFQs([...selectedRFQs, rfq.id]);
                          } else {
                            setSelectedRFQs(selectedRFQs.filter(id => id !== rfq.id));
                          }
                        }}
                        className="w-4 h-4 rounded border-border-light dark:border-white/20 text-gold focus:ring-2 focus:ring-gold/40"
                      />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <Link 
                        to={`/rfqs/${rfq.rfq_number}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm font-medium text-gold hover:text-gold-dark font-mono hover:underline"
                      >
                        {rfq.rfq_number}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <CategoryTag category={rfq.thread_category} />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-sm font-medium text-slate-700 dark:text-white">{rfq.company_name}</span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm font-mono text-slate-400 dark:text-white/60">
                      {rfq.created_at
                        ? new Date(rfq.created_at).toLocaleDateString('en-GB')
                        : '-'}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditRFQ(rfq); }}
                        title="Edit"
                        className="inline-flex items-center justify-center w-7 h-7 rounded-md text-slate-400 dark:text-white/60 hover:text-gold hover:bg-gold/10 transition-colors duration-200"
                      >
                        <Edit3 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <Pagination
            page={page}
            totalPages={total > 0 ? Math.ceil(total / pageSize) : 1}
            total={total}
            pageSize={pageSize}
            onPageChange={(p) => { setPage(p); }}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
          />
      </div>

      {bulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center scrim backdrop-blur-sm">
          <div className="bg-white dark:bg-navy rounded-xl shadow-elevated border border-border-light dark:border-white/10 p-6 max-w-md w-full mx-4 animate-scaleIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center">
                <Trash2 size={20} className="text-danger" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 dark:text-white">Delete RFQs</h3>
            </div>

            <p className="text-sm text-slate-600 dark:text-white/80 mb-6">
              Are you sure you want to delete {selectedRFQs.length} RFQ(s)? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setBulkDeleteConfirm(false)}
                disabled={bulkDeleting}
                className="px-4 py-2 rounded-lg border border-border-light dark:border-white/20 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-200 text-sm font-medium disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="px-4 py-2 rounded-lg bg-danger text-white hover:bg-danger/90 transition-all duration-200 text-sm font-medium disabled:opacity-60 flex items-center gap-2"
              >
                {bulkDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {editRFQ && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 scrim backdrop-blur-sm animate-fadeIn" onClick={() => { setEditRFQ(null); setEditDetail(null); navigate('/rfqs', { replace: true }); }} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-navy shadow-xl border-l border-border-light dark:border-white/10 animate-slideInRight overflow-y-auto">
            <div className="sticky top-0 bg-white/90 dark:bg-navy/90 backdrop-blur-md border-b border-border-light dark:border-white/10 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold text-slate-700 dark:text-white font-mono">
                Edit {editRFQ.rfq_number}
              </h2>
              <button onClick={() => { setEditRFQ(null); setEditDetail(null); navigate('/rfqs', { replace: true }); }} className="text-slate-400 dark:text-white/60 hover:text-slate-700 dark:hover:text-white">
                <X size={20} />
              </button>
            </div>

            {editLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={24} className="animate-spin text-gold" />
              </div>
            ) : editDetail ? (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5 text-slate-400 dark:text-white/60 font-mono">RFQ Number</label>
                    <input type="text" value={editDetail.rfq_number || ''} onChange={(e) => handleEditChange('rfq_number', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-ivory dark:bg-navy-light border border-border-light dark:border-white/20 text-slate-700 dark:text-white text-sm focus:outline-none focus:border-gold" />
                  </div>
                   <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5 text-slate-400 dark:text-white/60 font-mono">Company</label>
                    <input type="text" value={editDetail.company_name || ''} onChange={(e) => handleEditChange('company_name', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-ivory dark:bg-navy-light border border-border-light dark:border-white/20 text-slate-700 dark:text-white text-sm focus:outline-none focus:border-gold" />
                  </div>
                   <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5 text-slate-400 dark:text-white/60 font-mono">Email Subject</label>
                    <input type="text" value={editDetail.email_subject || ''} onChange={(e) => handleEditChange('email_subject', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-ivory dark:bg-navy-light border border-border-light dark:border-white/20 text-slate-700 dark:text-white text-sm focus:outline-none focus:border-gold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5 text-slate-400 dark:text-white/60 font-mono">Email Sender</label>
                    <input type="text" value={editDetail.email_sender || ''} onChange={(e) => handleEditChange('email_sender', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-ivory dark:bg-navy-light border border-border-light dark:border-white/20 text-slate-700 dark:text-white text-sm focus:outline-none focus:border-gold" />
                  </div>
                </div>

                <div className="border-t border-border-light dark:border-white/10 pt-5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-3 text-slate-400 dark:text-white/60 font-mono">Order Details</p>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5 text-slate-400 dark:text-white/60 font-mono">Budget ($)</label>
                      <input type="number" step="0.01" value={editDetail.budget || ''} onChange={(e) => handleEditChange('budget', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-ivory dark:bg-navy-light border border-border-light dark:border-white/20 text-slate-700 dark:text-white text-sm focus:outline-none focus:border-gold" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5 text-slate-400 dark:text-white/60 font-mono">Delivery Date</label>
                      <DateInput value={editDetail.delivery_date || ''} onChange={(v) => handleEditChange('delivery_date', v)}
                        className="w-full px-3 py-2 rounded-lg bg-ivory dark:bg-navy-light border border-border-light dark:border-white/20 text-slate-700 dark:text-white text-sm focus:outline-none focus:border-gold" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-white/60 font-mono">Items</p>
                    <button type="button" onClick={handleAddItem}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider bg-gold/10 text-gold border border-gold/30 rounded hover:bg-gold/20 transition-all"
                    >
                      + Add Item
                    </button>
                  </div>
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border-light dark:border-white/10">
                          <th className="text-left py-2 pr-2 font-mono text-[9px] uppercase tracking-wider text-slate-400 dark:text-white/60">Description</th>
                          <th className="text-left py-2 pr-2 font-mono text-[9px] uppercase tracking-wider text-slate-400 dark:text-white/60">Description 2</th>
                          <th className="text-right py-2 pr-2 font-mono text-[9px] uppercase tracking-wider text-slate-400 dark:text-white/60">Qty</th>
                          <th className="text-left py-2 pr-2 font-mono text-[9px] uppercase tracking-wider text-slate-400 dark:text-white/60">Unit</th>
                          <th className="text-right py-2 pr-2 font-mono text-[9px] uppercase tracking-wider text-slate-400 dark:text-white/60">Unit $</th>
                          <th className="text-right py-2 pr-2 font-mono text-[9px] uppercase tracking-wider text-slate-400 dark:text-white/60">Total $</th>
                          <th className="py-2 w-8" />
                        </tr>
                      </thead>
                      <tbody>
                        {editItems.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-6 text-center text-slate-400 dark:text-white/60 italic">No items. Click "Add Item" to add one.</td>
                          </tr>
                        ) : (
                          editItems.map((item, idx) => (
                            <tr key={item.id || `new-${idx}`} className="border-b border-border-light dark:border-white/5">
                              <td className="py-1.5 pr-2">
                                <input type="text" maxLength={99} placeholder="Part number" value={item.item_code || ''} onChange={(e) => handleItemChange(idx, 'item_code', e.target.value)}
                                  className="w-full px-2 py-1 rounded bg-ivory dark:bg-navy-light border border-border-light dark:border-white/20 text-slate-700 dark:text-white text-xs focus:outline-none focus:border-gold" />
                              </td>
                              <td className="py-1.5 pr-2">
                                <input type="text" maxLength={99} placeholder="Actual description" value={item.item_name || ''} onChange={(e) => handleItemChange(idx, 'item_name', e.target.value)}
                                  className="w-full px-2 py-1 rounded bg-ivory dark:bg-navy-light border border-border-light dark:border-white/20 text-slate-700 dark:text-white text-xs focus:outline-none focus:border-gold" />
                              </td>
                              <td className="py-1.5 pr-2">
                                <input type="number" value={item.quantity || ''} onChange={(e) => handleItemChange(idx, 'quantity', e.target.value === '' ? 0 : Number(e.target.value))}
                                  className="w-16 px-2 py-1 rounded bg-ivory dark:bg-navy-light border border-border-light dark:border-white/20 text-slate-700 dark:text-white text-xs text-right focus:outline-none focus:border-gold" />
                              </td>
                              <td className="py-1.5 pr-2">
                                <select value={item.unit || ''} onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                                  className="w-16 px-1 py-1 rounded bg-ivory dark:bg-navy-light border border-border-light dark:border-white/20 text-slate-700 dark:text-white text-xs focus:outline-none focus:border-gold">
                                  <option value="" disabled>Unit</option>
                                  <option value="pc">pc</option>
                                  <option value="pcs">pcs</option>
                                  <option value="kg">kg</option>
                                  <option value="ltr">ltr</option>
                                </select>
                              </td>
                              <td className="py-1.5 pr-2">
                                <input type="number" step="0.01" value={item.unit_price || ''} onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value === '' ? null : Number(e.target.value))}
                                  className="w-20 px-2 py-1 rounded bg-ivory dark:bg-navy-light border border-border-light dark:border-white/20 text-slate-700 dark:text-white text-xs text-right focus:outline-none focus:border-gold" />
                              </td>
                              <td className="py-1.5 pr-2">
                                <input type="number" step="0.01" value={item.total_price || ''} onChange={(e) => handleItemChange(idx, 'total_price', e.target.value === '' ? null : Number(e.target.value))}
                                  className="w-20 px-2 py-1 rounded bg-ivory dark:bg-navy-light border border-border-light dark:border-white/20 text-slate-700 dark:text-white text-xs text-right focus:outline-none focus:border-gold" />
                              </td>
                              <td className="py-1.5">
                                <button type="button" onClick={() => handleRemoveItem(idx)}
                                  className="text-danger/60 hover:text-danger transition-colors">
                                  <Trash2 size={12} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="border-t border-border-light dark:border-white/10 pt-5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-3 text-slate-400 dark:text-white/60 font-mono">Notes</p>
                  <textarea rows={3} value={editDetail.notes || ''} onChange={(e) => handleEditChange('notes', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-ivory dark:bg-navy-light border border-border-light dark:border-white/20 text-slate-700 dark:text-white text-sm focus:outline-none focus:border-gold resize-none" />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border-light dark:border-white/10">
                  <button
                    onClick={() => setDeleteConfirm(editRFQ)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-danger/30 text-danger hover:bg-danger/10 text-sm font-medium transition-all duration-200"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setEditRFQ(null); setEditDetail(null); navigate('/rfqs', { replace: true }); }}
                      className="px-4 py-2.5 rounded-lg border border-border-light dark:border-white/20 text-slate-400 dark:text-white/60 hover:text-slate-700 dark:hover:text-white text-sm transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleEditSave}
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-gold text-navy rounded-lg text-sm font-semibold hover:bg-gold-dark hover:shadow-gold active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
                    >
                      <Save size={16} />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center scrim backdrop-blur-sm">
          <div className="bg-white dark:bg-navy rounded-xl shadow-elevated border border-border-light dark:border-white/10 p-6 max-w-sm w-full mx-4 animate-scaleIn">
            <h3 className="text-lg font-semibold text-slate-700 dark:text-white mb-2">Delete RFQ</h3>
            <p className="text-sm text-slate-400 dark:text-white/60 mb-6">
              Are you sure you want to delete <span className="font-semibold text-slate-700 dark:text-white">{deleteConfirm.rfq_number}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg border border-border-light dark:border-white/20 text-slate-400 dark:text-white/60 hover:text-slate-700 dark:hover:text-white text-sm transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleEditDelete}
                className="px-4 py-2 rounded-lg bg-danger text-white text-sm font-semibold hover:bg-danger/90 transition-all duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RFQList;
