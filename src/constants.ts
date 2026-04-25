export interface ExpenseItem {
  id: string;
  name: string;
  formula: string;
  isCustom: boolean;
  tooltip?: string;
  placeholder?: string;
}

export type CategoryKey = 'FIXED' | 'ANNUAL' | 'SELF' | 'DREAM';

export interface CategoryInfo {
  id: CategoryKey;
  name: string;
  headerBg: string;
  headerText: string;
  tagBg: string;
  tagText: string;
  rowBg: string;
}

export const CATEGORIES: Record<CategoryKey, CategoryInfo> = {
  FIXED: {
    id: 'FIXED',
    name: '固定支出',
    headerBg: '#D3E7B6',
    headerText: '#173404',
    tagBg: '#EAF8F3',
    tagText: '#04342C',
    rowBg: '#EDF5E2',
  },
  ANNUAL: {
    id: 'ANNUAL',
    name: '年度攤提',
    headerBg: '#BCEADB',
    headerText: '#04342C',
    tagBg: '#EAF8F3',
    tagText: '#04342C',
    rowBg: '#E4F7F1',
  },
  SELF: {
    id: 'SELF',
    name: '自我經營',
    headerBg: '#F7D3DF',
    headerText: '#4B1528',
    tagBg: '#FCF0F5',
    tagText: '#4B1528',
    rowBg: '#FCEDF2',
  },
  DREAM: {
    id: 'DREAM',
    name: '圓夢計畫',
    headerBg: '#DDDBF9',
    headerText: '#26215C',
    tagBg: '#F3F2FE',
    tagText: '#3C3489',
    rowBg: '#F1F1FD',
  },
};

export const PRESET_ITEMS: Record<CategoryKey, { name: string; tooltip?: string; placeholder?: string }[]> = {
  FIXED: [
    { name: '基本餐費', placeholder: '預抓費用' },
    { name: '水電瓦斯', placeholder: '預抓費用' },
    { name: '日用品(耗材)', placeholder: '預抓費用' },
    { name: '交通通勤費', placeholder: '預抓費用' },
    { name: '房租', placeholder: '固定費用' },
    { name: '電信費', placeholder: '固定費用' },
    { name: '貸款', placeholder: '固定費用' },
  ],
  ANNUAL: [
    { name: '緊急預備金', placeholder: '固定費用' },
    { name: '生活備用金', placeholder: '預抓費用' },
    { name: '家庭照顧(紅包/日常)', placeholder: '預抓費用' },
    { name: '保險', placeholder: '固定費用' },
    { name: '稅金', placeholder: '固定費用' },
  ],
  SELF: [
    { name: '興趣支出(技能/成長)', placeholder: '預抓費用' },
    { name: '娛樂支出(快樂/社交)', placeholder: '預抓費用' },
    { name: '衣飾/保養/化妝品', placeholder: '預抓費用' },
  ],
  DREAM: [
    { name: '投資理財', placeholder: '固定費用' },
    { name: '旅遊', placeholder: '固定費用' },
  ],
};
