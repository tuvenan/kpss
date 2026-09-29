import React from 'react';
import { X } from 'lucide-react';
import { Subject } from '../../../types';
import { adminStyles } from '../AdminPanel.styles';

interface EditSubjectModalProps {
  subject: Subject | null;
  onClose: () => void;
  onSubjectChange: (sub: Subject) => void;
  onSave: () => void;
}

export const EditSubjectModal: React.FC<EditSubjectModalProps> = ({
  subject,
  onClose,
  onSubjectChange,
  onSave,
}) => {
  if (!subject) return null;

  return (
    <div style={adminStyles.modalBackdrop}>
      <div style={{ ...adminStyles.modalCard, maxWidth: '400px' }}>
        <div style={adminStyles.modalHeader}>
          <h2 style={adminStyles.modalTitle}>Dersi Düzenle</h2>
          <button onClick={onClose} style={adminStyles.modalCloseBtn}>
            <X size={18} />
          </button>
        </div>
        <div>
          <label style={adminStyles.label}>Ders Başlığı:</label>
          <input
            type="text"
            value={subject.title}
            onChange={(e) => onSubjectChange({ ...subject, title: e.target.value })}
            style={adminStyles.inputField}
          />
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
