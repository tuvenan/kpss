import React from 'react';
import { AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react';
import { ErrorPoolStats } from '../types';
import { adminStyles } from '../AdminPanel.styles';

interface ErrorPoolViewProps {
  errorPoolStats: ErrorPoolStats | null;
}

export const ErrorPoolView: React.FC<ErrorPoolViewProps> = ({ errorPoolStats }) => {
  return (
    <div>
      <div style={adminStyles.statsGrid}>
        <div style={adminStyles.statCard}>
          <div style={{ ...adminStyles.statIconBox, backgroundColor: '#FEF2F2' }}>
            <AlertTriangle size={22} color="#DC2626" />
          </div>
          <div>
            <div style={adminStyles.statLabel}>Çözülmemiş Hatalı Soru</div>
            <div style={adminStyles.statValue}>{errorPoolStats?.unresolvedCount || 0}</div>
          </div>
        </div>

        <div style={adminStyles.statCard}>
          <div style={{ ...adminStyles.statIconBox, backgroundColor: '#ECFDF5' }}>
            <CheckCircle size={22} color="#16A34A" />
          </div>
          <div>
            <div style={adminStyles.statLabel}>Çözülmüş Hata</div>
            <div style={adminStyles.statValue}>{errorPoolStats?.resolvedCount || 0}</div>
          </div>
        </div>

        <div style={adminStyles.statCard}>
          <div style={{ ...adminStyles.statIconBox, backgroundColor: '#EEF2FF' }}>
            <BarChart3 size={22} color="#4F46E5" />
          </div>
          <div>
            <div style={adminStyles.statLabel}>Hata Havuzu Kaydı</div>
            <div style={adminStyles.statValue}>{errorPoolStats?.list?.length || 0}</div>
          </div>
        </div>
      </div>

      <div style={adminStyles.sectionCard}>
        <h3 style={adminStyles.sectionTitle}>En Çok Hata Yapılan Sorular Listesi</h3>
        <p style={adminStyles.sectionSub}>Öğrencilerin testlerde yanlış cevapladığı soruların dökümü.</p>

        <div style={{ marginTop: '16px' }}>
          {!errorPoolStats?.list || errorPoolStats.list.length === 0 ? (
            <div style={adminStyles.emptyNotice}>Henüz kaydedilmiş hata analizi verisi bulunmuyor.</div>
          ) : (
            <table style={adminStyles.dataTable}>
              <thead>
                <tr>
                  <th style={adminStyles.tableTh}>Soru No / ID</th>
                  <th style={adminStyles.tableTh}>Soru Metni</th>
                  <th style={adminStyles.tableTh}>Hata Sayısı</th>
                  <th style={adminStyles.tableTh}>Durum</th>
                </tr>
              </thead>
              <tbody>
                {errorPoolStats.list.map((item, i) => (
                  <tr key={item.id || i} style={adminStyles.tableTr}>
                    <td style={adminStyles.tableTd}>#{i + 1}</td>
                    <td style={adminStyles.tableTd}>
                      {item.questions?.question_text || item.question_id || 'Soru Metni Yok'}
                    </td>
                    <td style={{ ...adminStyles.tableTd, fontWeight: 700, color: '#DC2626' }}>
                      {item.wrong_count || 1} kez
                    </td>
                    <td style={adminStyles.tableTd}>
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: item.is_resolved ? '#ECFDF5' : '#FEF2F2',
                          color: item.is_resolved ? '#065F46' : '#991B1B',
                        }}
                      >
                        {item.is_resolved ? 'Çözüldü' : 'Bekliyor'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
