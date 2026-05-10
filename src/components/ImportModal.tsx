// Modal for adding values, two tabs: Paste (newline-separated) and Library
// (categorized chips from VALUE_LIBRARY). Owns its own draft state — the
// parent only gives the set of existing-value keys (for dedupe) and a single
// onAdd callback. Closes itself on add or cancel.

import React, { useState } from 'react';
import { VALUE_LIBRARY } from '../data';

const norm = (s: string) => s.trim().toLowerCase();

export const ImportModal = ({
  open,
  onClose,
  existingValues,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  existingValues: Set<string>;
  onAdd: (names: string[]) => void;
}) => {
  const [tab, setTab] = useState<'paste' | 'library'>('paste');
  const [text, setText] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  if (!open) return null;

  const toggleLibrary = (name: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  // Dedupe within the batch and against existing values, in one pass.
  const preview = (() => {
    const incoming = [
      ...text.split('\n').map(l => l.trim()).filter(Boolean),
      ...Array.from(selected),
    ];
    const seen = new Set(existingValues);
    const added: string[] = [];
    let skipped = 0;
    for (const raw of incoming) {
      const k = norm(raw);
      if (!k) continue;
      if (seen.has(k)) {
        skipped++;
        continue;
      }
      seen.add(k);
      added.push(raw.trim());
    }
    return { added, skipped };
  })();

  const reset = () => {
    setText('');
    setSelected(new Set());
  };

  const handleAdd = () => {
    if (preview.added.length > 0) onAdd(preview.added);
    reset();
    onClose();
  };

  const handleCancel = () => {
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-white border border-gray-200 p-8 shadow-2xl">
        <div className="flex items-baseline gap-6 mb-6 border-b border-gray-100 pb-3">
          <h2 className="text-xl font-serif">Add values</h2>
          <div className="flex gap-4 text-[10px] uppercase tracking-[0.25em]">
            <button
              onClick={() => setTab('paste')}
              className={tab === 'paste' ? 'text-black' : 'text-pink-400 hover:text-pink-600'}
            >
              Paste
            </button>
            <button
              onClick={() => setTab('library')}
              className={tab === 'library' ? 'text-black' : 'text-pink-400 hover:text-pink-600'}
            >
              Library
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          {tab === 'paste' ? (
            <textarea
              className="w-full h-64 p-4 border border-gray-100 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-sky-200"
              placeholder="Integrity&#10;Autonomy&#10;Community..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          ) : (
            <div className="space-y-8">
              {VALUE_LIBRARY.map(cat => (
                <section key={cat.name}>
                  <h3 className="font-serif italic text-lg mb-1">{cat.name}</h3>
                  <p className="text-[11px] text-pink-700 mb-3">{cat.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.values.map(v => {
                      const exists = existingValues.has(norm(v));
                      const sel = selected.has(v);
                      return (
                        <button
                          key={v}
                          onClick={() => !exists && toggleLibrary(v)}
                          disabled={exists}
                          title={exists ? 'Already in your list' : undefined}
                          className={`text-[12px] px-2.5 py-1 border rounded-full transition-colors ${
                            exists
                              ? 'border-gray-100 text-pink-300 line-through cursor-not-allowed'
                              : sel
                                ? 'border-sky-300 text-black-700 bg-sky-50'
                                : 'border-gray-200 text-pink-600 hover:border-sky-200 hover:text-black-500'
                          }`}
                        >
                          {v}
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center gap-4 pt-5 mt-4 border-t border-gray-100">
          <span className="text-[11px] text-pink-700">
            {preview.added.length > 0 && <>{preview.added.length} to add</>}
            {preview.skipped > 0 && (
              <span className="text-pink-700">
                {preview.added.length > 0 ? ' · ' : ''}
                {preview.skipped} duplicate{preview.skipped === 1 ? '' : 's'} skipped
              </span>
            )}
          </span>
          <div className="flex gap-4">
            <button onClick={handleCancel} className="text-pink-400 hover:text-pink-600">Cancel</button>
            <button
              onClick={handleAdd}
              disabled={preview.added.length === 0}
              className="bg-pink-400 text-white px-6 py-2 hover:bg-sky-700 transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
