import React from 'react';
import { X } from 'lucide-react';
import { OptionId } from '../../../types';
import { adminStyles } from '../AdminPanel.styles';
import { QuestionFormData } from '../hooks/useQuestionEditor';

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingQuestionId: string | null;
  formData: QuestionFormData;
  onUpdateField: <K extends keyof QuestionFormData>(field: K, value: QuestionFormData[K]) => void;
  onUpdateOptionText: (id: OptionId, text: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const QuestionModal: React.FC<QuestionModalProps> = ({
  isOpen,
  onClose,
  editingQuestionId,
  formData,
  onUpdateField,
  onUpdateOptionText,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div style={adminStyles.modalBackdrop}>
      <div style={adminStyles.modalCard}>
        <div style={adminStyles.modalHeader}>
          <h2 style={adminStyles.modalTitle}>
            {editingQuestionId ? 'Soruyu Düzenle' : 'Yeni KPSS Sorusu Ekle'}
          </h2>
          <button onClick={onClose} style={adminStyles.modalCloseBtn}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={adminStyles.label}>Soru Metni:</label>
            <textarea
              rows={4}
              placeholder="Soru metnini detaylı şekilde yazınız..."
              value={formData.text}
              onChange={(e) => onUpdateField('text', e.target.value)}
              style={adminStyles.inputField}
              required
            />
          </div>

          {/* Seçenekler A, B, C, D, E */}
          <div>
            <label style={adminStyles.label}>Seçenekler (A - E):</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(['A', 'B', 'C', 'D', 'E'] as OptionId[]).map((optKey) => {
                const val = formData.options[optKey];
                const isChecked = formData.correctOption === optKey;

                return (
                  <div key={optKey} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => onUpdateField('correctOption', optKey)}
                      style={{
                        ...adminStyles.optionSelectBtn,
                        backgroundColor: isChecked ? '#10B981' : '#F1F5F9',
                        color: isChecked ? '#FFFFFF' : '#475569',
                        borderColor: isChecked ? '#059669' : '#CBD5E1',
                      }}
                      title={`Doğru cevap olarak ${optKey} seç`}
                    >
                      {optKey} {isChecked && '✓'}
                    </button>
                    <input
                      type="text"
                      placeholder={`${optKey} Seçeneği metni...`}
                      value={val}
                      onChange={(e) => onUpdateOptionText(optKey, e.target.value)}
                      style={adminStyles.inputField}
                      required
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Doğru Cevap Seçici */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ ...adminStyles.label, margin: 0 }}>Belirlenen Doğru Cevap:</label>
            <span style={adminStyles.correctPillBadge}>{formData.correctOption} Seçeneği</span>
          </div>

          {/* Çözüm / Açıklama */}
          <div>
            <label style={adminStyles.label}>Açıklama / Çözüm Rehberi:</label>
            <textarea
              rows={2}
              placeholder="Öğrencinin soruyu anlaması için ayrıntılı çözüm notu..."
              value={formData.explanation}
              onChange={(e) => onUpdateField('explanation', e.target.value)}
              style={adminStyles.inputField}
            />
          </div>

          <div style={adminStyles.modalActions}>
            <button type="button" onClick={onClose} style={adminStyles.secondaryBtn}>
              İptal
            </button>
            <button type="submit" style={adminStyles.primaryBtn}>
              {editingQuestionId ? 'Güncellemeleri Kaydet' : 'Soruyu Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
