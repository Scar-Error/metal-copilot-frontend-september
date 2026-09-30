import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import rfqService from '../services/rfqService';
import { Search, Eye, RefreshCw, Loader2, Trash2, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import Pagination from '../components/Pagination';
import PageHeader from '../components/PageHeader';
import CategoryTag from '../components/CategoryTag';

const PurchaseOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ search: '' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    fetchPurchaseOrders();
  }, [filters, page, pageSize]);

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.search) params.search = filters.search;
      params.page = page;
      params.page_size = pageSize;

      const response = await rfqService.getPurchaseOrders(params);
      setOrders(response.results || response);
      setTotal(response.count || response.length);
      setError(null);
    } catch (err) {
      setError('Failed to fetch purchase orders');
      toast.error('Failed to fetch purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (order) => {
    navigate(`/rfqs/${order.rfq_number}`);
  };

  const handleDelete = async (order) => {
    try {
      await rfqService.deleteRFQ(order.id);
      toast.success('Purchase order deleted');
      setDeleteConfirm(null);
      fetchPurchaseOrders();
    } catch {
      toast.error('Failed to delete purchase order');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedOrders.length === 0) return;
    setBulkDeleting(true);
    try {
      await rfqService.bulkDeleteRFQs(selectedOrders);
      toast.success(`${selectedOrders.length} purchase order(s) deleted`);
      setSelectedOrders([]);
      setBulkDeleteConfirm(false);
      fetchPurchaseOrders();
    } catch {
      toast.error('Failed to delete purchase orders');
    } finally {
      setBulkDeleting(false);
    }
  };

  const toggleAll = () => {
    if (selectedOrders.length === orders.length && orders.length > 0) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map((o) => o.id));
    }
  };

  const toggleOne = (id) => {
    setSelectedOrders((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-0 w-full max-w-full overflow-x-hidden animate-fadeInUp">
      <PageHeader
        icon={ShoppingCart}
        title="Purchase"
        accent="Orders"
        subtitle="Review and manage confirmed customer purchase orders."
      />

      <div className="card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[240px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/60" size={16} />
              <input
                type="text"
                placeholder="Search orders..."
                value={filters.search}
                onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
                className="w-full bg-ivory dark:bg-navy-light border border-border-light dark:border-white/20 rounded-lg pl-10 pr-4 py-2 text-slate-700 dark:text-white text-sm placeholder:text-slate-300 dark:placeholder:text-white/30 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/25"
              />
            </div>
          </div>
          <button
            onClick={fetchPurchaseOrders}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border-light dark:border-white/20 text-slate-700 dark:text-white/80 hover:border-gold hover:text-gold text-sm font-medium transition-all duration-200"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          {selectedOrders.length > 0 && (
            <button
              onClick={() => setBulkDeleteConfirm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 text-sm font-medium transition-all duration-200"
            >
              <Trash2 size={16} />
              Delete ({selectedOrders.length})
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center h-[calc(100vh-260px)] gap-3">
          <Loader2 size={32} className="animate-spin text-gold" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 dark:text-white/60">
            Loading orders...
          </span>
        </div>
      ) : error ? (
        <div className="px-4 py-3 rounded-lg text-sm border border-danger/30 bg-danger/10 text-danger">
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="card p-12 text-center">
          <ShoppingCart size={32} className="mx-auto mb-3 text-slate-300 dark:text-white/30" />
          <p className="text-sm font-mono text-slate-400 dark:text-white/60">No purchase orders found</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-border-light dark:border-white/10 bg-ivory dark:bg-navy-light">
                  <th className="px-5 py-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={selectedOrders.length === orders.length && orders.length > 0}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded border-border-light dark:border-white/20 text-gold focus:ring-2 focus:ring-gold/40"
                    />
                  </th>
                  <th className="px-5 py-3.5 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-400 dark:text-white/60 font-mono">RFQ Number</th>
                  <th className="px-5 py-3.5 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-400 dark:text-white/60 font-mono">Company</th>
                  <th className="px-5 py-3.5 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-400 dark:text-white/60 font-mono">PO Number</th>
                  <th className="px-5 py-3.5 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-400 dark:text-white/60 font-mono">Tag</th>
                  <th className="px-5 py-3.5 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-400 dark:text-white/60 font-mono">Date</th>
                  <th className="px-5 py-3.5 text-right text-[9px] font-semibold uppercase tracking-wider text-slate-400 dark:text-white/60 font-mono">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className={`border-b border-border-light dark:border-white/5 last:border-0 transition-all duration-150 hover:bg-gold/[0.02] ${selectedOrders.includes(order.id) ? 'selected-row' : ''}`}
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => toggleOne(order.id)}
                        className="w-4 h-4 rounded border-border-light dark:border-white/20 text-gold focus:ring-2 focus:ring-gold/40"
                      />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-sm font-medium text-gold font-mono">{order.rfq_number}</span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-sm font-medium text-slate-700 dark:text-white">{order.company_name || '-'}</span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm font-mono text-slate-700 dark:text-white">{order.po_number || '-'}</td>
                    {/* Which tag the AI gave the thread this order came from. This
                        page only lists PO-tagged threads, so anything shown here
                        carries the PO tag. */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <CategoryTag category={order.thread_category} />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm font-mono text-slate-400 dark:text-white/60">
                      {order.created_at ? new Date(order.created_at).toLocaleDateString('en-GB') : '-'}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleView(order)}
                          aria-label="View order"
                          className="text-slate-400 dark:text-white/60 hover:text-gold transition-colors duration-200"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(order)}
                          aria-label="Delete order"
                          className="text-slate-400 dark:text-white/60 hover:text-danger transition-colors duration-200"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={total > 0 ? Math.ceil(total / pageSize) : 1}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
          />
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 scrim backdrop-blur-sm animate-fadeIn" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white dark:bg-navy rounded-xl shadow-elevated border border-border-light dark:border-white/10 p-6 max-w-md w-full mx-4 animate-scaleIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center">
                <Trash2 size={20} className="text-danger" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 dark:text-white">Delete Purchase Order</h3>
            </div>

            <p className="text-sm text-slate-600 dark:text-white/80 mb-6 leading-relaxed">
              Are you sure you want to delete purchase order{' '}
              <span className="font-semibold text-slate-700 dark:text-white font-mono">{deleteConfirm.rfq_number}</span>? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg border border-border-light dark:border-white/20 text-slate-700 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5 transition-all duration-200 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 rounded-lg bg-danger text-white hover:bg-danger/90 transition-all duration-200 text-sm font-medium flex items-center gap-2"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 scrim backdrop-blur-sm animate-fadeIn" onClick={() => setBulkDeleteConfirm(false)} />
          <div className="relative bg-white dark:bg-navy rounded-xl shadow-elevated border border-border-light dark:border-white/10 p-6 max-w-md w-full mx-4 animate-scaleIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center">
                <Trash2 size={20} className="text-danger" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 dark:text-white">Delete Purchase Orders</h3>
            </div>

            <p className="text-sm text-slate-600 dark:text-white/80 mb-6 leading-relaxed">
              Are you sure you want to delete {selectedOrders.length} purchase order(s)? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setBulkDeleteConfirm(false)}
                disabled={bulkDeleting}
                className="px-4 py-2 rounded-lg border border-border-light dark:border-white/20 text-slate-700 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5 transition-all duration-200 text-sm font-medium disabled:opacity-60"
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
    </div>
  );
};

export default PurchaseOrders;
