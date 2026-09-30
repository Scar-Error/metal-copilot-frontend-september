import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  KanbanSquare,
  X,
  ArrowLeft,
  FileText,
  Loader2,
  Mail,
  MessageSquare,
  Clock,
  Download,
  Plus,
  Trash2,
} from 'lucide-react';
import dealService from '../../services/dealService';
import PageHeader from '../../components/PageHeader';
import DateInput from '../../components/DateInput';
import DateTimeInput, { DateTimePanel } from '../../components/DateTimeInput';
import toast from 'react-hot-toast';

const stages = [
  { key: 'synced', label: 'Synced', color: 'border-blue-500' },
  { key: 'ai_analysis', label: 'AI Analysis', color: 'border-indigo-500' },
  { key: 'categorized', label: 'Categorized', color: 'border-violet-500' },
  { key: 'inquiry', label: 'Inquiry', color: 'border-gold' },
  { key: 'quotation', label: 'Quotation', color: 'border-navy dark:border-gold' },
  { key: 'negotiation', label: 'Negotiation', color: 'border-amber' },
  { key: 'order', label: 'Order', color: 'border-emerald' },
  { key: 'fulfilled', label: 'Fulfilled', color: 'border-emerald' },
  { key: 'archived', label: 'Archived', color: 'border-slate-300 dark:border-white/20' },
];

const tagStyles = {
  thread: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20', leftBorder: 'border-l-blue-500', btnBg: 'bg-blue-500/10', btnText: 'text-blue-500', btnHover: 'hover:bg-blue-500/20' },
  rfq: { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/20', leftBorder: 'border-l-amber-500', btnBg: 'bg-amber-500/10', btnText: 'text-amber-600', btnHover: 'hover:bg-amber-500/20' },
  po: { bg: 'bg-violet-500/10', text: 'text-violet-600', border: 'border-violet-500/20', leftBorder: 'border-l-violet-500', btnBg: 'bg-violet-500/10', btnText: 'text-violet-600', btnHover: 'hover:bg-violet-500/20' },
  quotation: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/20', leftBorder: 'border-l-emerald-500', btnBg: 'bg-emerald-500/10', btnText: 'text-emerald-600', btnHover: 'hover:bg-emerald-500/20' },
  other: { bg: 'bg-slate-500/10', text: 'text-slate-500', border: 'border-slate-500/20', leftBorder: 'border-l-slate-500', btnBg: 'bg-slate-500/10', btnText: 'text-slate-500', btnHover: 'hover:bg-slate-500/20' },
  manual: { bg: 'bg-gold/10', text: 'text-gold', border: 'border-gold/20', leftBorder: 'border-l-gold', btnBg: 'bg-gold/10', btnText: 'text-gold', btnHover: 'hover:bg-gold/20' },
};

const getTagStyle = (thread) => {
  if (thread.is_manual) return tagStyles.manual;
  if (thread.category) return tagStyles[thread.category] || tagStyles.other;
  return tagStyles.thread;
};

const getTagLabel = (thread) => {
  if (thread.is_manual) return 'Manual';
  if (thread.category) return thread.category.toUpperCase();
  return 'Thread';
};

// The per-card delete button was removed from the board: with ~160 cards rendered
// at once it added a control to every card that most users never touch, and it
// crowded the card header. Deleting a single thread is now done from inside the
// thread's own detail view (ConversationDialog), next to "Save Changes", so the
// board stays clean. Bulk delete on the board is unchanged.
const EmailThreadCard = ({ thread, index, onViewDeal, selectionMode, selected, onToggleSelect }) => {
  const tagStyle = getTagStyle(thread);
  const tagLabel = getTagLabel(thread);
  // The list payload no longer includes `messages` (that is fetched on "View Deal"),
  // so the card reads the latest sender from the lightweight fields the API annotates.
  const sender = thread.last_sender_name || thread.last_sender_email;

  return (
    <Draggable
      draggableId={`thread-${thread.id}`}
      index={index}
      // While selecting for bulk delete, disable dragging so a click meant to tick
      // a checkbox can never accidentally move the card to another stage.
      isDragDisabled={selectionMode}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white dark:bg-navy rounded-xl p-4 mb-3 border border-border-light dark:border-white/10 border-l-4 ${tagStyle.leftBorder} shadow-card transition-all duration-200 ${
            snapshot.isDragging ? 'kanban-card-dragging shadow-gold' : 'hover:shadow-gold card-hover'
          } ${selected ? 'ring-2 ring-gold' : ''}`}
        >
          <div className="flex items-center justify-between mb-2">
            {selectionMode ? (
              // Selection mode replaces the tag badge with a checkbox so the user can
              // tick threads to include in the bulk delete.
              <label
                className="flex items-center gap-2 cursor-pointer select-none"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => onToggleSelect(thread.id)}
                  className="w-4 h-4 rounded border-border-light dark:border-white/20 text-gold focus:ring-2 focus:ring-gold/40"
                />
                <span className="text-[9px] font-mono font-semibold uppercase tracking-wider text-slate-400 dark:text-white/60">
                  Select
                </span>
              </label>
            ) : (
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono font-semibold uppercase tracking-wider border ${tagStyle.bg} ${tagStyle.text} ${tagStyle.border}`}>
                {thread.is_manual ? <FileText size={9} className="mr-1" /> : <Mail size={9} className="mr-1" />}
                {tagLabel}
              </span>
            )}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400 dark:text-white/60 flex items-center gap-1">
                <MessageSquare size={9} />
                {thread.message_count}
              </span>
            </div>
          </div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-white mb-2 truncate">{thread.subject || '(no subject)'}</h4>
          <div className="space-y-1 text-[11px] text-slate-400 dark:text-white/60">
            {sender && <p>{sender}</p>}
            {thread.last_message_at && (
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {new Date(thread.last_message_at).toLocaleDateString('en-GB')}
              </span>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onViewDeal(thread); }}
            className={`mt-3 w-full py-1.5 px-3 ${tagStyle.btnBg} ${tagStyle.btnText} rounded text-[11px] font-semibold ${tagStyle.btnHover} transition-all duration-200 flex items-center justify-center gap-1.5`}
          >
            <FileText size={12} />
            View Deal
          </button>
        </div>
      )}
    </Draggable>
  );
};

