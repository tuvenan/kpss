import React from 'react';
import { X } from 'lucide-react';
import { Topic } from '../../../types';
import { adminStyles } from '../AdminPanel.styles';

interface EditTopicModalProps {
  topic: Topic | null;
  onClose: () => void;
  onTopicChange: (topic: Topic) => void;
  onSave: () => void;
}

export const EditTopicModal: React.FC<EditTopicModalProps> = ({
  topic,
  onClose,
  onTopicChange,
  onSave,
}) => {
  if (!topic) return null;

  return (
    <div style={adminStyles.modalBackdrop}>
      <div style={{ ...adminStyles.modalCard, maxWidth: '400px' }}>
        <div style={adminStyles.modalHeader}>
          <h2 style={adminStyles.modalTitle}>Konuyu Düzenle</h2>
          <button onClick={onClose} style={adminStyles.modalCloseBtn}>
            <X size={18} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={adminStyles.label}>Konu Numarası:</label>
            <input
              type="number"
              value={topic.topicNumber}
              onChange={(e) => onTopicChange({ ...topic, topicNumber: parseInt(e.target.value) || 1 })}
              style={adminStyles.inputField}
            />
          </div>
          <div>
            <label style={adminStyles.label}>Konu Başlığı:</label>
            <input
              type="text"
              value={topic.title}
              onChange={(e) => onTopicChange({ ...topic, title: e.target.value })}
              style={adminStyles.inputField}
            />
          </div>
        </div>
        <div style={adminStyles.modalActions}>
          <button onClick={onClose} style={adminStyles.secondaryBtn}>
            İptal
          </button>
          <button onClick={onSave} style={adminStyles.primaryBtn}>
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};
