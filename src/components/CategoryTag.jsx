import React from 'react';

// The four tags the AI can give a thread, in one place so a tag looks the same
// wherever it is shown: the pipeline cards, the thread header, and the RFQ and
// Purchase Orders tables. The values match rfq.email_categories on the backend.
const categoryStyles = {
  rfq: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  quotation: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  po: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  other: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
};

// Renders nothing when there is no tag. The RFQ and Purchase Orders pages filter
// on the thread tag, so a blank cell there means the row has no email thread
// behind it at all — a deal entered by hand rather than pulled from a thread.
const CategoryTag = ({ category, className = '' }) => {
  if (!category) return null;
  const key = String(category).toLowerCase();
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono font-semibold uppercase tracking-wider border whitespace-nowrap ${
        categoryStyles[key] || categoryStyles.other
      } ${className}`}
    >
      {key}
    </span>
  );
};

export default CategoryTag;
