'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from './ui/Toast';
import { ArrowRight, ChevronRight, DollarSign, Calendar, RefreshCw, MoreVertical, Trash2 } from 'lucide-react';

interface Deal {
  id: string;
  title: string;
  value: number;
  stage: string;
  probability: number;
  expectedCloseDate: Date | string | null;
  company?: { name: string } | null;
  contact?: { name: string } | null;
  owner: { name: string };
}

interface KanbanBoardProps {
  initialDeals: Deal[];
  userRole: string;
}

const STAGES = [
  { id: 'LEAD', label: 'Lead', color: 'border-t-indigo-500 bg-indigo-500/5' },
  { id: 'QUALIFIED', label: 'Qualified', color: 'border-t-cyan-500 bg-cyan-500/5' },
  { id: 'PROPOSAL', label: 'Proposal', color: 'border-t-blue-500 bg-blue-500/5' },
  { id: 'NEGOTIATION', label: 'Negotiation', color: 'border-t-purple-500 bg-purple-500/5' },
  { id: 'WON', label: 'Won', color: 'border-t-emerald-500 bg-emerald-500/5' },
  { id: 'LOST', label: 'Lost', color: 'border-t-rose-500 bg-rose-500/5' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ initialDeals, userRole }) => {
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [updatingIds, setUpdatingIds] = useState<string[]>([]);
  const { addToast } = useToast();

  useEffect(() => {
    setDeals(initialDeals);
  }, [initialDeals]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    if (userRole === 'VIEWER') {
      e.preventDefault();
      return;
    }
    setDraggingId(dealId);
    e.dataTransfer.setData('text/plain', dealId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('text/plain') || draggingId;
    if (!dealId) return;

    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage === targetStage) {
      setDraggingId(null);
      return;
    }

    await moveDealStage(dealId, deal.stage, targetStage);
    setDraggingId(null);
  };

  // Move deal and handle optimistic UI with rollback
  const moveDealStage = async (dealId: string, fromStage: string, toStage: string) => {
    // 1. Optimistic Update in UI
    setDeals((prevDeals) =>
      prevDeals.map((d) => (d.id === dealId ? { ...d, stage: toStage } : d))
    );
    setUpdatingIds((prev) => [...prev, dealId]);

    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: toStage }),
      });

      if (!response.ok) {
        throw new Error('Failed to update stage');
      }

      const resData = await response.json();
      if (!resData.success) {
        throw new Error(resData.error || 'Failed to update stage');
      }

      // Re-sync with actual response (which returns refreshed deal details)
      setDeals((prevDeals) =>
        prevDeals.map((d) => (d.id === dealId ? resData.deal : d))
      );

      addToast({
        type: 'success',
        title: 'Deal Updated',
        description: `Successfully moved stage to ${toStage}.`,
        undoAction: () => moveDealStage(dealId, toStage, fromStage), // Support Undo!
      });
    } catch (err: any) {
      // 2. Rollback on Failure
      setDeals((prevDeals) =>
        prevDeals.map((d) => (d.id === dealId ? { ...d, stage: fromStage } : d))
      );
      addToast({
        type: 'error',
        title: 'Update Failed',
        description: err.message || 'Could not save change to server. Rollback complete.',
      });
    } finally {
      setUpdatingIds((prev) => prev.filter((id) => id !== dealId));
    }
  };

  // Delete handler
  const handleDeleteDeal = async (dealId: string) => {
    if (confirm('Are you sure you want to delete this deal?')) {
      const previousDeals = [...deals];
      setDeals((prev) => prev.filter((d) => d.id !== dealId));

      try {
        const response = await fetch(`/api/deals/${dealId}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error();
        addToast({
          type: 'success',
          title: 'Deal Deleted',
          description: 'The deal has been soft-deleted.',
        });
      } catch {
        setDeals(previousDeals);
        addToast({
          type: 'error',
          title: 'Delete Failed',
          description: 'Could not delete deal. Rollback complete.',
        });
      }
    }
  };

  // Get aggregated values by column
  const getStageAggregates = (stageId: string) => {
    const stageDeals = deals.filter((d) => d.stage === stageId);
    const count = stageDeals.length;
    const value = stageDeals.reduce((sum, d) => sum + d.value, 0);
    return { count, value };
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 select-none min-h-[500px]">
      {STAGES.map((stage) => {
        const stageDeals = deals.filter((d) => d.stage === stage.id);
        const { count, value } = getStageAggregates(stage.id);

        return (
          <div
            key={stage.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.id)}
            className="flex-1 min-w-[280px] max-w-[320px] flex flex-col bg-slate-950 border border-slate-900 rounded-xl max-h-[80vh] overflow-hidden"
          >
            {/* Column Header */}
            <div className={`p-4 border-t-2 ${stage.color} border-b border-slate-900 flex justify-between items-center shrink-0`}>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">{stage.label}</span>
                <span className="text-[10px] text-slate-400 font-medium font-mono mt-0.5">
                  {formatCurrency(value)}
                </span>
              </div>
              <span className="bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[10px] px-2 py-0.5 rounded-full font-semibold">
                {count}
              </span>
            </div>

            {/* Column Cards */}
            <div className="p-2 space-y-2 overflow-y-auto flex-1 custom-scrollbar">
              {stageDeals.length > 0 ? (
                stageDeals.map((deal) => {
                  const isUpdating = updatingIds.includes(deal.id);
                  return (
                    <div
                      key={deal.id}
                      draggable={userRole !== 'VIEWER'}
                      onDragStart={(e) => handleDragStart(e, deal.id)}
                      className={`p-3.5 bg-slate-900 border border-slate-850 hover:border-slate-700/80 rounded-lg shadow-sm cursor-grab active:cursor-grabbing transition-all hover:-translate-y-0.5 ${
                        isUpdating ? 'opacity-50 pointer-events-none' : ''
                      } relative group`}
                    >
                      {/* Top Meta info */}
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-semibold text-slate-100 group-hover:text-emerald-400 transition-colors line-clamp-2">
                          {deal.title}
                        </span>
                        {userRole !== 'VIEWER' && (
                          <button
                            onClick={() => handleDeleteDeal(deal.id)}
                            className="text-slate-500 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                            title="Delete Deal"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Company name */}
                      <p className="text-[11px] text-slate-400 font-medium mt-1">
                        {deal.company?.name || 'Individual Deal'}
                      </p>

                      {/* Value and Probability */}
                      <div className="flex items-center justify-between mt-3.5 pt-2.5 border-t border-slate-850/60 text-xs">
                        <span className="font-bold text-white font-mono">
                          {formatCurrency(deal.value)}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="bg-slate-850 text-slate-400 px-1.5 py-0.5 rounded text-[10px] font-semibold font-mono border border-slate-800">
                            {deal.probability}%
                          </span>
                        </div>
                      </div>

                      {/* Footer: Date & Owner */}
                      <div className="flex items-center justify-between mt-2.5 text-[9px] text-slate-500 font-semibold uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-2.5 w-2.5 text-slate-600" />
                          {deal.expectedCloseDate
                            ? new Date(deal.expectedCloseDate).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'No close date'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium lowercase">
                          @{deal.owner.name.split(' ')[0]}
                        </span>
                      </div>

                      {/* Save Status Spinner Overlay */}
                      {isUpdating && (
                        <div className="absolute inset-0 bg-slate-950/40 rounded-lg flex items-center justify-center">
                          <RefreshCw className="h-5 w-5 text-emerald-400 animate-spin" />
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-6 border border-dashed border-slate-850 rounded-lg text-center text-xs text-slate-500 select-none">
                  No deals in this stage
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
