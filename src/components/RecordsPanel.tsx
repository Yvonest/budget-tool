import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Eye, Pencil, Trash2, FileText, Check } from 'lucide-react';
import { SavedPlan, formatSavedDate } from '../utils/storage';

interface Props {
  open: boolean;
  onClose: () => void;
  savedPlans: SavedPlan[];
  viewingPlanId: string | null;
  onViewDraft: () => void;
  onViewPlan: (id: string) => void;
  onRenamePlan: (id: string, newName: string) => void;
  onDeletePlan: (id: string) => void;
  onLoadPlanAsDraft: (id: string) => void;
}

export function RecordsPanel({
  open,
  onClose,
  savedPlans,
  viewingPlanId,
  onViewDraft,
  onViewPlan,
  onRenamePlan,
  onDeletePlan,
  onLoadPlanAsDraft,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const startRename = (p: SavedPlan) => {
    setEditingId(p.id);
    setEditName(p.name);
    setConfirmDeleteId(null);
  };

  const commitRename = () => {
    if (editingId) {
      const trimmed = editName.trim();
      if (trimmed) onRenamePlan(editingId, trimmed);
    }
    setEditingId(null);
  };

  const sortedPlans = [...savedPlans].sort((a, b) => b.savedAt - a.savedAt);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[380px] z-50 bg-page-bg border-l border-main-text/15 shadow-xl flex flex-col"
            style={{ backgroundColor: '#FBF8F0' }}
          >
            <div className="px-5 py-4 border-b border-dashed border-main-text/20 flex justify-between items-center">
              <div>
                <h2 className="font-handwrite text-lg font-bold">紀錄</h2>
                <p className="font-round text-[11px] opacity-60 mt-0.5">已儲存的規劃列表</p>
              </div>
              <button
                onClick={onClose}
                className="opacity-60 hover:opacity-100 transition-opacity p-1"
                aria-label="關閉"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* 目前編輯中 */}
              <button
                onClick={onViewDraft}
                className={`w-full text-left paper-card p-3 transition-all ${
                  viewingPlanId === null ? 'ring-2 ring-main-text/40' : 'hover:bg-white'
                }`}
              >
                <div className="flex items-start gap-2">
                  <FileText size={14} className="mt-0.5 opacity-60 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-round text-sm font-bold">目前編輯中</div>
                    <div className="font-round text-[11px] opacity-60 mt-0.5">還沒命名的草稿</div>
                  </div>
                  {viewingPlanId === null && (
                    <span className="text-[10px] font-round font-bold px-2 py-0.5 rounded-full bg-main-text/10">
                      檢視中
                    </span>
                  )}
                </div>
              </button>

              {sortedPlans.length === 0 && (
                <div className="text-center py-8 font-round text-xs opacity-50">
                  還沒有儲存的規劃<br />
                  按「儲存」就能把目前畫面存下來
                </div>
              )}

              {sortedPlans.map((plan) => {
                const isViewing = viewingPlanId === plan.id;
                const isEditing = editingId === plan.id;
                const isConfirmingDelete = confirmDeleteId === plan.id;

                return (
                  <div
                    key={plan.id}
                    className={`paper-card p-3 transition-all ${
                      isViewing ? 'ring-2 ring-main-text/40' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <FileText size={14} className="mt-0.5 opacity-60 shrink-0" />
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <input
                            autoFocus
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onBlur={commitRename}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitRename();
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            className="w-full font-round text-sm font-bold px-2 py-1 rounded border border-dashed border-main-text/40 focus:border-main-text focus:border-solid outline-none bg-white"
                          />
                        ) : (
                          <button
                            onClick={() => onViewPlan(plan.id)}
                            className="font-round text-sm font-bold text-left block w-full truncate"
                          >
                            {plan.name}
                          </button>
                        )}
                        <div className="font-round text-[11px] opacity-60 mt-0.5">
                          {formatSavedDate(plan.savedAt)} 儲存
                        </div>
                      </div>
                      {isViewing && !isEditing && (
                        <span className="text-[10px] font-round font-bold px-2 py-0.5 rounded-full bg-main-text/10">
                          檢視中
                        </span>
                      )}
                    </div>

                    {isConfirmingDelete ? (
                      <div className="mt-3 pt-3 border-t border-dashed border-main-text/15 flex items-center justify-between gap-2">
                        <span className="font-round text-[11px] opacity-70">確定刪除？</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="font-round text-[11px] px-2 py-1 opacity-60 hover:opacity-100"
                          >
                            取消
                          </button>
                          <button
                            onClick={() => {
                              onDeletePlan(plan.id);
                              setConfirmDeleteId(null);
                            }}
                            className="font-round text-[11px] font-bold px-2 py-1 rounded bg-overspent text-white"
                          >
                            刪除
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 pt-3 border-t border-dashed border-main-text/15 flex gap-1 flex-wrap">
                        <button
                          onClick={() => onViewPlan(plan.id)}
                          className="flex items-center gap-1 font-round text-[11px] px-2 py-1 rounded hover:bg-main-text/5 opacity-70 hover:opacity-100"
                          title="切換過去看"
                        >
                          <Eye size={11} /> 查看
                        </button>
                        <button
                          onClick={() => onLoadPlanAsDraft(plan.id)}
                          className="flex items-center gap-1 font-round text-[11px] px-2 py-1 rounded hover:bg-main-text/5 opacity-70 hover:opacity-100"
                          title="以這個為基礎繼續編輯"
                        >
                          <Check size={11} /> 以此編輯
                        </button>
                        <button
                          onClick={() => startRename(plan)}
                          className="flex items-center gap-1 font-round text-[11px] px-2 py-1 rounded hover:bg-main-text/5 opacity-70 hover:opacity-100"
                          title="重新命名"
                        >
                          <Pencil size={11} /> 改名
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(plan.id)}
                          className="flex items-center gap-1 font-round text-[11px] px-2 py-1 rounded hover:bg-overspent/10 opacity-70 hover:opacity-100 ml-auto text-overspent"
                          title="刪除"
                        >
                          <Trash2 size={11} /> 刪除
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
