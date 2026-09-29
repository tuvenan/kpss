import React, { useState } from 'react';
import { PackagePlus, Download, Copy, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import { Topic, Unit, Question } from '../../../types';
import { api } from '../../../services/api';
import { adminStyles } from '../AdminPanel.styles';

interface BulkPackagesViewProps {
  currentTopic?: Topic;
  currentUnit?: Unit;
  selectedTopicId: string;
  selectedUnitId: string;
  questions: Question[];
  onUploadSample20: () => void;
  onExportQuestions: () => void;
  onImportSuccess: (targetId: string) => void;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const BulkPackagesView: React.FC<BulkPackagesViewProps> = ({
  currentTopic,
  currentUnit,
  selectedTopicId,
  selectedUnitId,
  questions,
  onUploadSample20,
  onExportQuestions,
  onImportSuccess,
  notify,
}) => {
  const [jsonInput, setJsonInput] = useState('');
  const [jsonValidationResult, setJsonValidationResult] = useState<{
    valid: boolean;
    count: number;
    error?: string;
  } | null>(null);

  const validateAndParseJson = (raw: string) => {
    if (!raw.trim()) {
      setJsonValidationResult(null);
      return null;
    }
    try {
      const parsed = JSON.parse(raw);
      const arr = Array.isArray(parsed) ? parsed : parsed.questions || [];
      if (!Array.isArray(arr) || arr.length === 0) {
        setJsonValidationResult({ valid: false, count: 0, error: 'JSON geçerli bir soru dizisi içermiyor.' });
        return null;
      }
      const valid = arr.every(
        (item: any) =>
          typeof item.questionText === 'string' &&
          Array.isArray(item.options) &&
          item.options.length >= 2 &&
          item.correctOption
      );
      if (!valid) {
        setJsonValidationResult({
          valid: false,
          count: 0,
          error: "Her soru 'questionText', 'options' ([{id, text}]) ve 'correctOption' içermelidir.",
        });
        return null;
      }
      setJsonValidationResult({ valid: true, count: arr.length });
      return arr;
    } catch (e: any) {
      setJsonValidationResult({ valid: false, count: 0, error: 'Geçersiz JSON formatı: ' + e.message });
      return null;
    }
  };

  const handleJsonInputChange = (val: string) => {
    setJsonInput(val);
    validateAndParseJson(val);
  };

  const copySampleJsonTemplate = () => {
    const sample = JSON.stringify(
      [
        {
          questionText: 'Örnek soru metni buraya yazılır?',
          options: [
            { id: 'A', text: 'Seçenek A' },
            { id: 'B', text: 'Seçenek B' },
            { id: 'C', text: 'Seçenek C' },
            { id: 'D', text: 'Seçenek D' },
            { id: 'E', text: 'Seçenek E' },
          ],
          correctOption: 'A',
          explanation: 'Ayrıntılı soru çözümü ve açıklaması.',
        },
      ],
      null,
      2
    );
    navigator.clipboard.writeText(sample);
    notify('Örnek JSON şablonu panoya kopyalandı.');
  };

  const handleImportJson = async () => {
    const targetId = selectedTopicId || selectedUnitId;
    if (!targetId) {
      notify('Lütfen önce bir ünite veya konu seçiniz.', 'error');
      return;
    }
    const parsedList = validateAndParseJson(jsonInput);
    if (!parsedList || parsedList.length === 0) {
      notify('Lütfen geçerli bir JSON soru listesi yapıştırınız.', 'error');
      return;
    }

    const formatted: Question[] = parsedList.map((item: any, idx: number) => ({
      id: item.id || `${targetId}-json-q${idx + 1}-${Date.now()}`,
      unitId: selectedUnitId,
      topicId: selectedTopicId || undefined,
      questionNumber: idx + 1,
      questionText: item.questionText,
      options: item.options,
      correctOption: item.correctOption,
      explanation: item.explanation || '',
    }));

    const res = await api.adminUpload20QuestionPackage(targetId, formatted, !!selectedTopicId);
    if (res.success) {
      notify(`Tebrikler! ${res.count} adet soru JSON üzerinden başarıyla yüklendi!`);
      setJsonInput('');
      setJsonValidationResult(null);
      onImportSuccess(targetId);
    } else {
      notify(`İçe aktarma hatası: ${res.error}`, 'error');
    }
  };

  return (
    <div>
      <div style={adminStyles.twoColGrid}>
        {/* Sol: 20 Soruluk Örnek Paket */}
        <div style={adminStyles.sectionCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ ...adminStyles.statIconBox, backgroundColor: '#EEF2FF' }}>
              <PackagePlus size={22} color="#4F46E5" />
            </div>
            <div>
              <h3 style={adminStyles.sectionTitle}>Tek Tıkla 20 Soru Paketi</h3>
              <p style={adminStyles.sectionSub}>Özenle hazırlanmış KPSS GY-GK soru setini yükleyin.</p>
            </div>
          </div>

          <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: '#475569' }}>
            Seçili Konu: <b>{currentTopic?.title || currentUnit?.title || 'Seçilmedi'}</b>
            <br />
            Bu işlem seçili konunun mevcut sorularını sıfırlayarak 20 adet standart KPSS sorusu ekler.
          </div>

          <button onClick={onUploadSample20} style={{ ...adminStyles.primaryBtn, width: '100%', justifyContent: 'center' }}>
            <PackagePlus size={16} style={{ marginRight: '8px' }} />
            20 Soruluk Paketi Bu Konuya Yükle
          </button>
        </div>

        {/* Sağ: JSON Dışa Aktar */}
        <div style={adminStyles.sectionCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ ...adminStyles.statIconBox, backgroundColor: '#F0FDF4' }}>
              <Download size={22} color="#16A34A" />
            </div>
            <div>
              <h3 style={adminStyles.sectionTitle}>Soruları JSON Olarak İndir</h3>
              <p style={adminStyles.sectionSub}>Mevcut sorularınızı yedekleyin veya başka bir alana aktarın.</p>
            </div>
          </div>

          <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: '#475569' }}>
            Seçili alanda <b>{questions.length}</b> soru mevcut. Dosya formatı standart JSON formatında dışa aktarılır.
          </div>

          <button
            onClick={onExportQuestions}
            disabled={questions.length === 0}
            style={{ ...adminStyles.secondaryBtn, width: '100%', justifyContent: 'center', opacity: questions.length === 0 ? 0.5 : 1 }}
          >
            <Download size={16} style={{ marginRight: '8px' }} />
            Mevcut Soruları JSON İndir
          </button>
        </div>
      </div>

      {/* Alt: JSON Yapıştırarak Toplu Yükleme */}
      <div style={{ ...adminStyles.sectionCard, marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={adminStyles.sectionTitle}>Özel JSON Yapıştırarak Toplu Soru Yükleme</h3>
            <p style={adminStyles.sectionSub}>Kendi hazırladığınız JSON soru formatını doğrudan yapıştırıp aktarabilirsiniz.</p>
          </div>
          <button onClick={copySampleJsonTemplate} style={adminStyles.secondaryBtn}>
            <Copy size={14} style={{ marginRight: '6px' }} />
            Örnek Formatı Kopyala
          </button>
        </div>

        <textarea
          rows={8}
          placeholder={`[\n  {\n    "questionText": "Soru metni...",\n    "options": [\n      { "id": "A", "text": "Cevap A" },\n      { "id": "B", "text": "Cevap B" },\n      { "id": "C", "text": "Cevap C" },\n      { "id": "D", "text": "Cevap D" },\n      { "id": "E", "text": "Cevap E" }\n    ],\n    "correctOption": "A",\n    "explanation": "Çözüm açıklaması..."\n  }\n]`}
          value={jsonInput}
          onChange={(e) => handleJsonInputChange(e.target.value)}
          style={{ ...adminStyles.inputField, fontFamily: 'monospace', fontSize: '12px', resize: 'vertical' }}
        />

        {/* Doğrulama Durumu */}
        {jsonValidationResult && (
          <div
            style={{
              marginTop: '10px',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              backgroundColor: jsonValidationResult.valid ? '#ECFDF5' : '#FEF2F2',
              borderColor: jsonValidationResult.valid ? '#A7F3D0' : '#FECACA',
              borderWidth: '1px',
              borderStyle: 'solid',
              color: jsonValidationResult.valid ? '#065F46' : '#991B1B',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {jsonValidationResult.valid ? (
              <>
                <CheckCircle size={16} style={{ marginRight: '8px' }} />
                Format Geçerli: Toplam <b>{jsonValidationResult.count}</b> soru tespit edildi.
              </>
            ) : (
              <>
                <AlertCircle size={16} style={{ marginRight: '8px' }} />
                {jsonValidationResult.error}
              </>
            )}
          </div>
        )}

        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleImportJson}
            disabled={!jsonValidationResult?.valid}
            style={{
              ...adminStyles.primaryBtn,
              opacity: jsonValidationResult?.valid ? 1 : 0.5,
              cursor: jsonValidationResult?.valid ? 'pointer' : 'not-allowed',
            }}
          >
            <Upload size={16} style={{ marginRight: '8px' }} />
            Soruları Sisteme Yükle
          </button>
        </div>
      </div>
    </div>
  );
};
