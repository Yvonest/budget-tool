import { CategoryKey, ExpenseItem, PRESET_ITEMS } from '../constants';

export interface MonthData {
  incomeFormula: string;
  percentages: Record<CategoryKey, number>;
  expenses: Record<CategoryKey, ExpenseItem[]>;
}

export interface SavedPlan {
  id: string;
  name: string;
  savedAt: number;
  data: MonthData;
}

export interface StorageData {
  currentDraft: MonthData;
  savedPlans: SavedPlan[];
}

export const STORAGE_KEY = 'budget_tool_data';

export const DEFAULT_PERCENTAGES: Record<CategoryKey, number> = {
  FIXED: 50,
  ANNUAL: 30,
  SELF: 10,
  DREAM: 10,
};

const genId = () => Math.random().toString(36).slice(2, 11);

export const createInitialMonthData = (): MonthData => {
  const makeItem = (p: { name: string; tooltip?: string; placeholder?: string }): ExpenseItem => ({
    id: genId(),
    name: p.name,
    formula: '',
    isCustom: false,
    tooltip: p.tooltip,
    placeholder: p.placeholder,
  });
  return {
    incomeFormula: '',
    percentages: { ...DEFAULT_PERCENTAGES },
    expenses: {
      FIXED: PRESET_ITEMS.FIXED.map(makeItem),
      ANNUAL: PRESET_ITEMS.ANNUAL.map(makeItem),
      SELF: PRESET_ITEMS.SELF.map(makeItem),
      DREAM: PRESET_ITEMS.DREAM.map(makeItem),
    },
  };
};

export const loadStorage = (): StorageData => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { currentDraft: createInitialMonthData(), savedPlans: [] };
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && 'currentDraft' in parsed && 'savedPlans' in parsed) {
      return parsed as StorageData;
    }
    if (parsed && typeof parsed === 'object' && parsed.default) {
      return { currentDraft: parsed.default as MonthData, savedPlans: [] };
    }
  } catch (e) {
    console.error('Failed to parse saved data', e);
  }
  return { currentDraft: createInitialMonthData(), savedPlans: [] };
};

export const saveStorage = (data: StorageData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const formatSavedDate = (ts: number) => {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
};

export const defaultPlanName = () => formatSavedDate(Date.now());

export const createSavedPlan = (name: string, data: MonthData): SavedPlan => ({
  id: genId(),
  name: name.trim() || defaultPlanName(),
  savedAt: Date.now(),
  data: JSON.parse(JSON.stringify(data)),
});
