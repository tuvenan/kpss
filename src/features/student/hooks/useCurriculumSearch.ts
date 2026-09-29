import React, { useState, useEffect, useRef } from 'react';
import { curriculumSearchService, CurriculumSearchItem } from '../../../services/curriculumSearchService';
import { Subject, Unit, Topic } from '../../../types';
import { api } from '../../../services/api';
import { StudentTabType, StudentViewState } from '../types';

export interface CurriculumSearchNavigationCallbacks {
  setActiveTab: (tab: StudentTabType) => void;
  setViewState: (viewState: StudentViewState) => void;
  setSelectedSubject: (subject: Subject | null) => void;
  setUnits: (units: Unit[]) => void;
  setSelectedUnit: (unit: Unit | null) => void;
  setTopics: (topics: Topic[]) => void;
  handleSelectSubject: (sub: Subject) => Promise<void>;
  handleSelectUnit: (unit: Unit) => Promise<void>;
  handleSelectTopic: (topic: Topic) => Promise<void>;
  handleOpenDenemeSetup: () => void;
}

export const useCurriculumSearch = (callbacks: CurriculumSearchNavigationCallbacks) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CurriculumSearchItem[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Warmup cache
  useEffect(() => {
    curriculumSearchService.getIndex().catch(console.warn);
  }, []);

  // Search effect
  useEffect(() => {
    let isCancelled = false;
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setIsSearchOpen(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    curriculumSearchService
      .search(q)
      .then((results) => {
        if (!isCancelled) {
          setSearchResults(results);
          setIsSearchOpen(true);
          setIsSearching(false);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setIsSearching(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [searchQuery]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectSearchResult = async (item: CurriculumSearchItem) => {
    setIsSearchOpen(false);
    setSearchQuery('');

    // 1. Kategori / Özel Modül Seçimi
    if (item.type === 'category') {
      if (item.categoryKey === 'deneme') {
        callbacks.handleOpenDenemeSetup();
      } else if (item.categoryKey === 'mistakes') {
        callbacks.setActiveTab('errors');
        callbacks.setViewState('subjects');
      } else if (item.categoryKey === 'radar') {
        callbacks.setActiveTab('home');
        callbacks.setViewState('subjects');
      } else if (item.categoryKey === 'calendar') {
        callbacks.setActiveTab('profile');
        callbacks.setViewState('subjects');
      } else if (item.categoryKey === 'settings') {
        callbacks.setActiveTab('settings');
        callbacks.setViewState('subjects');
      }
      return;
    }

    // 2. Ders Seçimi
    if (item.type === 'subject' && item.subject) {
      callbacks.setActiveTab('subjects');
      await callbacks.handleSelectSubject(item.subject);
      return;
    }

    // 3. Ünite Seçimi
    if (item.type === 'unit' && item.subject && item.unit) {
      callbacks.setActiveTab('subjects');
      callbacks.setSelectedSubject(item.subject);
      try {
        const unitList = await api.getUnits(item.subject.id);
        callbacks.setUnits(unitList);
      } catch {}
      await callbacks.handleSelectUnit(item.unit);
      return;
    }

    // 4. Alt Konu Seçimi
    if (item.type === 'topic' && item.subject && item.unit && item.topic) {
      callbacks.setActiveTab('subjects');
      callbacks.setSelectedSubject(item.subject);
      try {
        const unitList = await api.getUnits(item.subject.id);
        callbacks.setUnits(unitList);
      } catch {}
      callbacks.setSelectedUnit(item.unit);
      try {
        const topicList = await api.getTopics(item.unit.id);
        callbacks.setTopics(topicList);
      } catch {}
      await callbacks.handleSelectTopic(item.topic);
      return;
    }
  };

  const handleSearchSubmit = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0) {
        handleSelectSearchResult(searchResults[0]);
      } else if (searchQuery.trim()) {
        const res = await curriculumSearchService.search(searchQuery);
        if (res.length > 0) {
          handleSelectSearchResult(res[0]);
        } else {
          callbacks.setActiveTab('subjects');
          callbacks.setViewState('subjects');
          setIsSearchOpen(false);
        }
      }
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
    }
  };

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearchOpen,
    setIsSearchOpen,
    isSearching,
    searchContainerRef,
    handleSelectSearchResult,
    handleSearchSubmit,
  };
};