const CreateDealModal = ({ isOpen, onClose, onCreateDeal }) => {
  const [form, setForm] = useState({
    company_name: '',
    budget: '',
    delivery_date: '',
    notes: '',
  });
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFilesChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.company_name.trim()) {
      toast.error('Company name is required');
      return;
    }
    setSaving(true);
    try {
      await onCreateDeal({
          company_name: form.company_name.trim(),
          budget: form.budget ? parseFloat(form.budget) : null,
          delivery_date: form.delivery_date || null,
          notes: form.notes.trim() || '',
          source: 'manual',
          attachments: files,
        });
      setForm({ company_name: '', budget: '', delivery_date: '', notes: '' });
      setFiles([]);
      onClose();
    } catch {
      toast.error('Failed to create deal');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 scrim backdrop-blur-sm animate-fadeIn" onClick={onClose} />
      <div className="relative bg-white dark:bg-navy rounded-xl shadow-elevated border border-border-light dark:border-white/10 w-full max-w-md p-6 animate-scaleIn">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
              <Plus size={20} className="text-gold" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-700 dark:text-white">Create Deal</h2>
              <p className="text-xs text-slate-400 dark:text-white/60">Manually create a new deal</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 dark:text-white/60 hover:text-slate-700 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-slate-400 dark:text-white/60">
              Company Name *
            </label>
            <input
              name="company_name"
              value={form.company_name}
              onChange={handleChange}
              placeholder="Enter company name"
              className="w-full px-3 py-2 rounded-lg bg-ivory dark:bg-navy-light border border-border-light dark:border-white/20 text-slate-700 dark:text-white text-sm focus:outline-none focus:border-gold"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-slate-400 dark:text-white/60">
                Budget
              </label>
              <input
                name="budget"
                type="number"
                value={form.budget}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-lg bg-ivory dark:bg-navy-light border border-border-light dark:border-white/20 text-slate-700 dark:text-white text-sm focus:outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-slate-400 dark:text-white/60">
                Delivery Date
              </label>
              <DateInput
                value={form.delivery_date}
                onChange={(v) => handleChange({ target: { name: 'delivery_date', value: v } })}
                className="w-full px-3 py-2 rounded-lg bg-ivory dark:bg-navy-light border border-border-light dark:border-white/20 text-slate-700 dark:text-white text-sm focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-slate-400 dark:text-white/60">
              Notes
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Add any notes..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-ivory dark:bg-navy-light border border-border-light dark:border-white/20 text-slate-700 dark:text-white text-sm focus:outline-none focus:border-gold resize-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-slate-400 dark:text-white/60">
              Attachments
            </label>
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border-light dark:border-white/20 rounded-lg cursor-pointer hover:border-gold/50 transition-all duration-200">
              <div className="flex flex-col items-center justify-center pt-2 pb-1">
                <Download size={20} className="mb-1 text-slate-400 dark:text-white/60" />
                <p className="text-xs text-slate-400 dark:text-white/60">
                  <span className="text-gold font-semibold">Browse</span> or drop files
                </p>
                <p className="text-[10px] text-slate-400/60 dark:text-white/40">PDF, Excel, Images, Documents</p>
              </div>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFilesChange}
                accept=".pdf,.xlsx,.xls,.doc,.docx,.png,.jpg,.jpeg,.gif,.bmp,.tiff,.csv,.txt"
              />
            </label>
            {files.length > 0 && (
              <div className="mt-2 space-y-1">
                {files.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between px-2 py-1 bg-ivory dark:bg-navy-light rounded text-xs">
                    <span className="truncate text-slate-700 dark:text-white max-w-[200px]">{file.name}</span>
                    <button type="button" onClick={() => removeFile(idx)} className="text-slate-400 hover:text-red-500 ml-2 shrink-0">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 px-4 bg-gold text-navy font-semibold rounded-lg text-sm hover:bg-gold/90 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Create Deal
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-lg border border-border-light dark:border-white/20 text-slate-400 dark:text-white/60 hover:text-slate-700 dark:hover:text-white text-sm transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EmailBody = ({ html }) => {
  const iframeRef = React.useRef(null);

  React.useEffect(() => {
    if (iframeRef.current && html) {
      const doc = iframeRef.current.contentDocument;
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
        <head><style>
          body { margin: 0; padding: 8px; font-family: inherit; font-size: 13px; line-height: 1.5; color: inherit; }
          img { max-width: 100%; height: auto; }
          a { color: #2563eb; }
          table { border-collapse: collapse; }
        </style></head>
        <body>${html}</body>
        </html>
      `);
      doc.close();

      const resize = () => {
        try {
          const h = doc.body?.scrollHeight || 0;
          iframeRef.current.style.height = Math.min(h, 800) + 'px';
        } catch {}
      };
      resize();
      iframeRef.current.addEventListener('load', resize);
    }
  }, [html]);

  if (!html) return null;
  return (
    <iframe
      ref={iframeRef}
      sandbox="allow-same-origin"
      title="Email content"
      className="w-full border-0 overflow-hidden"
      style={{ minHeight: '100px' }}
    />
  );
};

const ConfirmDeleteModal = ({ isOpen, count, isBulk, onConfirm, onCancel, deleting }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 scrim backdrop-blur-sm animate-fadeIn" onClick={onCancel} />
      <div className="relative bg-white dark:bg-navy rounded-xl shadow-elevated border border-border-light dark:border-white/10 w-full max-w-md p-6 animate-scaleIn">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-danger/10 flex items-center justify-center">
            <Trash2 size={20} className="text-danger" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-700 dark:text-white">
              {isBulk ? `Delete ${count} thread${count === 1 ? '' : 's'}?` : 'Delete this thread?'}
            </h2>
            <p className="text-xs text-slate-400 dark:text-white/60">This cannot be undone</p>
          </div>
        </div>

        <p className="text-sm text-slate-500 dark:text-white/70 mb-6">
          {isBulk
            ? `The selected ${count} thread${count === 1 ? '' : 's'} and all of their email messages will be permanently deleted.`
            : 'This thread and all of its email messages will be permanently deleted.'}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-2.5 px-4 bg-danger text-white font-semibold rounded-lg text-sm hover:opacity-90 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            Delete
          </button>
          <button
            onClick={onCancel}
            className="py-2.5 px-4 rounded-lg border border-border-light dark:border-white/20 text-slate-400 dark:text-white/60 hover:text-slate-700 dark:hover:text-white text-sm transition-all duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const ConversationDialog = ({ thread, deal: initialDeal, isOpen, onClose, onSaveDeal, onSaveThread, onDeleteThread, messagesLoading }) => {
  const [dealForm, setDealForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState(new Set());

  React.useEffect(() => {
    if (thread) {
      const order = thread.orders?.[0] || initialDeal;
      setDealForm({
        stage: thread.stage || 'synced',
        title: order?.rfq_number || '',
        type: order?.type || 'rfq',
        value: order?.budget || '',
        expected_date: order?.delivery_date || '',
        company: order?.company_name || '',
        contact_person: order?.contact_person || '',
        notes: order?.notes || '',
      });
    } else if (initialDeal) {
      setDealForm({
        stage: 'inquiry',
        title: initialDeal.rfq_number || '',
        type: initialDeal.type || 'rfq',
        value: initialDeal.budget || '',
        expected_date: initialDeal.delivery_date || '',
        company: initialDeal.company_name || '',
        contact_person: initialDeal.contact_person || '',
        notes: initialDeal.notes || '',
      });
    }
  }, [thread?.id, initialDeal?.id]);

  if (!isOpen) return null;
  if (!thread && !initialDeal) return null;

  const order = thread?.orders?.[0] || initialDeal;
  const conversation = thread?.messages || [];

  const handleDealChange = (e) => {
    setDealForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveDeal = async () => {
    if (!dealForm) return;
    setSaving(true);
    try {
      if (thread && onSaveThread && dealForm.stage !== thread.stage) {
        await onSaveThread(thread.id, { stage: dealForm.stage });
      }
      if (order && onSaveDeal) {
        const orderData = {
          company_name: dealForm.company,
          budget: dealForm.value || null,
          delivery_date: dealForm.expected_date || null,
          notes: dealForm.notes,
          type: dealForm.type,
        };
        await onSaveDeal(order.id, orderData);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col bg-white dark:bg-navy h-full">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border-light dark:border-white/10 shrink-0">
        {/* Back arrow on the left, where the eye already is when reading a
            conversation. It closes the thread view and puts the board back, the
            same thing the "Pipeline" link in the sidebar does. There is no X on
            the right: this is a step back through the pipeline, not a dismissible
            overlay. */}
        <button
          onClick={onClose}
          title="Back to pipeline"
          aria-label="Back to pipeline"
          className="shrink-0 -ml-1 p-1.5 rounded-lg text-slate-400 dark:text-white/60 hover:text-gold hover:bg-gold/10 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-slate-700 dark:text-white truncate">
            {thread ? (thread.subject || '(no subject)') : (order?.rfq_number || 'New Order')}
          </h2>
          <p className="text-xs text-slate-400 dark:text-white/60 mt-0.5">
            {thread && (
              <>
                {thread.message_count} {thread.message_count === 1 ? 'message' : 'messages'}
                {thread.category && (
                  <span className={`ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-mono font-semibold uppercase tracking-wider border ${
                    thread.category === 'rfq' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                    thread.category === 'quotation' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                    thread.category === 'po' ? 'bg-violet-500/10 text-violet-600 border-violet-500/20' :
                    'bg-slate-500/10 text-slate-500 border-slate-500/20'
                  }`}>
                    {thread.category.toUpperCase()}
                  </span>
                )}
              </>
            )}
            {!thread && order && (
              <span className="ml-2 text-[11px] font-mono">#{order.rfq_number}</span>
            )}
          </p>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 border-r border-border-light dark:border-white/10">
            {messagesLoading ? (
              // Messages are fetched only after "View Deal" is clicked, so show a
              // loader here instead of briefly flashing "No messages in this thread".
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400 dark:text-white/60">
                <Loader2 size={28} className="animate-spin text-gold" />
                <p className="text-sm font-mono text-[10px] uppercase tracking-widest">Loading messages...</p>
              </div>
            ) : conversation.length > 0 ? (
              conversation.map((msg, idx) => {
                const isLast = idx === conversation.length - 1;
                const isExpanded = expandedMessages.has(msg.id) || (expandedMessages.size === 0 && isLast);
                // Each message carries its own category from the AI analysis,
                // which is independent of the thread tag in the header above.
                // Untagged messages (never analyzed) show nothing here.
                const msgTagStyle = msg.category ? (tagStyles[msg.category] || tagStyles.other) : null;
                return (
                <div key={msg.id} className="border border-border-light dark:border-white/10 rounded-lg overflow-hidden">
                  <button
                    onClick={() => {
                      setExpandedMessages((prev) => {
                        const next = new Set(prev);
                        if (next.has(msg.id)) next.delete(msg.id);
                        else next.add(msg.id);
                        return next;
                      });
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-ivory dark:hover:bg-navy-light transition-colors"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-xs font-bold text-gold">
                        {(msg.sender_name || msg.sender_email || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-white">{msg.sender_name || msg.sender_email}</p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-[10px] text-slate-400 dark:text-white/60">{msg.subject}</p>
                          {msgTagStyle && (
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-mono font-semibold uppercase tracking-wider border ${msgTagStyle.bg} ${msgTagStyle.text} ${msgTagStyle.border}`}
                              title={`This message: ${msg.category.toUpperCase()}`}
                            >
                              {msg.category.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-white/60">
                      {msg.received_at ? new Date(msg.received_at).toLocaleDateString('en-GB') : ''}
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-border-light dark:border-white/10">
                      <EmailBody html={msg.body} />
                    </div>
                  )}
                </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-white/60">
                <Mail size={32} className="mb-3 opacity-50" />
                <p className="text-sm">No messages in this thread</p>
              </div>
            )}
          </div>

          <div className="w-80 overflow-y-auto p-6 bg-ivory/50 dark:bg-navy-light/50">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-white/60 mb-4">Deal Details</h3>
            {dealForm && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1 text-slate-400 dark:text-white/60">Stage</label>
                  <select
                    name="stage"
                    value={dealForm.stage}
                    onChange={handleDealChange}
                    className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-navy text-xs text-slate-700 dark:text-white border border-border-light dark:border-white/20 focus:outline-none focus:border-gold"
                  >
                    {stages.map((s) => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1 text-slate-400 dark:text-white/60">Company</label>
                  <input name="company" value={dealForm.company} onChange={handleDealChange}
                    className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-navy text-xs text-slate-700 dark:text-white border border-border-light dark:border-white/20 focus:outline-none focus:border-gold" />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1 text-slate-400 dark:text-white/60">Value ($)</label>
                  <input name="value" type="number" value={dealForm.value} onChange={handleDealChange}
                    className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-navy text-xs text-slate-700 dark:text-white border border-border-light dark:border-white/20 focus:outline-none focus:border-gold" />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1 text-slate-400 dark:text-white/60">Expected Date</label>
                  <DateInput value={dealForm.expected_date} onChange={(v) => handleDealChange({ target: { name: 'expected_date', value: v } })}
                    className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-navy text-xs text-slate-700 dark:text-white border border-border-light dark:border-white/20 focus:outline-none focus:border-gold" />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1 text-slate-400 dark:text-white/60">Notes</label>
                  <textarea name="notes" value={dealForm.notes} onChange={handleDealChange} rows={3}
                    className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-navy text-xs text-slate-700 dark:text-white border border-border-light dark:border-white/20 focus:outline-none focus:border-gold resize-none" />
                </div>

                <button
                  onClick={handleSaveDeal}
                  disabled={saving}
                  className="w-full py-2 px-4 bg-gold text-navy font-semibold rounded-lg text-sm hover:bg-gold/90 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                  Save Changes
                </button>

                {/* Delete lives here rather than on the board card, so it is only
                    shown for the thread the user has actually opened. Confirmation
                    is handled by the parent's ConfirmDeleteModal. */}
                {thread && onDeleteThread && (
                  <button
                    onClick={() => onDeleteThread(thread)}
                    className="w-full py-2 px-4 text-danger bg-danger/10 font-semibold rounded-lg text-sm hover:bg-danger/20 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Trash2 size={14} />
                    Delete Thread
                  </button>
                )}
              </div>
            )}
          </div>
      </div>
    </div>
  );
};

const PullEmailsModal = ({ isOpen, onClose, onPull, running = false }) => {
  const getDefaultStart = () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 16);
  };
  const getDefaultEnd = () => new Date().toISOString().slice(0, 16);

  const [start, setStart] = useState(getDefaultStart);
  const [end, setEnd] = useState(getDefaultEnd);
  const [loading, setLoading] = useState(false);
  const [activeField, setActiveField] = useState('start');

  useEffect(() => {
    if (!isOpen) setActiveField('start');
  }, [isOpen]);

  const handlePull = async () => {
    setLoading(true);
    try {
      await onPull(start, end);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const busy = loading || running;
  const fieldClass = (field) =>
    `w-full px-3 py-2 rounded-lg bg-ivory dark:bg-navy-light border text-sm text-slate-700 dark:text-white focus:outline-none transition-colors ${
      activeField === field ? 'border-gold ring-1 ring-gold' : 'border-border-light dark:border-white/20 hover:border-gold/40'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 scrim backdrop-blur-sm animate-fadeIn" onClick={onClose} />
      <div className="relative bg-white dark:bg-navy rounded-xl shadow-elevated border border-border-light dark:border-white/10 w-full max-w-2xl p-6 animate-scaleIn max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
              <Download size={20} className="text-gold" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-700 dark:text-white">Pull Emails</h2>
              <p className="text-xs text-slate-400 dark:text-white/60">Sync emails from Outlook</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 dark:text-white/60 hover:text-slate-700 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="sm:w-72 shrink-0">
            <DateTimePanel
              key={activeField}
              header={`Editing ${activeField === 'start' ? 'From' : 'To'}`}
              value={activeField === 'start' ? start : end}
              onChange={(iso) => (activeField === 'start' ? setStart(iso) : setEnd(iso))}
              onClose={() => {}}
            />
          </div>

          <div className="flex-1 flex flex-col space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-slate-400 dark:text-white/60">From</label>
              <DateTimeInput
                controlOnly
                value={start}
                onChange={setStart}
                onRequestOpen={() => setActiveField('start')}
                className={fieldClass('start')}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-slate-400 dark:text-white/60">To</label>
              <DateTimeInput
                controlOnly
                value={end}
                onChange={setEnd}
                onRequestOpen={() => setActiveField('end')}
                className={fieldClass('end')}
              />
            </div>

            <div className="flex gap-3 mt-auto pt-4">
              <button
                onClick={handlePull}
                disabled={busy}
                className="flex-1 py-2.5 px-4 bg-gold text-navy font-semibold rounded-lg text-sm hover:bg-gold-dark transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {busy ? 'Pulling Emails…' : 'Pull Now'}
              </button>
              <button
                onClick={onClose}
                disabled={running}
                className="py-2.5 px-4 rounded-lg border border-border-light dark:border-white/20 text-slate-400 dark:text-white/60 hover:text-slate-700 dark:hover:text-white text-sm transition-all duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Deals = () => {
  const [pullModalOpen, setPullModalOpen] = useState(false);
  const [pullStatus, setPullStatus] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  // Which thread is open lives in the URL (`/deals?id=<threadId>`) rather than in
  // component state, so the address bar always names the deal the user is inside
  // and the thread can be linked to, reloaded or bookmarked. It also means the
  // open thread is derived state: clicking "Pipeline" in the left sidebar goes
  // to `/deals` with no `id`, the URL changes, and the thread view closes itself
  // — no state has to be reset by hand, so the sidebar always wins over an
  // overlay that is still on screen.
  const [searchParams, setSearchParams] = useSearchParams();
  const openThreadIdParam = searchParams.get('id');
  const openThreadId = openThreadIdParam != null && /^\d+$/.test(openThreadIdParam)
    ? Number(openThreadIdParam)
    : null;
  // Bulk-delete state. `selectionMode` turns the cards' tag badges into checkboxes;
  // `selectedThreadIds` holds the ticked threads.
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedThreadIds, setSelectedThreadIds] = useState([]);
  // Pending deletion awaiting confirmation: { ids, count, isBulk } or null.
  const [pendingDelete, setPendingDelete] = useState(null);
  const queryClient = useQueryClient();

  // Part 1 of the payload split: on page load this returns every thread's metadata
  // (subject, stage, category, counts, orders) with NO message bodies.
  const { data: threads = [], isLoading: threadsLoading } = useQuery({
    queryKey: ['emailThreads'],
    queryFn: () => dealService.getEmailThreads(),
    refetchOnMount: 'always',
  });

  // The open thread is the one the URL points at. Resolving it from the board
  // payload (rather than keeping a second copy in state) means a link to a thread
  // id opens as soon as the board has loaded, and a stale id simply opens nothing
  // instead of firing a request that would 404.
  const openThread = threads.find((t) => t.id === openThreadId) || null;
  const openOrder = openThread?.orders?.[0] || null;

  // Part 2 of the payload split: the message bodies for a single thread are only
  // requested once the user opens that thread's "View Deal" view. `enabled` keeps
  // the request from firing until a thread is actually selected.
  const { data: threadDetail, isLoading: messagesLoading } = useQuery({
    queryKey: ['emailThreadDetail', openThreadId],
    queryFn: () => dealService.getEmailThread(openThreadId),
    enabled: openThreadId != null && openThread != null,
    // Reuse the cached detail when reopening the same thread, but refetch in the
    // background so a thread that changed server-side still refreshes.
    staleTime: 30_000,
  });

  const pullMutation = useMutation({
    mutationFn: ({ start_time, end_time }) => dealService.pullEmails(start_time, end_time),
    onSuccess: (data) => {
      const taskId = data.task_id;
      if (!taskId) return;
      setPullStatus({ task_id: taskId });
      toast.success('Email pull started in the background');

      let tries = 0;
      const MAX_TRIES = 150;
      const tick = async () => {
        tries += 1;
        try {
          const statusData = await dealService.getTaskStatus(taskId);
          setPullStatus((prev) => ({ ...(prev || {}), status: statusData.status }));
          if (statusData.status === 'SUCCESS') {
            setPullStatus(null);
            queryClient.invalidateQueries(['emailThreads']);
            // New messages were just ingested, so refresh any open thread detail
            // too — it is cached under its own query key and would otherwise go stale.
            queryClient.invalidateQueries({ queryKey: ['emailThreadDetail'] });
            setPullModalOpen(false);
            const result = statusData.result || {};
            if (result.success === false && result.error) {
              toast.error(result.error || 'Email pull failed');
              return;
            }
            const parts = [];
            if (result.threads_created) parts.push(`${result.threads_created} new threads`);
            if (result.threads_updated) parts.push(`${result.threads_updated} threads updated`);
            if (result.messages_created) parts.push(`${result.messages_created} new messages`);
            const summary = parts.length ? `: ${parts.join(', ')}` : '';
            toast.success(result.total_fetched !== undefined
              ? `Pulled ${result.total_fetched} emails${summary}`
              : 'Email pull completed');
            return;
          }
          if (statusData.status === 'FAILURE') {
            setPullStatus(null);
            toast.error(statusData.error || 'Email pull failed');
            return;
          }
        } catch {
          // transient network error — keep polling
        }
        if (tries >= MAX_TRIES) {
          setPullStatus(null);
          toast.error('Timed out waiting for the email pull to complete');
          return;
        }
        setTimeout(tick, 2000);
      };
      tick();
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Failed to start email pull');
    },
  });

  const createDealMutation = useMutation({
    mutationFn: (data) => dealService.createDeal(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['emailThreads']);
      setCreateModalOpen(false);
      toast.success('Deal created successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Failed to create deal');
    },
  });

  const updateDealMutation = useMutation({
    mutationFn: ({ id, data }) => dealService.updateDeal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['emailThreads']);
      toast.success('Deal updated');
    },
  });

  const updateThreadMutation = useMutation({
    mutationFn: ({ id, data }) => dealService.updateThread(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries(['emailThreads']);
      const previous = queryClient.getQueryData(['emailThreads']);
      queryClient.setQueryData(['emailThreads'], (old) =>
        (old || []).map((t) => (t.id === id ? { ...t, ...data } : t))
      );
      return { previous, data };
    },
    onSuccess: (result, variables, context) => {
      const { data } = context;
      if (data?.stage === 'ai_analysis') {
        categorizeMutation.mutate(variables.id);
      }
    },
    onError: (err, vars, context) => {
      if (context?.previous) queryClient.setQueryData(['emailThreads'], context.previous);
      toast.error('Failed to move thread');
    },
  });

  const categorizeMutation = useMutation({
    mutationFn: (threadId) => dealService.categorizeThread(threadId),
    onSuccess: (data) => {
      queryClient.setQueryData(['emailThreads'], (old) =>
        (old || []).map((t) => (t.id === data.id ? { ...t, category: data.category, stage: 'categorized' } : t))
      );
      // ai_errors means the AI never answered and every tag came back as the
      // `other` fallback. Saying "Categorized as OTHER" there would be a lie
      // about what happened, so the reason is shown instead.
      if (data.ai_errors?.length) {
        toast.error(`AI analysis failed - tagged as ${String(data.category).toUpperCase()} by fallback. ${data.ai_errors[0]}`);
        return;
      }
      toast.success(`Categorized as ${data.category.toUpperCase()}`);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.error || 'Failed to run AI analysis');
    },
  });

  // Both delete flows share one mutation so the confirm modal, cache refresh and
  // selection reset behave identically for single and bulk deletes.
  const deleteThreadsMutation = useMutation({
    mutationFn: ({ ids, isBulk }) =>
      isBulk ? dealService.bulkDeleteEmailThreads(ids) : dealService.deleteEmailThread(ids[0]),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['emailThreads']);
      // A thread may be open in the view, so drop its cached detail too.
      queryClient.invalidateQueries({ queryKey: ['emailThreadDetail'] });
      setSelectedThreadIds([]);
      setSelectionMode(false);
      setPendingDelete(null);
      // If the thread the user was viewing is one of the deleted ones, close it
      // instead of leaving it open on a thread that no longer exists.
      if (openThreadId != null && variables.ids.includes(openThreadId)) {
        closeThreadDialog();
      }
      toast.success(data?.message || `Thread${variables.isBulk ? 's' : ''} deleted successfully`);
    },
    onError: (err) => {

      toast.error(err.response?.data?.error || 'Failed to delete thread');
      setPendingDelete(null);
    },
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    // Ignore drags that happened while selecting for bulk delete.
    if (selectionMode) return;
    const { draggableId, destination } = result;
    const newStage = destination.droppableId;

    if (draggableId.startsWith('thread-')) {
      const threadId = parseInt(draggableId.replace('thread-', ''));
      const thread = threads.find((t) => t.id === threadId);
      if (thread && thread.stage !== newStage) {
        updateThreadMutation.mutate({ id: threadId, data: { stage: newStage } });
      }
    }
  };

  const handleSaveDeal = (dealId, data) => {
    updateDealMutation.mutate({ id: dealId, data });
  };

  const handleSaveThread = (threadId, data) => {
    updateThreadMutation.mutate({ id: threadId, data });
  };

  const openThreadDialog = (thread) => {
    // Push, not replace: the browser Back button then returns to the board the
    // same way the in-app back arrow does.
    setSearchParams({ id: String(thread.id) });
  };

  // Closing strips the `id` from the URL, which is what actually closes the
  // thread view — there is no separate piece of state to fall out of sync.
  // `replace` keeps the board from being buried under one history entry per
  // thread the user glanced at.
  const closeThreadDialog = () => {
    setSearchParams({}, { replace: true });
  };

  const handlePullEmails = (start_time, end_time) => {
    pullMutation.mutate({ start_time, end_time });
  };

  const handleCreateDeal = (data) => {
    createDealMutation.mutate(data);
  };

  // --- Bulk delete helpers ---
  // Toggling the header Delete button enters/leaves selection mode and always
  // clears the current selection, so a second visit starts fresh.
  const toggleSelectionMode = () => {
    setSelectionMode((prev) => {
      if (prev) setSelectedThreadIds([]);
      return !prev;
    });
  };

  const toggleThreadSelect = (threadId) => {
    setSelectedThreadIds((prev) =>
      prev.includes(threadId) ? prev.filter((id) => id !== threadId) : [...prev, threadId]
    );
  };

  const selectAllThreads = () => {
    setSelectedThreadIds((prev) =>
      prev.length === threads.length ? [] : threads.map((t) => t.id)
    );
  };

  const leaveSelectionMode = () => {
    setSelectionMode(false);
    setSelectedThreadIds([]);
  };

  // Single-thread delete: ask for confirmation, then delete just that thread.
  const requestDeleteThread = (thread) => {
    setPendingDelete({ ids: [thread.id], count: 1, isBulk: false });
  };

  // Bulk delete: ask for confirmation with the number of ticked threads.
  const requestBulkDelete = () => {
    if (selectedThreadIds.length === 0) return;
    setPendingDelete({ ids: selectedThreadIds, count: selectedThreadIds.length, isBulk: true });
  };

  const confirmDelete = () => {
    if (pendingDelete) {
      deleteThreadsMutation.mutate({ ids: pendingDelete.ids, isBulk: pendingDelete.isBulk });
    }
  };

  // Drop selection when leaving the page so it never leaks into a later visit.
  useEffect(() => {
    return () => {
      setSelectionMode(false);
      setSelectedThreadIds([]);
    };
  }, []);

  if (threadsLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-100px)] gap-3">
        <Loader2 size={32} className="animate-spin text-gold" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 dark:text-white/60">Loading pipeline...</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <PageHeader
        icon={KanbanSquare}
        title="Deals Pipeline"
        subtitle="Track RFQs, quotations, and purchase orders"
        actions={
          <>
            {/* Delete button. Clicking it puts the board into selection mode, which
                swaps each card's tag badge for a checkbox. Clicking again exits. */}
            <button
              onClick={toggleSelectionMode}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                selectionMode
                  ? 'bg-danger text-white shadow-gold'
                  : 'border border-border-light dark:border-white/20 text-slate-700 dark:text-white/80 hover:border-danger hover:text-danger'
              }`}
            >
              {selectionMode ? <X size={18} /> : <Trash2 size={18} />}
              {selectionMode ? 'Cancel' : 'Delete'}
            </button>
            <button
              onClick={() => setCreateModalOpen(true)}
              disabled={selectionMode}
              className="flex items-center gap-2 px-4 py-2.5 bg-gold text-navy rounded-lg text-sm font-semibold hover:bg-gold-dark hover:shadow-gold active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
            >
              <Plus size={18} />
              Create Deal
            </button>
            <button
              onClick={() => setPullModalOpen(true)}
              disabled={!!pullStatus || selectionMode}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border-light dark:border-white/20 text-slate-700 dark:text-white/80 hover:border-gold hover:text-gold text-sm font-semibold transition-all duration-200 disabled:opacity-50"
            >
              <Download size={18} />
              Pull Emails
            </button>
            {pullStatus && (
              <span className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-gold border border-gold/40 bg-gold/5">
                <Loader2 size={14} className="animate-spin" />
                Pulling emails...
              </span>
            )}
          </>
        }
      />

      {/* Selection bar: only shown in selection mode, and the bulk delete button
          only enables once at least one thread is ticked. */}
      {selectionMode && (
        <div className="w-full max-w-full mb-4 flex items-center gap-3 px-4 py-3 bg-gold/10 border border-gold/30 rounded-lg">
          <span className="text-sm text-slate-700 dark:text-white font-medium">
            {selectedThreadIds.length} of {threads.length} selected
          </span>
          <button
            onClick={selectAllThreads}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-white/80 bg-white dark:bg-navy border border-border-light dark:border-white/20 rounded hover:border-gold transition-all"
          >
            {selectedThreadIds.length === threads.length && threads.length > 0 ? 'Clear all' : 'Select all'}
          </button>
          <button
            onClick={requestBulkDelete}
            disabled={selectedThreadIds.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-danger bg-danger/10 rounded hover:bg-danger/20 transition-all disabled:opacity-40 disabled:hover:bg-danger/10"
          >
            <Trash2 size={14} /> Delete selected
          </button>
          <button
            onClick={leaveSelectionMode}
            className="ml-auto px-3 py-1.5 text-xs font-medium text-slate-400 dark:text-white/60 hover:text-slate-700 dark:hover:text-white transition-all"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="w-full max-w-full overflow-x-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex flex-nowrap gap-4 pb-4" style={{ width: '1800px' }}>
            {stages.map((stage) => {
              const stageThreads = threads.filter((t) => t.stage === stage.key);
              const totalItems = stageThreads.length;

              return (
                <div key={stage.key} className="flex-shrink-0 w-72 min-w-[288px] flex flex-col" style={{ height: 'calc(100vh - 180px)' }}>
                  <div className="flex items-center justify-between mb-3 px-1 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${stage.color.replace('border-', 'bg-')}`} />
                      <h3 className="text-sm font-semibold text-slate-700 dark:text-white">{stage.label}</h3>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-white/60 bg-ivory dark:bg-navy-light px-1.5 py-0.5 rounded">
                        {totalItems}
                      </span>
                    </div>
                  </div>
                  <Droppable droppableId={stage.key}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 min-h-0 overflow-y-auto rounded-xl p-3 transition-all duration-200 ${
                          snapshot.isDraggingOver
                            ? 'bg-gold/5 border-2 border-dashed border-gold/30'
                            : 'bg-ivory dark:bg-navy-light border border-border-light dark:border-white/10'
                        }`}
                      >
                        {stageThreads.map((thread, index) => (
                          <EmailThreadCard
                            key={`thread-${thread.id}`}
                            thread={thread}
                            index={index}
                            onViewDeal={openThreadDialog}
                            selectionMode={selectionMode}
                            selected={selectedThreadIds.includes(thread.id)}
                            onToggleSelect={toggleThreadSelect}
                          />
                        ))}
                        {provided.placeholder}
                        {totalItems === 0 && !snapshot.isDraggingOver && (
                          <div className="flex flex-col items-center justify-center py-8 text-slate-300 dark:text-white/20">
                            <p className="text-[11px] font-mono">
                              {stage.key === 'synced' ? 'Pull emails or create a deal' : 'Drop deals here'}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      <PullEmailsModal
        isOpen={pullModalOpen}
        onClose={() => setPullModalOpen(false)}
        onPull={handlePullEmails}
        running={!!pullStatus}
      />

      <CreateDealModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreateDeal={handleCreateDeal}
      />

      <ConfirmDeleteModal
        isOpen={!!pendingDelete}
        count={pendingDelete?.count || 0}
        isBulk={!!pendingDelete?.isBulk}
        deleting={deleteThreadsMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      {openThread && (
        <div className="absolute inset-0 z-10 bg-white dark:bg-navy animate-fadeIn">
          <ConversationDialog
            // Prefer the detail response (it carries `messages`); fall back to the
            // board's copy of the thread so the header and deal form render before
            // it arrives.
            thread={threadDetail || openThread}
            deal={openOrder}
            isOpen={true}
            messagesLoading={messagesLoading}
            onClose={closeThreadDialog}
            onSaveDeal={handleSaveDeal}
            onSaveThread={handleSaveThread}
            onDeleteThread={requestDeleteThread}
          />
        </div>
      )}
    </div>
  );
};

export default Deals;
