import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { auraTypes } from '../data/aura-types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths, addMonths, isSameDay, isToday, isFuture } from 'date-fns';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const DiaryScreen: React.FC = () => {
  const { state } = useApp();
  const { feedingHistory, streak } = state;
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDow = getDay(monthStart);

  // Build a map of date -> auraId
  const dateAuraMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const log of feedingHistory) {
      map.set(log.date, log.auraId);
    }
    return map;
  }, [feedingHistory]);

  // Month stats
  const monthLogs = feedingHistory.filter(l => {
    const d = new Date(l.date);
    return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
  });
  const visitDays = new Set(monthLogs.map(l => l.date)).size;
  const auraCounts = new Map<number, number>();
  for (const log of monthLogs) {
    auraCounts.set(log.auraId, (auraCounts.get(log.auraId) || 0) + 1);
  }
  let topAuraId = 0;
  let topCount = 0;
  for (const [id, count] of auraCounts) {
    if (count > topCount) { topCount = count; topAuraId = id; }
  }
  const topAura = auraTypes.find(a => a.id === topAuraId);

  return (
    <div
      className="font-gmarket flex flex-col items-center px-5"
      style={{ paddingTop: 60, paddingBottom: 80, minHeight: '100vh' }}
    >
      {/* Month nav */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
          className="text-[#1A0B3E]/40 text-lg px-2"
        >
          &larr;
        </button>
        <h2 className="text-base font-bold text-[#1A0B3E]">
          {format(currentMonth, 'yyyy년 M월')}
        </h2>
        <button
          onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
          className="text-[#1A0B3E]/40 text-lg px-2"
        >
          &rarr;
        </button>
      </div>

      {/* Calendar */}
      <div className="w-full max-w-sm">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-[10px] font-medium text-[#1A0B3E]/30 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {/* Empty cells before start */}
          {Array.from({ length: startDow }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const auraId = dateAuraMap.get(dateStr);
            const aura = auraId ? auraTypes.find(a => a.id === auraId) : null;
            const isTodayDate = isToday(day);
            const isFutureDate = isFuture(day);

            return (
              <div
                key={dateStr}
                className={`diary-day ${isTodayDate ? 'diary-day-today' : ''} ${isFutureDate ? 'opacity-30' : ''}`}
              >
                <span className="diary-day-num">{day.getDate()}</span>
                {aura ? (
                  <div
                    className="diary-day-dot"
                    style={{ background: aura.themeColor }}
                    title={aura.name}
                  />
                ) : (
                  <div className="diary-day-dot-empty" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Month summary */}
      <div className="w-full max-w-sm mt-6 rounded-2xl bg-bg-card border border-surface px-5 py-4">
        <h3 className="text-xs font-bold text-[#1A0B3E]/50 mb-3">이번 달 요약</h3>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#1A0B3E]/70">방문 일수</span>
            <span className="text-sm font-bold text-primary">{visitDays}일</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#1A0B3E]/70">현재 연속</span>
            <span className="text-sm font-bold text-primary">{streak.currentStreak}일</span>
          </div>
          {topAura && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#1A0B3E]/70">가장 많은 기운</span>
              <span className="text-sm font-bold" style={{ color: topAura.themeColor }}>
                {topAura.name} ({topCount}회)
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiaryScreen;
