import {
  Check,
  CheckSquare,
  Copy,
  FileText,
  Pin,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { copyTextToClipboard } from '../../utils/clipboard';
import type { AppLanguage } from '../../utils/i18n';
import {
  type ChecklistCategory,
  type ChecklistItem,
  type QuickMemoNote,
  countMemoStats,
  loadChecklistItems,
  loadQuickMemos,
  saveChecklistItems,
  saveQuickMemos,
} from '../../utils/lifeTools';

interface MemoChecklistToolProps {
  lang: AppLanguage;
}

const COPY: Record<
  AppLanguage,
  {
    checklistTitle: string;
    catAll: string;
    catShopping: string;
    catTodo: string;
    catCarry: string;
    addItemPlaceholder: string;
    addBtn: string;
    clearDone: string;
    addEmergencyPack: string;
    checklistEmpty: string;
    remainingText: (rem: number, total: number) => string;
    memoTitle: string;
    newMemo: string;
    searchMemos: string;
    memoTitlePlaceholder: string;
    memoBodyPlaceholder: string;
    copyMemo: string;
    copied: string;
    deleteMemo: string;
    pinMemo: string;
    savedAuto: string;
    charsLabel: string;
    noSpaceLabel: string;
    linesLabel: string;
    pagesLabel: string;
    untitled: string;
    emergencyTemplateItems: string[];
  }
> = {
  ja: {
    checklistTitle: '買い物・やることリスト',
    catAll: 'すべて',
    catShopping: '買い物',
    catTodo: 'やること',
    catCarry: '持ち物・防災',
    addItemPlaceholder: '牛乳、ゴミ出し、モバイルバッテリーなど...',
    addBtn: '追加',
    clearDone: '完了済みを削除',
    addEmergencyPack: '防災持ち物セットを追加',
    checklistEmpty: '項目がありません。上の入力欄から追加できます。',
    remainingText: (rem, total) => `残り ${rem} / ${total} 件`,
    memoTitle: 'クイックメモ帳',
    newMemo: '新規メモ',
    searchMemos: 'メモを検索...',
    memoTitlePlaceholder: 'メモのタイトル',
    memoBodyPlaceholder: '買い物の覚え書き、連絡事項、パスワード以外のメモなどを自由に書き留められます（ブラウザに自動保存）...',
    copyMemo: '本文をコピー',
    copied: 'コピー済み',
    deleteMemo: '削除',
    pinMemo: 'ピン留め',
    savedAuto: '自動保存済み',
    charsLabel: '文字数',
    noSpaceLabel: '空白除く',
    linesLabel: '行数',
    pagesLabel: '400字原稿',
    untitled: '無題のメモ',
    emergencyTemplateItems: [
      '飲料水（1人1日3L目安）',
      'モバイルバッテリー・充電ケーブル',
      '懐中電灯・乾電池',
      '非常食・常備薬・お薬手帳',
      '現金（小銭・千円札）・身分証コピー',
    ],
  },
  en: {
    checklistTitle: 'Shopping & Daily Checklist',
    catAll: 'All',
    catShopping: 'Shopping',
    catTodo: 'To-Do',
    catCarry: 'Packing / Go-Bag',
    addItemPlaceholder: 'Milk, take out trash, power bank...',
    addBtn: 'Add',
    clearDone: 'Clear Completed',
    addEmergencyPack: 'Add Go-Bag Kit',
    checklistEmpty: 'No items yet. Add one above to get started.',
    remainingText: (rem, total) => `${rem} of ${total} remaining`,
    memoTitle: 'Quick Scratchpad Memo',
    newMemo: 'New Note',
    searchMemos: 'Search notes...',
    memoTitlePlaceholder: 'Note title',
    memoBodyPlaceholder: 'Jot down everyday reminders, phone numbers, or draft text (saved automatically in your browser)...',
    copyMemo: 'Copy Text',
    copied: 'Copied',
    deleteMemo: 'Delete',
    pinMemo: 'Pin',
    savedAuto: 'Auto-saved',
    charsLabel: 'Chars',
    noSpaceLabel: 'No Spaces',
    linesLabel: 'Lines',
    pagesLabel: '400ch Pages',
    untitled: 'Untitled Note',
    emergencyTemplateItems: [
      'Drinking water (3L/person/day)',
      'Power bank & charging cables',
      'Flashlight & spare batteries',
      'Emergency food & daily medication',
      'Cash (small bills/coins) & ID copy',
    ],
  },
  zh: {
    checklistTitle: '购物与日常清单',
    catAll: '全部',
    catShopping: '购物',
    catTodo: '待办',
    catCarry: '随身・防灾',
    addItemPlaceholder: '牛奶、倒垃圾、充电宝等...',
    addBtn: '添加',
    clearDone: '清除已完成',
    addEmergencyPack: '添加防灾应急包清单',
    checklistEmpty: '暂无项目，可在上方输入框中添加。',
    remainingText: (rem, total) => `剩余 ${rem} / ${total} 项`,
    memoTitle: '快捷备忘录',
    newMemo: '新建笔记',
    searchMemos: '搜索笔记...',
    memoTitlePlaceholder: '笔记标题',
    memoBodyPlaceholder: '随时记录日常备忘、待办细节或文字草稿（自动保存至浏览器本地）...',
    copyMemo: '复制正文',
    copied: '已复制',
    deleteMemo: '删除',
    pinMemo: '置顶',
    savedAuto: '已自动保存',
    charsLabel: '字数',
    noSpaceLabel: '不含空格',
    linesLabel: '行数',
    pagesLabel: '400字稿纸',
    untitled: '未命名笔记',
    emergencyTemplateItems: [
      '饮用水（每人每日约 3L）',
      '充电宝与数据线',
      '手电筒与备用电池',
      '应急食品与常用药物',
      '少量现金与证件复印件',
    ],
  },
  ko: {
    checklistTitle: '장보기・일상 체크리스트',
    catAll: '전체',
    catShopping: '장보기',
    catTodo: '할 일',
    catCarry: '준비물・방재',
    addItemPlaceholder: '우유, 분리수거, 보조배터리 등...',
    addBtn: '추가',
    clearDone: '완료 항목 삭제',
    addEmergencyPack: '비상 생존배낭 템플릿 추가',
    checklistEmpty: '항목이 없습니다. 위 입력창에서 추가해 보세요.',
    remainingText: (rem, total) => `남음 ${rem} / ${total}건`,
    memoTitle: '빠른 메모장',
    newMemo: '새 메모',
    searchMemos: '메모 검색...',
    memoTitlePlaceholder: '메모 제목',
    memoBodyPlaceholder: '일상 메모, 연락처, 초안 등을 자유롭게 기록하세요 (브라우저에 자동 저장됩니다)...',
    copyMemo: '본문 복사',
    copied: '복사됨',
    deleteMemo: '삭제',
    pinMemo: '고정',
    savedAuto: '자동 저장됨',
    charsLabel: '글자 수',
    noSpaceLabel: '공백 제외',
    linesLabel: '줄 수',
    pagesLabel: '400자 원고',
    untitled: '제목 없는 메모',
    emergencyTemplateItems: [
      '생수 (1인 1일 3L 기준)',
      '보조배터리・충전 케이블',
      '손전등・여분 건전지',
      '비상식량・상비약・처방약',
      '소액 현금・신분증 사본',
    ],
  },
};

export function MemoChecklistTool({ lang }: MemoChecklistToolProps) {
  const c = COPY[lang] ?? COPY.ja;

  // Checklist state
  const [items, setItems] = useState<ChecklistItem[]>(() => loadChecklistItems());
  const [filterCat, setFilterCat] = useState<'all' | ChecklistCategory>('all');
  const [newItemCat, setNewItemCat] = useState<ChecklistCategory>('shopping');
  const [newItemText, setNewItemText] = useState('');

  // Quick Memo state
  const [memos, setMemos] = useState<QuickMemoNote[]>(() => {
    const loaded = loadQuickMemos();
    if (loaded.length > 0) return loaded;
    return [
      {
        id: 'welcome-memo',
        title: COPY[lang]?.untitled ?? '無題のメモ',
        body: '',
        pinned: false,
        updatedAt: Date.now(),
      },
    ];
  });
  const [selectedMemoId, setSelectedMemoId] = useState<string>(() => memos[0]?.id ?? '');
  const [memoSearch, setMemoSearch] = useState('');
  const [copiedMemo, setCopiedMemo] = useState(false);

  useEffect(() => {
    saveChecklistItems(items);
  }, [items]);

  useEffect(() => {
    saveQuickMemos(memos);
  }, [memos]);

  const handleAddChecklistItem = (e: FormEvent) => {
    e.preventDefault();
    const cleaned = newItemText.trim();
    if (!cleaned) return;
    const next: ChecklistItem = {
      id: `chk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text: cleaned,
      category: newItemCat,
      done: false,
      createdAt: Date.now(),
    };
    setItems((prev) => [next, ...prev]);
    setNewItemText('');
  };

  const handleAddEmergencyTemplate = () => {
    const existingTexts = new Set(items.map((i) => i.text));
    const additions: ChecklistItem[] = c.emergencyTemplateItems
      .filter((t) => !existingTexts.has(t))
      .map((text, idx) => ({
        id: `chk-emg-${Date.now()}-${idx}`,
        text,
        category: 'carry',
        done: false,
        createdAt: Date.now() + idx,
      }));
    if (additions.length > 0) {
      setItems((prev) => [...additions, ...prev]);
      setFilterCat('carry');
    }
  };

  const visibleItems =
    filterCat === 'all' ? items : items.filter((item) => item.category === filterCat);
  const remainingCount = visibleItems.filter((i) => !i.done).length;
  const doneCount = items.filter((i) => i.done).length;

  const sortedMemos = [...memos]
    .filter((m) => {
      const q = memoSearch.trim().toLowerCase();
      if (!q) return true;
      return m.title.toLowerCase().includes(q) || m.body.toLowerCase().includes(q);
    })
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);

  const activeMemo = memos.find((m) => m.id === selectedMemoId) ?? sortedMemos[0] ?? null;
  const memoStats = countMemoStats(activeMemo?.body ?? '');

  const handleCreateMemo = () => {
    const created: QuickMemoNote = {
      id: `memo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: c.untitled,
      body: '',
      pinned: false,
      updatedAt: Date.now(),
    };
    setMemos((prev) => [created, ...prev]);
    setSelectedMemoId(created.id);
  };

  const updateActiveMemo = (patch: Partial<Pick<QuickMemoNote, 'title' | 'body' | 'pinned'>>) => {
    if (!activeMemo) return;
    setMemos((prev) =>
      prev.map((m) =>
        m.id === activeMemo.id ? { ...m, ...patch, updatedAt: Date.now() } : m,
      ),
    );
  };

  const handleDeleteMemo = (id: string) => {
    setMemos((prev) => {
      const next = prev.filter((m) => m.id !== id);
      if (selectedMemoId === id) {
        setSelectedMemoId(next[0]?.id ?? '');
      }
      return next;
    });
  };

  const catLabel = (cat: ChecklistCategory) =>
    cat === 'shopping' ? c.catShopping : cat === 'todo' ? c.catTodo : c.catCarry;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      {/* Left: Everyday Checklist */}
      <section
        data-testid="life-checklist-section"
        className="flex flex-col rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-5 lg:col-span-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <CheckSquare className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
            <span>{c.checklistTitle}</span>
          </h2>
          <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
            {c.remainingText(remainingCount, visibleItems.length)}
          </span>
        </div>

        {/* Add Item Form */}
        <form onSubmit={handleAddChecklistItem} className="mt-3 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <select
              aria-label={c.catShopping}
              value={newItemCat}
              onChange={(e) => setNewItemCat(e.target.value as ChecklistCategory)}
              className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] px-2.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="shopping">{c.catShopping}</option>
              <option value="todo">{c.catTodo}</option>
              <option value="carry">{c.catCarry}</option>
            </select>
            <input
              type="text"
              value={newItemText}
              data-testid="checklist-new-input"
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder={c.addItemPlaceholder}
              className="min-w-0 flex-1 rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[var(--nein-accent)] focus:outline-none dark:text-slate-100"
            />
            <button
              type="submit"
              data-testid="checklist-add-btn"
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[var(--nein-accent)] px-3 py-2 text-xs font-bold text-[var(--nein-accent-contrast)] transition-opacity hover:opacity-90 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{c.addBtn}</span>
            </button>
          </div>
        </form>

        {/* Filter Bar + Emergency Kit Quick-Add */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--nein-border-subtle)] pb-3">
          <div className="flex flex-wrap gap-1">
            {(
              [
                { id: 'all' as const, label: c.catAll },
                { id: 'shopping' as const, label: c.catShopping },
                { id: 'todo' as const, label: c.catTodo },
                { id: 'carry' as const, label: c.catCarry },
              ]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterCat(tab.id)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                  filterCat === tab.id
                    ? 'bg-[var(--nein-accent-soft)] text-[var(--nein-accent-text)]'
                    : 'text-slate-600 hover:bg-[var(--nein-sub)] dark:text-slate-400'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            data-testid="checklist-add-emergency-btn"
            onClick={handleAddEmergencyTemplate}
            className="inline-flex items-center gap-1 rounded-md border border-[var(--nein-border)] bg-[var(--nein-sub)] px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-[var(--nein-accent-border)] hover:text-[var(--nein-accent-text)] dark:text-slate-300 cursor-pointer"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-[var(--nein-accent-text)]" aria-hidden="true" />
            <span>{c.addEmergencyPack}</span>
          </button>
        </div>

        {/* Checklist Items */}
        <div className="mt-3 flex-1 overflow-y-auto max-h-[380px]">
          {visibleItems.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
              {c.checklistEmpty}
            </p>
          ) : (
            <ul className="divide-y divide-[var(--nein-border-subtle)]">
              {visibleItems.map((item) => (
                <li
                  key={item.id}
                  data-testid="checklist-item-row"
                  className="flex items-center justify-between gap-2 py-2.5"
                >
                  <label className="flex min-w-0 flex-1 items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() =>
                        setItems((prev) =>
                          prev.map((row) => (row.id === item.id ? { ...row, done: !row.done } : row)),
                        )
                      }
                      className="h-4 w-4 shrink-0 accent-[var(--nein-accent)] cursor-pointer"
                    />
                    <span
                      className={`truncate text-xs ${
                        item.done
                          ? 'text-slate-400 line-through dark:text-slate-500'
                          : 'font-medium text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      {item.text}
                    </span>
                  </label>
                  <span className="shrink-0 text-[10px] text-slate-500 dark:text-slate-400">
                    {catLabel(item.category)}
                  </span>
                  <button
                    type="button"
                    aria-label={c.deleteMemo}
                    onClick={() => setItems((prev) => prev.filter((row) => row.id !== item.id))}
                    className="rounded p-1 text-slate-400 hover:bg-red-500/10 hover:text-red-500 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {doneCount > 0 && (
          <div className="mt-3 flex justify-end border-t border-[var(--nein-border-subtle)] pt-3">
            <button
              type="button"
              onClick={() => setItems((prev) => prev.filter((i) => !i.done))}
              className="text-xs font-semibold text-slate-500 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
            >
              {c.clearDone} ({doneCount})
            </button>
          </div>
        )}
      </section>

      {/* Right: Quick Scratchpad Memos */}
      <section
        data-testid="life-memo-section"
        className="rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-5 lg:col-span-7"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <FileText className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
            <span>{c.memoTitle}</span>
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">{c.savedAuto}</span>
            <button
              type="button"
              data-testid="memo-new-btn"
              onClick={handleCreateMemo}
              className="inline-flex items-center gap-1 rounded-md bg-[var(--nein-accent)] px-2.5 py-1.5 text-xs font-bold text-[var(--nein-accent-contrast)] transition-opacity hover:opacity-90 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{c.newMemo}</span>
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-12">
          {/* Note List Sidebar */}
          <div className="md:col-span-4">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="text"
                value={memoSearch}
                onChange={(e) => setMemoSearch(e.target.value)}
                placeholder={c.searchMemos}
                className="w-full rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] py-2 pl-8 pr-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[var(--nein-accent)] focus:outline-none dark:text-slate-100"
              />
            </div>

            <div className="mt-2.5 max-h-[340px] space-y-1 overflow-y-auto">
              {sortedMemos.map((note) => {
                const selected = activeMemo?.id === note.id;
                return (
                  <div
                    key={note.id}
                    className={`flex items-center justify-between gap-1 rounded-lg border px-2.5 py-2 transition-colors ${
                      selected
                        ? 'border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)]'
                        : 'border-transparent hover:bg-[var(--nein-sub)]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedMemoId(note.id)}
                      className="min-w-0 flex-1 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-1 truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                        {note.pinned && (
                          <Pin className="h-3 w-3 shrink-0 text-[var(--nein-accent-text)]" aria-hidden="true" />
                        )}
                        <span className="truncate">{note.title || c.untitled}</span>
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                        {note.body || '—'}
                      </div>
                    </button>
                    {memos.length > 1 && (
                      <button
                        type="button"
                        aria-label={c.deleteMemo}
                        onClick={() => handleDeleteMemo(note.id)}
                        className="rounded p-1 text-slate-400 hover:bg-red-500/10 hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Note Editor */}
          <div className="flex flex-col md:col-span-8">
            {activeMemo && (
              <>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={activeMemo.title}
                    data-testid="memo-title-input"
                    onChange={(e) => updateActiveMemo({ title: e.target.value })}
                    placeholder={c.memoTitlePlaceholder}
                    className="min-w-0 flex-1 rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] px-3 py-2 text-sm font-bold text-slate-900 focus:border-[var(--nein-accent)] focus:outline-none dark:text-slate-100"
                  />
                  <button
                    type="button"
                    aria-label={c.pinMemo}
                    onClick={() => updateActiveMemo({ pinned: !activeMemo.pinned })}
                    className={`rounded-lg border p-2 transition-colors cursor-pointer ${
                      activeMemo.pinned
                        ? 'border-[var(--nein-accent)] bg-[var(--nein-accent-soft)] text-[var(--nein-accent-text)]'
                        : 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-500 hover:text-slate-800 dark:text-slate-400'
                    }`}
                  >
                    <Pin className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    data-testid="memo-copy-btn"
                    onClick={async () => {
                      const ok = await copyTextToClipboard(activeMemo.body);
                      if (ok) {
                        setCopiedMemo(true);
                        window.setTimeout(() => setCopiedMemo(false), 1800);
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] px-2.5 py-2 text-xs font-semibold text-slate-700 hover:border-[var(--nein-accent-border)] dark:text-slate-200 whitespace-nowrap cursor-pointer"
                  >
                    {copiedMemo ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    <span>{copiedMemo ? c.copied : c.copyMemo}</span>
                  </button>
                </div>

                <textarea
                  rows={10}
                  value={activeMemo.body}
                  data-testid="memo-body-textarea"
                  onChange={(e) => updateActiveMemo({ body: e.target.value })}
                  placeholder={c.memoBodyPlaceholder}
                  className="mt-3 w-full flex-1 resize-y rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-3 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-[var(--nein-accent)] focus:outline-none dark:text-slate-100"
                />

                {/* Clean Unboxed Metadata Bar */}
                <div
                  data-testid="memo-stats-bar"
                  className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400"
                >
                  <span>
                    {c.charsLabel}: <strong className="text-slate-800 dark:text-slate-200">{memoStats.chars}</strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {c.noSpaceLabel}: <strong className="text-slate-800 dark:text-slate-200">{memoStats.charsNoSpaces}</strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {c.linesLabel}: <strong className="text-slate-800 dark:text-slate-200">{memoStats.lines}</strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {c.pagesLabel}: <strong className="text-slate-800 dark:text-slate-200">{memoStats.manuscriptPages}</strong>
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
