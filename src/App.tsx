import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  AlertCircle,
  BookOpen,
  Save,
  Image as ImageIcon,
  Eye,
  ArrowLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CategoryKey,
  CATEGORIES,
  ExpenseItem,
} from './constants';
import { safelyEvaluate, formatCurrency } from './utils/math';
import { BudgetInput } from './components/BudgetInput';
import { RecordsPanel } from './components/RecordsPanel';
import { SavePlanModal } from './components/SavePlanModal';
import {
  MonthData,
  SavedPlan,
  StorageData,
  loadStorage,
  saveStorage,
  createInitialMonthData,
  createSavedPlan,
  defaultPlanName,
  formatSavedDate,
} from './utils/storage';
import { exportElementToJpg } from './utils/exportImage';

export default function App() {
  const [storage, setStorage] = useState<StorageData>(() => ({
    currentDraft: createInitialMonthData(),
    savedPlans: [],
  }));
  const [viewingPlanId, setViewingPlanId] = useState<string | null>(null);
  const [recordsOpen, setRecordsOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const captureRef = useRef<HTMLDivElement>(null);

  // Load from LocalStorage
  useEffect(() => {
    setStorage(loadStorage());
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    saveStorage(storage);
  }, [storage]);

  const viewingPlan = useMemo<SavedPlan | null>(() => {
    if (!viewingPlanId) return null;
    return storage.savedPlans.find((p) => p.id === viewingPlanId) ?? null;
  }, [viewingPlanId, storage.savedPlans]);

  const isViewing = viewingPlan !== null;
  const data: MonthData = viewingPlan ? viewingPlan.data : storage.currentDraft;

  const updateData = (newData: MonthData) => {
    if (isViewing) return;
    setStorage((prev) => ({ ...prev, currentDraft: newData }));
  };

  const handleReset = () => {
    setStorage((prev) => ({ ...prev, currentDraft: createInitialMonthData() }));
    setViewingPlanId(null);
    setShowResetConfirm(false);
  };

  const handleSavePlan = (name: string) => {
    const sourceData = viewingPlan ? viewingPlan.data : storage.currentDraft;
    const newPlan = createSavedPlan(name, sourceData);
    setStorage((prev) => ({ ...prev, savedPlans: [...prev.savedPlans, newPlan] }));
    setSaveModalOpen(false);
  };

  const handleRenamePlan = (id: string, newName: string) => {
    setStorage((prev) => ({
      ...prev,
      savedPlans: prev.savedPlans.map((p) => (p.id === id ? { ...p, name: newName } : p)),
    }));
  };

  const handleDeletePlan = (id: string) => {
    setStorage((prev) => ({
      ...prev,
      savedPlans: prev.savedPlans.filter((p) => p.id !== id),
    }));
    if (viewingPlanId === id) setViewingPlanId(null);
  };

  const handleLoadPlanAsDraft = (id: string) => {
    const plan = storage.savedPlans.find((p) => p.id === id);
    if (!plan) return;
    setStorage((prev) => ({
      ...prev,
      currentDraft: JSON.parse(JSON.stringify(plan.data)),
    }));
    setViewingPlanId(null);
    setRecordsOpen(false);
  };

  const handleExport = async () => {
    if (!captureRef.current) return;
    setIsExporting(true);
    await new Promise((r) => setTimeout(r, 50));
    try {
      const nameSlug = viewingPlan ? viewingPlan.name : '預算規劃';
      const ts = formatSavedDate(Date.now()).replace(/\//g, '-');
      await exportElementToJpg(captureRef.current, `${nameSlug}_${ts}.jpg`);
    } catch (e) {
      console.error('Export failed', e);
      alert('匯出圖片失敗，請再試一次');
    } finally {
      setIsExporting(false);
    }
  };

  // derived calculations
  const totalIncome = safelyEvaluate(data.incomeFormula) || 0;

  const categoryBudgets = useMemo(() => {
    const budgets: Record<CategoryKey, number> = { FIXED: 0, ANNUAL: 0, SELF: 0, DREAM: 0 };
    (Object.keys(CATEGORIES) as CategoryKey[]).forEach((key) => {
      budgets[key] = (totalIncome * data.percentages[key]) / 100;
    });
    return budgets;
  }, [totalIncome, data.percentages]);

  const categorySpent = useMemo(() => {
    const spent: Record<CategoryKey, number> = { FIXED: 0, ANNUAL: 0, SELF: 0, DREAM: 0 };
    (Object.keys(CATEGORIES) as CategoryKey[]).forEach((key) => {
      spent[key] = data.expenses[key].reduce((sum, item) => sum + (safelyEvaluate(item.formula) || 0), 0);
    });
    return spent;
  }, [data.expenses]);

  const totalPercentage = (Object.values(data.percentages) as number[]).reduce((a, b) => a + b, 0);
  const totalSpent = (Object.values(categorySpent) as number[]).reduce((a, b) => a + b, 0);

  const waterLevel = totalIncome > 0
    ? Math.max(0, Math.min(100, ((totalIncome - totalSpent) / totalIncome) * 100))
    : 0;
  const remainingBudget = totalIncome - totalSpent;

  const handleAddExpense = (catKey: CategoryKey) => {
    const newItem: ExpenseItem = {
      id: Date.now().toString(),
      name: '自訂項目',
      formula: '',
      isCustom: true,
      placeholder: '預抓費用',
    };
    updateData({
      ...data,
      expenses: { ...data.expenses, [catKey]: [...data.expenses[catKey], newItem] },
    });
  };

  const handleRemoveExpense = (catKey: CategoryKey, id: string) => {
    updateData({
      ...data,
      expenses: { ...data.expenses, [catKey]: data.expenses[catKey].filter((item) => item.id !== id) },
    });
  };

  const handleUpdateExpense = (catKey: CategoryKey, id: string, field: keyof ExpenseItem, val: string) => {
    updateData({
      ...data,
      expenses: {
        ...data.expenses,
        [catKey]: data.expenses[catKey].map((item) => (item.id === id ? { ...item, [field]: val } : item)),
      },
    });
  };

  const handleUpdatePercentage = (catKey: CategoryKey, val: string) => {
    const num = parseFloat(val) || 0;
    updateData({ ...data, percentages: { ...data.percentages, [catKey]: num } });
  };

  const readOnly = isViewing;

  return (
    <div ref={captureRef} className="max-w-6xl mx-auto px-4 py-8 md:py-12 min-h-screen flex flex-col gap-8 text-main-text">

      {/* 檢視模式 Banner */}
      {isViewing && !isExporting && (
        <div className="paper-card px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap bg-white/70">
          <div className="flex items-center gap-2 font-round text-xs">
            <Eye size={14} className="opacity-70" />
            <span>
              正在查看 <span className="font-bold">「{viewingPlan?.name}」</span>
              <span className="opacity-60 ml-1">（{viewingPlan ? formatSavedDate(viewingPlan.savedAt) : ''} 儲存）</span>
              <span className="opacity-60 ml-2">· 唯讀</span>
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleLoadPlanAsDraft(viewingPlan!.id)}
              className="font-round text-xs font-bold px-3 py-1.5 rounded bg-main-text/10 hover:bg-main-text/20 transition-colors"
            >
              以此為基礎編輯
            </button>
            <button
              onClick={() => setViewingPlanId(null)}
              className="font-round text-xs px-3 py-1.5 rounded border border-dashed border-main-text/40 hover:bg-main-text/5 transition-colors flex items-center gap-1"
            >
              <ArrowLeft size={11} /> 回到編輯
            </button>
          </div>
        </div>
      )}

      {/* 標題 */}
      <header className="flex flex-col items-center gap-2 relative">
        {/* 功能按鈕列 — mobile: 上方獨立一列, md+: 絕對右上角 */}
        {!isExporting && (
          <div
            className="w-full flex justify-end flex-wrap items-center gap-1.5 md:w-auto md:absolute md:right-0 md:top-2"
            data-export-hide="true"
          >
            <button
              onClick={handleExport}
              className="header-btn"
              title="匯出成 JPG 圖片"
            >
              <ImageIcon size={10} />
              <span className="hidden sm:inline">匯出圖片</span>
            </button>
            <button
              onClick={() => setSaveModalOpen(true)}
              className="header-btn"
              title="儲存目前規劃"
            >
              <Save size={10} />
              <span className="hidden sm:inline">儲存</span>
            </button>
            <button
              onClick={() => setRecordsOpen(true)}
              className="header-btn"
              title="查看已儲存的紀錄"
            >
              <BookOpen size={10} />
              <span className="hidden sm:inline">紀錄</span>
              {storage.savedPlans.length > 0 && (
                <span className="header-btn-badge ml-0.5">
                  {storage.savedPlans.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="header-btn"
              title="重設所有內容"
            >
              <RotateCcw size={10} />
              <span className="hidden sm:inline">重設</span>
            </button>
          </div>
        )}

        <h1 className="font-handwrite text-4xl md:text-5xl font-bold text-center" style={{ color: '#6B4423' }}>
          月預算分配計算機
        </h1>
        <p className="font-round text-sm opacity-60 mt-1">我的收入水庫</p>
      </header>

      {/* 薪水水庫 + 百分比 */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* 薪水總額 - 水庫 */}
        <div className="flex-1 reservoir">
          {/* 水位 */}
          <div className="reservoir-water" style={{ height: `${waterLevel}%` }}>
            <div className="reservoir-fill" />
            <svg
              className="reservoir-wave reservoir-wave--back"
              viewBox="0 0 100 10"
              preserveAspectRatio="none"
            >
              <path
                d="M 0 5 Q 12.5 10 25 5 T 50 5 T 75 5 T 100 5 L 100 10 L 0 10 Z"
                fill="rgba(168, 200, 220, 0.6)"
              />
            </svg>
            <svg
              className="reservoir-wave"
              viewBox="0 0 100 10"
              preserveAspectRatio="none"
            >
              <path
                d="M 0 5 Q 12.5 0 25 5 T 50 5 T 75 5 T 100 5 L 100 10 L 0 10 Z"
                fill="rgba(130, 175, 205, 0.65)"
              />
            </svg>
          </div>

          {/* 內容 */}
          <div className="reservoir-content">
            <div className="flex justify-between items-start mb-3">
              <label className="font-round text-sm font-bold opacity-75 flex items-center">
                <span className="reservoir-drop" aria-hidden="true" />
                月薪總額・大水庫
              </label>
              <div className="big-number text-2xl">{formatCurrency(totalIncome)}</div>
            </div>
            <input
              type="text"
              className="income-input"
              placeholder="例如 35000 或 32000+3000"
              value={data.incomeFormula}
              readOnly={readOnly}
              onChange={(e) => updateData({ ...data, incomeFormula: e.target.value })}
            />
          </div>

          {totalIncome > 0 && (
            <div className="reservoir-gauge">
              水位 {Math.round(waterLevel)}%
              <span className="opacity-60 ml-1">
                ({remainingBudget >= 0 ? '剩' : '缺'} {formatCurrency(Math.abs(remainingBudget))})
              </span>
            </div>
          )}
        </div>

        {/* 四大分類百分比 */}
        <div className="flex-[2] grid grid-cols-2 md:grid-cols-4 gap-3">
          {(Object.keys(CATEGORIES) as CategoryKey[]).map((key) => {
            const cat = CATEGORIES[key];
            return (
              <div
                key={key}
                className="paper-card p-3 flex flex-col justify-between min-h-[100px]"
              >
                <span
                  className="font-round text-xs font-bold px-2 py-0.5 rounded-full self-start"
                  style={{ backgroundColor: cat.tagBg, color: cat.tagText }}
                >
                  {cat.name}
                </span>
                <div className="flex items-baseline gap-1 my-1">
                  <input
                    type="number"
                    value={data.percentages[key]}
                    readOnly={readOnly}
                    onChange={(e) => handleUpdatePercentage(key, e.target.value)}
                    className="w-full big-number text-2xl bg-transparent outline-none border-b border-dashed border-main-text/20 focus:border-main-text/50"
                  />
                  <span className="font-round font-bold text-main-text/60">%</span>
                </div>
                <span className="big-number text-sm text-main-text/70">
                  {formatCurrency(categoryBudgets[key])}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 百分比警告 */}
      {totalPercentage !== 100 && (
        <div className="text-warning text-center text-xs font-round font-bold flex items-center justify-center gap-1 -mt-4">
          <AlertCircle size={14} /> 比例合計 {totalPercentage}%，建議調整為 100%
        </div>
      )}

      {/* 四大支出分類 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(Object.keys(CATEGORIES) as CategoryKey[]).map((key) => {
          const cat = CATEGORIES[key];
          const remaining = categoryBudgets[key] - categorySpent[key];
          const isOver = remaining < 0;

          return (
            <div key={key} className="paper-card overflow-hidden flex flex-col">
              {/* 紙膠帶造型 Header */}
              <div
                className="tape-header px-8 py-3 flex justify-between items-center"
                style={{ backgroundColor: cat.headerBg, color: cat.headerText }}
              >
                <div className="flex items-baseline gap-2">
                  <span className="font-handwrite font-bold text-base">{cat.name}</span>
                  {key === 'ANNUAL' && (
                    <span className="text-[10px] opacity-70 font-round whitespace-nowrap">
                      (年度支出 ÷ 12)
                    </span>
                  )}
                </div>
                <span className="font-round text-xs font-medium opacity-85">
                  預算 {formatCurrency(categoryBudgets[key])}
                </span>
              </div>

              {/* 項目清單 */}
              <div className="p-4 flex-grow space-y-2 min-h-[160px]">
                {data.expenses[key].map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[auto_1fr_auto] gap-3 items-center group rounded-lg px-3 py-1.5"
                    style={{ backgroundColor: cat.rowBg }}
                  >
                    {/* 項目名稱標籤 */}
                    <div
                      className="item-tag"
                      style={{ backgroundColor: cat.tagBg, color: cat.tagText }}
                    >
                      <input
                        value={item.name}
                        readOnly={readOnly}
                        onChange={(e) => handleUpdateExpense(key, item.id, 'name', e.target.value)}
                        className="w-24 bg-transparent border-none p-0 focus:outline-none text-[12px] font-medium"
                        style={{ color: cat.tagText }}
                      />
                    </div>

                    <BudgetInput
                      value={item.formula}
                      onChange={(val) => handleUpdateExpense(key, item.id, 'formula', val)}
                      placeholder={item.placeholder ?? '預抓費用'}
                      readOnly={readOnly}
                    />

                    {item.isCustom && !readOnly ? (
                      <button
                        onClick={() => handleRemoveExpense(key, item.id)}
                        className="text-main-text/30 hover:text-overspent transition-colors p-1"
                        data-export-hide="true"
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : (
                      <div className="w-6" />
                    )}
                  </div>
                ))}

                {!readOnly && !isExporting && (
                  <div className="flex justify-center pt-3" data-export-hide="true">
                    <button
                      onClick={() => handleAddExpense(key)}
                      className="text-[11px] font-round opacity-50 border border-dashed border-main-text/40 px-5 py-1.5 rounded hover:opacity-100 hover:bg-white/40 transition-all flex items-center gap-1 font-medium"
                    >
                      <Plus size={11} /> 新增自訂項目
                    </button>
                  </div>
                )}
              </div>

              {/* Footer 小計 */}
              <div className="px-5 py-2.5 border-t border-dashed border-main-text/15 flex justify-between items-center font-round text-xs">
                <span className="opacity-50 font-medium">小計</span>
                <span className={`font-bold ${isOver ? 'text-overspent' : 'text-remaining'}`}>
                  {formatCurrency(categorySpent[key])}
                  <span className="opacity-80 font-medium ml-1">
                    ({isOver ? `超支 ${formatCurrency(Math.abs(remaining))}` : `剩餘 ${formatCurrency(remaining)}`})
                  </span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部區塊 */}
      <footer className="mt-4 pt-6 border-t border-dashed border-main-text/20 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        {/* 左側便條紙說明 */}
        <div className="max-w-md w-full">
          <div className="sticky-note overflow-hidden">
            <button
              onClick={() => setIsNoteOpen(!isNoteOpen)}
              className="w-full px-4 py-2.5 flex justify-between items-center font-round font-bold text-xs opacity-70 hover:opacity-100 transition-opacity"
            >
              <span>✿ 你的預算，你說了算</span>
              {isNoteOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <AnimatePresence>
              {isNoteOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-3 text-[11px] text-main-text/75 space-y-1.5 font-round leading-relaxed">
                    <p>• 預算不夠？先顧「固定支出」與「年度攤提」，剩下再分給後面兩項</p>
                    <p>• 項目可以自己換！點「新增自訂項目」調整成你的樣子</p>
                    <p>• 輸入框可以直接填算式，例如 <code className="bg-white/50 px-1 rounded">3000+500</code></p>
                    <p className="pt-1 text-warning font-semibold">※ 比例僅供參考，依個人狀況調整</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 右側總計 */}
        <div className="text-right flex flex-col gap-1 items-end">
          <div className="font-round text-xs font-semibold opacity-60 tracking-widest">支出合計</div>
          <div className="big-number text-4xl">{formatCurrency(totalSpent)}</div>
          <div className="font-round text-[10px] opacity-50">加總 = 水庫金額，即分配完畢</div>
          {totalSpent > totalIncome && totalIncome > 0 && (
            <div className="font-round text-[11px] text-overspent font-bold flex items-center gap-1 mt-1">
              <AlertCircle size={11} /> 總支出已超過總預算
            </div>
          )}
        </div>
      </footer>

      {/* 重設確認對話框 */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4"
            onClick={() => setShowResetConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="paper-card p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-handwrite text-lg font-bold mb-2">確定要重設嗎？</h3>
              <p className="font-round text-sm opacity-75 mb-5">
                目前編輯中的內容會被清除，恢復成初始狀態。已儲存的紀錄不會被刪除。
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="font-round text-sm px-4 py-2 opacity-70 hover:opacity-100 transition-opacity"
                >
                  取消
                </button>
                <button
                  onClick={handleReset}
                  className="font-round text-sm font-bold px-4 py-2 rounded bg-overspent text-white hover:opacity-90 transition-opacity"
                >
                  確定重設
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 紀錄側邊欄 */}
      <RecordsPanel
        open={recordsOpen}
        onClose={() => setRecordsOpen(false)}
        savedPlans={storage.savedPlans}
        viewingPlanId={viewingPlanId}
        onViewDraft={() => {
          setViewingPlanId(null);
          setRecordsOpen(false);
        }}
        onViewPlan={(id) => {
          setViewingPlanId(id);
          setRecordsOpen(false);
        }}
        onRenamePlan={handleRenamePlan}
        onDeletePlan={handleDeletePlan}
        onLoadPlanAsDraft={handleLoadPlanAsDraft}
      />

      {/* 儲存 Modal */}
      <SavePlanModal
        open={saveModalOpen}
        defaultName={defaultPlanName()}
        onCancel={() => setSaveModalOpen(false)}
        onConfirm={handleSavePlan}
      />
    </div>
  );
}
