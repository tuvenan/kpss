import React from 'react';
import { X, Timer, Zap, Check, Play } from 'lucide-react';
import { MockExamType } from '../services/mockExamService';

export interface DenemeSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartExam: (durationMinutes: number, examType: MockExamType) => void;
  selectedExamType: MockExamType;
  setSelectedExamType: (type: MockExamType) => void;
  denemeDurationMinutes: number;
  setDenemeDurationMinutes: (minutes: number) => void;
}

export const DenemeSetupModal: React.FC<DenemeSetupModalProps> = ({
  isOpen,
  onClose,
  onStartExam,
  selectedExamType,
  setSelectedExamType,
  denemeDurationMinutes,
  setDenemeDurationMinutes,
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.72)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        padding: '24px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        position: 'relative',
      }}>
        {/* Kapat butonu */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#94A3B8',
            padding: '4px',
            borderRadius: '8px',
          }}
          title="Kapat"
        >
          <X size={20} />
        </button>

        {/* Başlık & İkon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: '#F2F2F5',
            color: '#111',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Timer size={22} />
          </div>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '6px', backgroundColor: '#F2F2F5', color: '#333', fontSize: '10.5px', fontWeight: 600 }}>
              <Zap size={11} />
              <span>KPSS SİMÜLASYONU</span>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: '2px 0 0 0' }}>
              KPSS Deneme Sınavı Modülü
            </h3>
          </div>
        </div>

        {/* Deneme Türü Seçimi (Çok Branşlı / Tam Format) */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
            📚 Sınav Formatı / Branş Seçin:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {[
              {
                type: 'quick_20' as MockExamType,
                title: '20 Soru Mini',
                sub: 'Hızlı karma deneme',
                badge: '25 dk',
                defaultMin: 25,
              },
              {
                type: 'gy_gk_full_120' as MockExamType,
                title: '120 Soru Tam',
                sub: 'Tam ÖSYM GY-GK',
                badge: '130 dk',
                defaultMin: 130,
              },
              {
                type: 'gy_branch_60' as MockExamType,
                title: '60 Soru GY',
                sub: 'Türkçe + Matematik',
                badge: '65 dk',
                defaultMin: 65,
              },
              {
                type: 'gk_branch_60' as MockExamType,
                title: '60 Soru GK',
                sub: 'Tarih, Coğ, Vat, Güncel',
                badge: '65 dk',
                defaultMin: 65,
              },
            ].map((item) => {
              const isSelected = selectedExamType === item.type;
              return (
                <div
                  key={item.type}
                  onClick={() => {
                    setSelectedExamType(item.type);
                    setDenemeDurationMinutes(item.defaultMin);
                  }}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    border: isSelected ? '2px solid #4F46E5' : '1px solid #E2E8F0',
                    backgroundColor: isSelected ? '#EEF2FF' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? '#4F46E5' : '#0F172A' }}>
                      {item.title}
                    </span>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      backgroundColor: isSelected ? '#4F46E5' : '#F1F5F9',
                      color: isSelected ? '#FFFFFF' : '#64748B',
                      padding: '1px 5px',
                      borderRadius: '4px',
                    }}>
                      {item.badge}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: isSelected ? '#4338CA' : '#64748B', marginTop: '3px' }}>
                    {item.sub}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Süre Seçimi */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
            ⏱️ Süre / Kronometre Seçeneği:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {[
              {
                value: selectedExamType === 'gy_gk_full_120' ? 130 : selectedExamType === 'quick_20' ? 25 : 65,
                label: selectedExamType === 'gy_gk_full_120' ? '130 Dk (ÖSYM)' : selectedExamType === 'quick_20' ? '25 Dk (Standart)' : '65 Dk (Standart)',
              },
              {
                value: selectedExamType === 'gy_gk_full_120' ? 100 : selectedExamType === 'quick_20' ? 20 : 50,
                label: selectedExamType === 'gy_gk_full_120' ? '100 Dk (Hızlı)' : selectedExamType === 'quick_20' ? '20 Dk (Hızlı)' : '50 Dk (Hızlı)',
              },
              { value: 0, label: 'Süresiz (Kronometre)' },
            ].map((opt) => {
              const isSelected = denemeDurationMinutes === opt.value;
              return (
                <div
                  key={opt.value}
                  onClick={() => setDenemeDurationMinutes(opt.value)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid #111' : '1px solid #E2E8F0',
                    backgroundColor: isSelected ? '#F8FAFC' : '#FFFFFF',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 700, color: isSelected ? '#111' : '#1E293B' }}>
                    {opt.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Özellikler Özeti */}
        <div style={{
          backgroundColor: '#F8FAFC',
          borderRadius: '12px',
          padding: '12px 14px',
          marginBottom: '20px',
          border: '1px solid #F1F5F9',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}>
          <div style={{ fontSize: '11.5px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Check size={14} color="#16A34A" />
            <span>Test anında süreyi duraklatabilir veya erken bitirebilirsiniz.</span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Check size={14} color="#16A34A" />
            <span>Sınav bitiminde ders bazlı başarı ve hız temposu analizi verilir.</span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Check size={14} color="#16A34A" />
            <span>Yanlış çözülen sorular otomatik 'Yanlışlarım' soru bankasına kaydedilir.</span>
          </div>
        </div>

        {/* Aksiyon Butonları */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              color: '#475569',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={() => onStartExam(denemeDurationMinutes, selectedExamType)}
            style={{
              flex: 2,
              padding: '12px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: '#111111',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.18)',
            }}
          >
            <Play size={15} fill="#FFFFFF" />
            <span>Denemeyi Başlat</span>
          </button>
        </div>
      </div>
    </div>
  );
};
