import React from 'react';
import { ChevronLeft, Database, Lock, Check, Info } from 'lucide-react';
import { Topic, Unit, QuestionBank, Question } from '../../../types';
import { styles } from '../../../pages/StudentQuiz.styles';

interface TopicDetailViewProps {
  selectedTopic: Topic | null;
  selectedUnit: Unit | null;
  selectedBank: QuestionBank | null;
  topicBanks: QuestionBank[];
  questions: Question[];
  onSelectBank: (bank: QuestionBank) => void;
  onStartQuiz: () => void;
  onBack: () => void;
}

export const TopicDetailView: React.FC<TopicDetailViewProps> = ({
  selectedTopic,
  selectedUnit,
  selectedBank,
  topicBanks,
  questions,
  onSelectBank,
  onStartQuiz,
  onBack,
}) => {
  const currentTitle = selectedTopic ? selectedTopic.title : selectedUnit?.title;
  const currentNumber = selectedTopic?.topicNumber || selectedUnit?.unitNumber || 1;

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%', paddingBottom: '120px' }}>
      {/* Üst Geri Tuşu ve Başlık */}
      <div style={styles.unitHeader}>
        <button
          onClick={onBack}
          style={styles.unitBackButton}
          title="Konulara Dön"
        >
          <ChevronLeft size={22} color="var(--kpss-text, #111)" />
        </button>
        <div style={styles.unitDetailHeaderTitle}>{currentTitle}</div>
        <div style={{ width: '40px' }} />
      </div>

      {/* Büyük Numara ve Konu Başlık Kartı */}
      <div style={styles.heroCard}>
        <div style={styles.heroBadge}>
          <span style={styles.heroBadgeText}>
            {String(currentNumber).padStart(2, '0')}
          </span>
        </div>
        <div style={styles.heroTitle}>{currentTitle}</div>
        <div style={{ fontSize: '13px', color: '#6366F1', fontWeight: 600, marginTop: '4px' }}>
          {selectedBank ? selectedBank.title : 'Soru Bankası'} • {questions.length} Soru
        </div>
      </div>

      {/* Soru Bankaları Seçim Bölümü (4. Düzey Hiyerarşi) */}
      {topicBanks.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <div style={{
            fontSize: '13px',
            fontWeight: 700,
            color: '#475569',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <Database size={15} color="#4F46E5" />
            <span>Bu Konuya Ait Soru Bankaları ({topicBanks.length}):</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {topicBanks.map((bank) => {
              const isSelected = selectedBank?.id === bank.id;
              const isBankUnder20 = (bank.questionCount || 0) < 20;
              return (
                <div
                  key={bank.id}
                  onClick={() => onSelectBank(bank)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: isSelected ? '2px solid #4F46E5' : '1px solid #E2E8F0',
                    backgroundColor: isSelected ? '#F5F3FF' : '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: isSelected ? '0 2px 8px rgba(79, 70, 229, 0.12)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      backgroundColor: isSelected ? '#4F46E5' : '#F1F5F9',
                      color: isSelected ? '#FFFFFF' : '#64748B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '13px',
                    }}>
                      {bank.orderNumber || 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>
                        {bank.title}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{bank.bankType || 'Standart Konu Testi'}</span>
                        <span>•</span>
                        <span>{bank.questionCount || 0} Soru</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {isBankUnder20 ? (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#FEF2F2',
                        color: '#DC2626',
                        border: '1px solid #FECACA',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        <Lock size={12} />
                        Hazırlıkta ({bank.questionCount || 0}/20)
                      </span>
                    ) : (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#ECFDF5',
                        color: '#059669',
                        border: '1px solid #A7F3D0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        <Check size={12} />
                        Yayında (20+ Soru)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Test Kuralları / Bilgi Kutusu */}
      <div style={styles.rulesCard}>
        <div style={styles.rulesCardTitle}>
          {selectedBank ? selectedBank.title : 'Bu testte'}:
        </div>

        <div style={styles.ruleItem}>
          <div style={styles.ruleDot} />
          <span style={styles.ruleText}>{questions.length || 20} soru</span>
        </div>

        <div style={styles.ruleItem}>
          <div style={styles.ruleDot} />
          <span style={styles.ruleText}>Sıralı ilerleme (1'den {questions.length || 20}'ye)</span>
        </div>

        <div style={styles.ruleItem}>
          <div style={styles.ruleDot} />
          <span style={styles.ruleText}>Soruları atlayamazsınız</span>
        </div>

        <div style={styles.ruleItem}>
          <div style={styles.ruleDot} />
          <span style={styles.ruleText}>Hatalar otomatik kaydedilir</span>
        </div>
      </div>

      {/* Sabit Alt Teste Başla Butonu */}
      <div style={styles.footerContainer} className="quiz-footer-container">
        {questions.length < 20 ? (
          <div style={{
            padding: '14px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '12px',
            textAlign: 'center',
            color: '#991B1B',
            fontWeight: 600,
            fontSize: '13px',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}>
            <Lock size={16} color="#DC2626" />
            <span>Seçili Soru Bankası Hazırlık Aşamasında (Yayınlanmadı • {questions.length}/20 Soru)</span>
          </div>
        ) : (
          <button
            onClick={onStartQuiz}
            style={styles.startButton}
          >
            Teste Başla ({selectedBank ? selectedBank.title : 'Sınavı Başlat'})
          </button>
        )}

        <div style={styles.footerInfoRow}>
          <Info size={16} color="#666" style={{ marginRight: '6px' }} />
          <span style={styles.footerInfoText}>Test sırasında soruları atlayamazsınız.</span>
        </div>
      </div>
    </div>
  );
};
