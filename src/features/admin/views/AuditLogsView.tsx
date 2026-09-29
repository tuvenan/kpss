import React, { useState, useEffect } from 'react';
import { rbacService, AuditLogEntry } from '../../../services/rbacService';
import { ShieldAlert, RefreshCw, Filter, Search, Terminal } from 'lucide-react';

interface AuditLogsViewProps {
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ notify }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterAction, setFilterAction] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await rbacService.getAuditLogs(100);
      setLogs(data);
    } catch (err: any) {
      notify('Denetim kayıtları yüklenemedi: ' + (err?.message || 'Bilinmeyen hata'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (filterAction !== 'all' && log.action !== filterAction) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const actionMatch = log.action.toLowerCase().includes(q);
    const actorMatch = (log.actor_id || '').toLowerCase().includes(q);
    const targetMatch = (log.target_user_id || '').toLowerCase().includes(q);
    const detailsMatch = JSON.stringify(log.details || {}).toLowerCase().includes(q);
    return actionMatch || actorMatch || targetMatch || detailsMatch;
  });

  const uniqueActions = Array.from(new Set(logs.map((l) => l.action)));

  return (
    <div style={{ fontFamily: "var(--kpss-font, 'Plus Jakarta Sans', sans-serif)" }}>
      {/* Üst Başlık & Filtreler */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <Search size={16} color="#64748B" style={{ position: 'absolute', left: '12px', top: '10px' }} />
            <input
              type="text"
              placeholder="Kayıtlarda ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                border: '1px solid var(--kpss-border, #E2E8F0)',
                backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
                fontSize: '13px',
                color: 'var(--kpss-text, #0F172A)',
                outline: 'none',
              }}
            />
          </div>

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--kpss-border, #E2E8F0)',
              backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
              fontSize: '13px',
              color: 'var(--kpss-text, #0F172A)',
              outline: 'none',
            }}
          >
            <option value="all">Tüm Eylemler ({uniqueActions.length})</option>
            {uniqueActions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>

          <button
            onClick={loadLogs}
            disabled={loading}
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
              border: '1px solid var(--kpss-border, #E2E8F0)',
              borderRadius: '8px',
              color: 'var(--kpss-text, #0F172A)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Yenile
          </button>
        </div>

        <div style={{ fontSize: '13px', color: '#64748B' }}>
          Toplam <strong>{logs.length}</strong> güvenlik denetim kaydı (Salt Okunur)
        </div>
      </div>

      {/* Kayıt Tablosu */}
      <div
        style={{
          backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
          border: '1px solid var(--kpss-border, #E2E8F0)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)', borderBottom: '1px solid var(--kpss-border, #E2E8F0)' }}>
              <th style={{ padding: '12px 16px', fontWeight: 700 }}>Zaman (UTC/Yerel)</th>
              <th style={{ padding: '12px 16px', fontWeight: 700 }}>Eylem</th>
              <th style={{ padding: '12px 16px', fontWeight: 700 }}>Uygulayan (Actor)</th>
              <th style={{ padding: '12px 16px', fontWeight: 700 }}>Hedef (Target)</th>
              <th style={{ padding: '12px 16px', fontWeight: 700 }}>Ayrıntılar</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: '#64748B' }}>
                  {loading ? 'Kayıtlar yükleniyor...' : 'Henüz denetim kaydı bulunamadı.'}
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--kpss-border, #E2E8F0)' }}>
                  <td style={{ padding: '12px 16px', color: '#64748B', whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleString('tr-TR')}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor:
                          log.action.includes('suspend') || log.action.includes('remove')
                            ? '#FEE2E2'
                            : log.action.includes('assign') || log.action.includes('publish')
                            ? '#DCFCE7'
                            : 'var(--kpss-subtle-bg, #F1F5F9)',
                        color:
                          log.action.includes('suspend') || log.action.includes('remove')
                            ? '#991B1B'
                            : log.action.includes('assign') || log.action.includes('publish')
                            ? '#166534'
                            : 'var(--kpss-text, #0F172A)',
                        border: '1px solid var(--kpss-border, #E2E8F0)',
                      }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '11px', color: '#64748B' }}>
                    {log.actor_id ? log.actor_id.slice(0, 8) + '...' : 'Sistem'}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '11px', color: '#64748B' }}>
                    {log.target_user_id ? log.target_user_id.slice(0, 8) + '...' : '-'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <pre
                      style={{
                        margin: 0,
                        padding: '4px 8px',
                        backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        color: 'var(--kpss-text, #0F172A)',
                        maxWidth: '380px',
                        overflowX: 'auto',
                      }}
                    >
                      {JSON.stringify(log.details)}
                    </pre>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
