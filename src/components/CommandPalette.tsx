'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, ClipboardList, LayoutDashboard, Plus, Eye, Keyboard, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CommandPaletteProps {
  onAddDeal?: () => void;
  onSearchFocus?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onAddDeal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Handle shortcut events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle palette: Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setShowShortcuts(false);
      }

      // Help shortcuts: Shift+? (e.key === '?')
      if (e.key === '?' && !isOpen && (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA')) {
        e.preventDefault();
        setShowShortcuts(true);
      }

      // Close on escape
      if (e.key === 'Escape') {
        setIsOpen(false);
        setShowShortcuts(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const commands = [
    { id: 'dash', label: 'Go to Dashboard', icon: LayoutDashboard, action: () => router.push('/dashboard') },
    { id: 'kanban', label: 'Go to Kanban Board', icon: ClipboardList, action: () => router.push('/deals?view=kanban') },
    { id: 'list', label: 'Go to Deal List', icon: ClipboardList, action: () => router.push('/deals?view=list') },
    { id: 'create_deal', label: 'Create New Deal', icon: Plus, action: () => { setIsOpen(false); onAddDeal?.(); } },
    { id: 'show_shortcuts', label: 'Show Keyboard Shortcuts', icon: Keyboard, action: () => setShowShortcuts(true) },
  ];

  const filteredCommands = commands.filter((c) =>
    c.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        setIsOpen(false);
        setSearch('');
      }
    }
  };

  if (!isOpen && !showShortcuts) {
    // Hidden triggers
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-40 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs px-3 py-2 rounded-full shadow-lg flex items-center gap-1.5 font-medium transition-all"
        title="Open Command Palette (Cmd+K)"
      >
        <Command className="h-3.5 w-3.5" />
        <span>Press <kbd className="bg-slate-800 px-1 py-0.5 rounded text-[10px]">⌘K</kbd></span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] p-4">
      {/* Keyboard Shortcuts overlay */}
      {showShortcuts ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Keyboard className="h-5 w-5 text-slate-400" />
              <span>Keyboard Shortcuts</span>
            </div>
            <button onClick={() => setShowShortcuts(false)} className="text-slate-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6 space-y-4 text-sm text-slate-300">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800/40">
              <span>Open Command Palette</span>
              <kbd className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-xs">⌘ + K</kbd>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800/40">
              <span>Focus Search in Table View</span>
              <kbd className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-xs">/</kbd>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800/40">
              <span>Navigate Rows (Table View)</span>
              <kbd className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-xs">j / k</kbd>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800/40">
              <span>Create New Deal Modal</span>
              <kbd className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-xs">n</kbd>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800/40">
              <span>Toggle Help Shortcuts</span>
              <kbd className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-xs">?</kbd>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span>Close / Exit overlays</span>
              <kbd className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-xs">ESC</kbd>
            </div>
          </div>
          <div className="p-4 bg-slate-950 text-right">
            <button
              onClick={() => setShowShortcuts(false)}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-3.5 py-1.5 rounded font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        /* Main Command Palette Dialog */
        <div
          ref={containerRef}
          className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150"
        >
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800">
            <Search className="h-5 w-5 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search actions and pages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-transparent border-0 outline-none text-white text-sm w-full placeholder:text-slate-500 focus:ring-0"
            />
            <div className="flex items-center gap-1 bg-slate-850 px-1.5 py-0.5 rounded text-[10px] text-slate-400 border border-slate-800 shrink-0 select-none">
              <span className="font-semibold">ESC</span>
            </div>
          </div>

          <div className="p-2 max-h-[300px] overflow-y-auto">
            {filteredCommands.length > 0 ? (
              filteredCommands.map((command, idx) => {
                const IconComponent = command.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={command.id}
                    onClick={() => {
                      command.action();
                      setIsOpen(false);
                      setSearch('');
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                      isSelected ? 'bg-slate-800 text-white' : 'text-slate-350 hover:bg-slate-850 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className={`h-4.5 w-4.5 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <span className="font-medium">{command.label}</span>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                        ENTER <kbd className="text-[9px] bg-slate-700/80 px-1 rounded">↵</kbd>
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-sm text-slate-500">
                No actions found matching "{search}"
              </div>
            )}
          </div>
          <div className="px-4 py-2.5 bg-slate-950/60 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500">
            <span>Use ↑↓ arrows to navigate, Enter to select</span>
            <span>Press ? for shortcut guide</span>
          </div>
        </div>
      )}
    </div>
  );
};
