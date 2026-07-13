'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { KanbanBoard } from '@/components/KanbanBoard';
import { useToast } from '@/components/ui/Toast';
import { 
  Search, SlidersHorizontal, Plus, Download, Grid, List, 
  Trash2, ArrowUpDown, ChevronLeft, ChevronRight, X, Loader2, Printer 
} from 'lucide-react';

interface Deal {
  id: string;
  title: string;
  value: number;
  stage: string;
  probability: number;
  expectedCloseDate: Date | string | null;
  company?: { id: string; name: string } | null;
  contact?: { id: string; name: string } | null;
  owner: { name: string };
}

interface LookupItem {
  id: string;
  name: string;
}

interface FilterParams {
  view: string;
  q: string;
  stage: string;
  minVal: string;
  maxVal: string;
  sortBy: string;
  sortOrder: string;
  pageSize: number;
}

interface DealsClientProps {
  initialDeals: Deal[];
  nextCursor: string | null;
  companies: LookupItem[];
  contacts: LookupItem[];
  userRole: string;
  currentFilters: FilterParams;
}

export const DealsClient: React.FC<DealsClientProps> = ({
  initialDeals,
  nextCursor,
  companies,
  contacts,
  userRole,
  currentFilters,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { addToast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Local state for filters to handle debounced search inputs
  const [searchVal, setSearchVal] = useState(currentFilters.q);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [bulkStage, setBulkStage] = useState('');
  
  // Keyset page navigation stack
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);

  // Deal creation form state
  const [newDeal, setNewDeal] = useState({
    title: '',
    value: 0,
    stage: 'LEAD',
    probability: 20,
    expectedCloseDate: '',
    companyId: '',
    contactId: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Helper to compile search params and update route
  const updateRoute = useCallback((params: Partial<FilterParams> & { cursor?: string | null }) => {
    const nextParams = new URLSearchParams();
    
    // Merge filters
    const merged = { ...currentFilters, ...params };
    
    nextParams.set('view', merged.view);
    if (merged.q) nextParams.set('q', merged.q);
    if (merged.stage) nextParams.set('stage', merged.stage);
    if (merged.minVal) nextParams.set('minVal', merged.minVal);
    if (merged.maxVal) nextParams.set('maxVal', merged.maxVal);
    nextParams.set('sortBy', merged.sortBy);
    nextParams.set('sortOrder', merged.sortOrder);
    nextParams.set('pageSize', merged.pageSize.toString());
    
    if (params.cursor) {
      nextParams.set('cursor', params.cursor);
    } else if (params.cursor === null) {
      // Explicitly clearing cursor
      nextParams.delete('cursor');
    }

    startTransition(() => {
      router.push(`${pathname}?${nextParams.toString()}`);
    });
  }, [currentFilters, pathname, router]);

  // Debounce search filter input (~300ms)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchVal !== currentFilters.q) {
        setCursorHistory([]); // Reset page history on new search queries
        updateRoute({ q: searchVal, cursor: null });
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchVal, currentFilters.q, updateRoute]);

  // Clear all filters action
  const handleResetFilters = () => {
    setSearchVal('');
    setCursorHistory([]);
    updateRoute({
      q: '',
      stage: '',
      minVal: '',
      maxVal: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      cursor: null,
    });
  };

  // Cursor Pagination Handlers
  const handleNextPage = () => {
    if (!nextCursor) return;
    setCursorHistory((prev) => [...prev, nextCursor]);
    updateRoute({ cursor: nextCursor });
  };

  const handlePrevPage = () => {
    if (cursorHistory.length === 0) return;
    const nextHistory = [...cursorHistory];
    nextHistory.pop(); // Remove current cursor
    const previousCursor = nextHistory[nextHistory.length - 1] || null;
    
    setCursorHistory(nextHistory);
    updateRoute({ cursor: previousCursor });
  };

  // Row selection handlers
  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === initialDeals.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(initialDeals.map((d) => d.id));
    }
  };

  // Bulk actions handlers
  const handleBulkStageChange = async () => {
    if (!bulkStage || selectedIds.length === 0) return;
    
    try {
      const res = await fetch('/api/deals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, stage: bulkStage }),
      });

      if (!res.ok) throw new Error();
      
      addToast({
        type: 'success',
        title: 'Bulk Update Completed',
        description: `Moved ${selectedIds.length} deals to ${bulkStage}.`,
      });
      setSelectedIds([]);
      setBulkStage('');
      router.refresh();
    } catch {
      addToast({
        type: 'error',
        title: 'Bulk Update Failed',
        description: 'Could not modify select rows.',
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} deals?`)) return;

    try {
      const res = await fetch('/api/deals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, action: 'DELETE' }),
      });

      if (!res.ok) throw new Error();

      addToast({
        type: 'success',
        title: 'Bulk Delete Completed',
        description: `Soft-deleted ${selectedIds.length} deals.`,
      });
      setSelectedIds([]);
      router.refresh();
    } catch {
      addToast({
        type: 'error',
        title: 'Bulk Delete Failed',
        description: 'Could not delete select rows.',
      });
    }
  };

  // Create Deal submit handler
  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSubmitting(true);

    // Form field formatting
    const payload = {
      ...newDeal,
      value: parseFloat(newDeal.value.toString()) || 0,
      probability: parseInt(newDeal.probability.toString(), 10) || 0,
      expectedCloseDate: newDeal.expectedCloseDate ? new Date(newDeal.expectedCloseDate).toISOString() : '',
    };

    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create deal.');

      addToast({
        type: 'success',
        title: 'Deal Created',
        description: `Successfully created "${payload.title}".`,
      });

      // Clear form
      setNewDeal({
        title: '',
        value: 0,
        stage: 'LEAD',
        probability: 20,
        expectedCloseDate: '',
        companyId: '',
        contactId: '',
      });
      setIsCreateModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // CSV Export URL compiler
  const getExportUrl = () => {
    const params = new URLSearchParams();
    params.set('format', 'csv');
    if (currentFilters.q) params.set('q', currentFilters.q);
    if (currentFilters.stage) params.set('stage', currentFilters.stage);
    if (currentFilters.minVal) params.set('minVal', currentFilters.minVal);
    if (currentFilters.maxVal) params.set('maxVal', currentFilters.maxVal);
    return `/api/deals/export?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* 1. Deals Dashboard header operations */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-900 pb-5 no-print">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Deals Pipeline Workspace</h1>
          <p className="text-xs text-slate-400 mt-1">Manage, sort, and drag-and-drop items in your sales pipeline.</p>
        </div>

        {/* View Toggle and Create Deal */}
        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
          
          {/* View Toggles */}
          <div className="flex bg-slate-950 p-1 border border-slate-850 rounded-lg">
            <button
              onClick={() => updateRoute({ view: 'kanban' })}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                currentFilters.view === 'kanban' ? 'bg-slate-850 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Grid className="h-3.5 w-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => updateRoute({ view: 'list' })}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                currentFilters.view === 'list' ? 'bg-slate-850 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>List View</span>
            </button>
          </div>

          {/* Add Deal Button */}
          {userRole !== 'VIEWER' && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-3.5 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-500/10 cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Add Deal</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-850 rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between no-print">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Field */}
          <div className="relative flex-1 min-w-[200px] max-w-[320px]">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search deals, companies..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

          {/* Stage Dropdown */}
          <select
            value={currentFilters.stage}
            onChange={(e) => updateRoute({ stage: e.target.value, cursor: null })}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-350 focus:outline-none focus:border-emerald-500/50 font-medium"
          >
            <option value="">All Stages</option>
            <option value="LEAD">Lead</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="PROPOSAL">Proposal</option>
            <option value="NEGOTIATION">Negotiation</option>
            <option value="WON">Won</option>
            <option value="LOST">Lost</option>
          </select>

          {/* Min / Max filters */}
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              placeholder="Min Val"
              value={currentFilters.minVal}
              onChange={(e) => updateRoute({ minVal: e.target.value, cursor: null })}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white w-20 placeholder:text-slate-600 focus:outline-none"
            />
            <span className="text-slate-600 text-xs">-</span>
            <input
              type="number"
              placeholder="Max Val"
              value={currentFilters.maxVal}
              onChange={(e) => updateRoute({ maxVal: e.target.value, cursor: null })}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white w-20 placeholder:text-slate-600 focus:outline-none"
            />
          </div>

          {/* Active loader or reset indicator */}
          {(currentFilters.q || currentFilters.stage || currentFilters.minVal || currentFilters.maxVal) && (
            <button
              onClick={handleResetFilters}
              className="text-slate-500 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear</span>
            </button>
          )}

          {isPending && <Loader2 className="h-4.5 w-4.5 text-emerald-400 animate-spin shrink-0 ml-2" />}
        </div>

        {/* CSV and PDF Export panel */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-350 hover:text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Print PDF Report"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Report</span>
          </button>
          
          <a
            href={getExportUrl()}
            className="bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-350 hover:text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download CSV"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* 3. Main Workspace Display Area */}
      {currentFilters.view === 'kanban' ? (
        // Kanban view (no print)
        <div className="no-print">
          <KanbanBoard initialDeals={initialDeals} userRole={userRole} />
        </div>
      ) : (
        // List View Table (Print support)
        <div className="space-y-4">
          
          {/* Bulk actions bar (no-print) */}
          {selectedIds.length > 0 && userRole !== 'VIEWER' && (
            <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 animate-in slide-in-from-top-1 fade-in duration-200 no-print">
              <span className="text-xs text-emerald-400 font-semibold">
                {selectedIds.length} deals selected
              </span>
              <div className="flex items-center gap-3 text-xs">
                {/* Bulk Stage */}
                <select
                  value={bulkStage}
                  onChange={(e) => setBulkStage(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                >
                  <option value="">Move selected to...</option>
                  <option value="LEAD">Lead</option>
                  <option value="QUALIFIED">Qualified</option>
                  <option value="PROPOSAL">Proposal</option>
                  <option value="NEGOTIATION">Negotiation</option>
                  <option value="WON">Won</option>
                  <option value="LOST">Lost</option>
                </select>
                <button
                  onClick={handleBulkStageChange}
                  disabled={!bulkStage}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 text-white font-bold px-3.5 py-1.5 rounded transition-colors cursor-pointer"
                >
                  Apply
                </button>
                <span className="text-slate-800">|</span>
                <button
                  onClick={handleBulkDelete}
                  className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Selected</span>
                </button>
              </div>
            </div>
          )}

          {/* Core Table */}
          <div className="bg-slate-950 border border-slate-900 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-850 text-[10px] text-slate-400 uppercase tracking-widest font-semibold font-mono">
                    <th className="p-4 w-12 no-print">
                      <input
                        type="checkbox"
                        checked={initialDeals.length > 0 && selectedIds.length === initialDeals.length}
                        onChange={handleSelectAll}
                        className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500/50"
                      />
                    </th>
                    <th className="p-4">
                      <button
                        onClick={() => updateRoute({ sortBy: 'title', sortOrder: currentFilters.sortOrder === 'asc' ? 'desc' : 'asc' })}
                        className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                      >
                        <span>Deal Title</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="p-4">Company</th>
                    <th className="p-4">
                      <button
                        onClick={() => updateRoute({ sortBy: 'value', sortOrder: currentFilters.sortOrder === 'asc' ? 'desc' : 'asc' })}
                        className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                      >
                        <span>Value</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="p-4">Stage</th>
                    <th className="p-4">Win Probability</th>
                    <th className="p-4">
                      <button
                        onClick={() => updateRoute({ sortBy: 'expectedCloseDate', sortOrder: currentFilters.sortOrder === 'asc' ? 'desc' : 'asc' })}
                        className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                      >
                        <span>Expected Close</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="p-4">Owner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-sm text-slate-300">
                  {initialDeals.length > 0 ? (
                    initialDeals.map((deal) => {
                      const isSelected = selectedIds.includes(deal.id);
                      return (
                        <tr
                          key={deal.id}
                          className={`hover:bg-slate-900/40 transition-colors ${
                            isSelected ? 'bg-emerald-950/5' : ''
                          }`}
                        >
                          <td className="p-4 no-print">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectRow(deal.id)}
                              className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500/50"
                            />
                          </td>
                          <td className="p-4 font-semibold text-white truncate max-w-[200px]">
                            {deal.title}
                          </td>
                          <td className="p-4 text-slate-400">
                            {deal.company?.name || 'Individual'}
                          </td>
                          <td className="p-4 font-mono font-bold text-white">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(deal.value)}
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold border bg-slate-900 border-slate-800">
                              {deal.stage}
                            </span>
                          </td>
                          <td className="p-4 font-mono font-medium">{deal.probability}%</td>
                          <td className="p-4 text-slate-400">
                            {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="p-4 text-xs font-medium text-slate-400">
                            {deal.owner.name}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500 font-medium select-none">
                        No deals match the specified filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* keyset page indicators (no print) */}
          <div className="flex justify-between items-center text-xs text-slate-450 pt-2 no-print">
            <span>Showing current page size: {currentFilters.pageSize} items</span>
            <div className="flex items-center gap-3">
              <button
                disabled={cursorHistory.length === 0}
                onClick={handlePrevPage}
                className="p-2 border border-slate-850 hover:bg-slate-900 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer font-semibold"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Prev Page</span>
              </button>
              <button
                disabled={!nextCursor}
                onClick={handleNextPage}
                className="p-2 border border-slate-850 hover:bg-slate-900 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer font-semibold"
              >
                <span>Next Page</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Create New Deal Modal Dialog (no print) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-850 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Create New Deal</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-500 hover:text-white p-0.5">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateDeal} className="p-5 space-y-4 text-xs font-semibold text-slate-400">
              
              {/* Title */}
              <div className="space-y-1">
                <label htmlFor="title">Deal Title *</label>
                <input
                  id="title"
                  type="text"
                  required
                  value={newDeal.title}
                  onChange={(e) => setNewDeal((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white outline-none focus:border-emerald-500"
                  placeholder="e.g. Stripe Renewal License"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Value */}
                <div className="space-y-1">
                  <label htmlFor="value">Value (USD) *</label>
                  <input
                    id="value"
                    type="number"
                    required
                    min={0}
                    value={newDeal.value}
                    onChange={(e) => setNewDeal((prev) => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white outline-none focus:border-emerald-500 font-mono font-bold"
                  />
                </div>

                {/* Probability */}
                <div className="space-y-1">
                  <label htmlFor="prob">Probability (%) *</label>
                  <input
                    id="prob"
                    type="number"
                    required
                    min={0}
                    max={100}
                    value={newDeal.probability}
                    onChange={(e) => setNewDeal((prev) => ({ ...prev, probability: parseInt(e.target.value, 10) || 0 }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Stage */}
                <div className="space-y-1">
                  <label htmlFor="stage">Stage *</label>
                  <select
                    id="stage"
                    value={newDeal.stage}
                    onChange={(e) => setNewDeal((prev) => ({ ...prev, stage: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:outline-none"
                  >
                    <option value="LEAD">Lead</option>
                    <option value="QUALIFIED">Qualified</option>
                    <option value="PROPOSAL">Proposal</option>
                    <option value="NEGOTIATION">Negotiation</option>
                    <option value="WON">Won</option>
                    <option value="LOST">Lost</option>
                  </select>
                </div>

                {/* Expected Close Date */}
                <div className="space-y-1">
                  <label htmlFor="closeDate">Close Date</label>
                  <input
                    id="closeDate"
                    type="date"
                    value={newDeal.expectedCloseDate}
                    onChange={(e) => setNewDeal((prev) => ({ ...prev, expectedCloseDate: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Company lookup */}
              <div className="space-y-1">
                <label htmlFor="company">Company Account</label>
                <select
                  id="company"
                  value={newDeal.companyId}
                  onChange={(e) => setNewDeal((prev) => ({ ...prev, companyId: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:outline-none"
                >
                  <option value="">No Company Linked</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Contact lookup */}
              <div className="space-y-1">
                <label htmlFor="contact">Primary Contact</label>
                <select
                  id="contact"
                  value={newDeal.contactId}
                  onChange={(e) => setNewDeal((prev) => ({ ...prev, contactId: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:outline-none"
                >
                  <option value="">No Contact Linked</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Form Errors */}
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded text-xs font-semibold">
                  {formError}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 text-slate-950 font-bold px-5 py-2 rounded transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {formSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
