import React from 'react';
import { X } from 'lucide-react';
import { Unit } from '../../../types';
import { adminStyles } from '../AdminPanel.styles';

interface EditUnitModalProps {
  unit: Unit | null;
  onClose: () => void;
  onUnitChange: (unit: Unit) => void;
  onSave: () => void;
}

export const EditUnitModal: React.FC<EditUnitModalProps> = ({
  unit,
  onClose,
  onUnitChange,
  onSave,
}) => {
  if (!unit) return null;

  return (
    <div style={adminStyles.modalBackdrop}>
      <div style={{ ...adminStyles.modalCard, maxWidth: '400px' }}>
        <div style={adminStyles.modalHeader}>
          <h2 style={adminStyles.modalTitle}>Üniteyi Düzenle</h2>
          <button onClick={onClose} style={adminStyles.modalCloseBtn}>
            <X size={18} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={adminStyles.label}>Ünite Numarası:</label>
            <input
              type="number"
              value={unit.unitNumber}
              onChange={(e) => onUnitChange({ ...unit, unitNumber: parseInt(e.target.value) || 1 })}
              style={adminStyles.inputField}
            />
          </div>
          <div>
            <label style={adminStyles.label}>Ünite Başlığı:</label>
            <input
              type="text"
              value={unit.title}
              onChange={(e) => onUnitChange({ ...unit, title: e.target.value })}
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
