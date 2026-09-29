import React from 'react';
import { Search, Timer, AlertTriangle, BarChart2, Zap, BookOpen, FileText, Target, ChevronRight } from 'lucide-react';
import { CurriculumSearchItem } from '../../../services/curriculumSearchService';
import { styles } from '../../../pages/StudentQuiz.styles';

interface CurriculumSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: CurriculumSearchItem[];
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isSearching: boolean;
  searchContainerRef: React.RefObject<HTMLDivElement>;
  onSelectSearchResult: (item: CurriculumSearchItem) => void;
  onSearchSubmit: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const CurriculumSearch: React.FC<CurriculumSearchProps> = ({
  searchQuery,
  setSearchQuery,
  searchResults,
  isSearchOpen,
  setIsSearchOpen,
  isSearching,
  searchContainerRef,
  onSelectSearchResult,
  onSearchSubmit,
}) => {
  return (
    <div
      ref={searchContainerRef}
      className="header-search-box"
      style={{ ...styles.headerSearchBox, position: 'relative' }}
    >
      <Search size={16} color="#888" style={{ marginRight: '10px', flexShrink: 0 }} />
      <input
        placeholder="Ders, ünite veya konu ara..."
        style={styles.headerSearchInput}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => {
          if (searchQuery.trim().length > 0) setIsSearchOpen(true);
        }}
        onKeyDown={onSearchSubmit}
      />
      {searchQuery && (
        <button
          type="button"
          onClick={() => {
            setSearchQuery('');
            setIsSearchOpen(false);
          }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', color: '#999' }}
          title="Aramayı Temizle"
        >
          ✕
        </button>
      )}

      {/* ARAMA SONUÇLARI AÇILIR MENÜSÜ (DROPDOWN) */}
      {isSearchOpen && searchQuery.trim().length > 0 && (
        <div className="search-dropdown-menu">
          {/* Üst Durum Başlığı */}
          <div style={{
            padding: '10px 14px',
            backgroundColor: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            fontWeight: 600,
            color: '#64748B',
          }}>
            <span>Arama Sonuçları</span>
            <span>{isSearching ? 'Aranıyor...' : `${searchResults.length} sonuç`}</span>
          </div>

          {/* Sonuç Listesi */}
          <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
            {searchResults.length === 0 && !isSearching ? (
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <Search size={22} color="#94A3B8" style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Sonuç bulunamadı
                </div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>
                  "{searchQuery}" ile eşleşen ders, ünite veya konu bulunamadı.
                </div>
              </div>
            ) : (
              searchResults.map((item) => (
                <div
                  key={item.id}
                  className="search-result-item"
                  onClick={() => onSelectSearchResult(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderBottom: '1px solid #F1F5F9',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: '#F1F5F9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {item.type === 'category' ? (
                        item.categoryKey === 'deneme' ? <Timer size={16} color="#D97706" /> :
                        item.categoryKey === 'mistakes' ? <AlertTriangle size={16} color="#DC2626" /> :
                        item.categoryKey === 'radar' ? <BarChart2 size={16} color="#4338CA" /> :
                        <Zap size={16} color="#D97706" />
                      ) : item.type === 'subject' ? (
                        <BookOpen size={16} color="#1D4ED8" />
                      ) : item.type === 'unit' ? (
                        <FileText size={16} color="#7E22CE" />
                      ) : (
                        <Target size={16} color="#15803D" />
                      )}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span style={{
                          backgroundColor: item.badgeBg,
                          color: item.badgeColor,
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          flexShrink: 0,
                        }}>
                          {item.typeLabel}
                        </span>
                        <span style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#0F172A',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {item.title}
                        </span>
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: '#64748B',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {item.breadcrumb}
                      </div>
                    </div>
                  </div>

                  <ChevronRight size={15} color="#94A3B8" style={{ flexShrink: 0, marginLeft: '8px' }} />
                </div>
              ))
            )}
          </div>

          {/* Alt Kısayol İpuçları */}
          <div style={{
            padding: '7px 14px',
            backgroundColor: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: '#94A3B8',
          }}>
            <span>↵ Enter: İlk sonuca git</span>
            <span>ESC: Kapat</span>
          </div>
        </div>
      )}
    </div>
  );
};
