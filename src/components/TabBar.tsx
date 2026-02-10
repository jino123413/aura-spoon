import React from 'react';
import { TabId } from '../types';

interface TabBarProps {
  activeTab: TabId;
  onChangeTab: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; iconOutline: string; iconSolid: string }[] = [
  {
    id: 'home',
    label: '홈',
    iconOutline: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    iconSolid: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    id: 'collection',
    label: '도감',
    iconOutline: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    iconSolid: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  },
  {
    id: 'mascot',
    label: '기운이',
    iconOutline: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    iconSolid: 'M3.172 5.172a4 4 0 015.656 0L12 8.344l3.172-3.172a4 4 0 115.656 5.656L12 19.656l-8.828-8.828a4 4 0 010-5.656z',
  },
];

const TabBar: React.FC<TabBarProps> = ({ activeTab, onChangeTab }) => {
  return (
    <nav className="tab-bar">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className={`tab-item ${isActive ? 'tab-item-active' : ''}`}
            onClick={() => onChangeTab(tab.id)}
          >
            <svg
              width={22}
              height={22}
              viewBox="0 0 24 24"
              fill={isActive ? 'var(--primary)' : 'none'}
              stroke={isActive ? 'var(--primary)' : 'var(--text-secondary)'}
              strokeWidth={isActive ? 2.2 : 1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={isActive ? tab.iconSolid : tab.iconOutline} />
            </svg>
            <span className="tab-label">{tab.label}</span>
            {isActive && <div className="tab-dot" />}
          </button>
        );
      })}
    </nav>
  );
};

export default TabBar;
