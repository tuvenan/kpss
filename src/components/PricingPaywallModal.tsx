import React, { useState } from 'react';
import { subscriptionService, SubscriptionTier } from '../services/subscriptionService';
import { X, Check, ShieldCheck, Zap, Sparkles, CreditCard, Lock, Award, Star } from 'lucide-react';

interface PricingPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PricingPaywallModal: React.FC<PricingPaywallModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionTier>('pro_annual');
  const [showCheckout, setShowCheckout] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Sahte kart bilgileri
  const [cardNumber, setCardNumber] = useState('4543 •••• •••• 9210');
  const [cardHolder, setCardHolder] = useState('ALİ KAYA');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('892');

  if (!isOpen) return null;

  const handleStartCheckout = () => {
    setShowCheckout(true);
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      subscriptionService.upgradeToPlan(selectedPlan);
      setIsProcessing(false);
      setIsSuccess(true);

      setTimeout(() => {
        setIsSuccess(false);
        setShowCheckout(false);
        if (onSuccess) onSuccess();
        onClose();
      }, 1200);
    }, 900);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.backdrop} onClick={onClose} />

      <div style={styles.modalCard}>
        <button type="button" onClick={onClose} style={styles.closeBtn} title="Kapat">
          <X size={18} color="#64748B" />
        </button>

        {!showCheckout ? (
          <div>
            {/* Üst Rozet & Başlık */}
            <div style={styles.headerArea}>
              <div style={styles.badgePill}>
                <Sparkles size={14} color="#F59E0B" />
                <span>KPSS DERECE PAKETİ</span>
              </div>
              <h2 style={styles.title}>Hedeflediğin Puanı Şansa Bırakma</h2>
              <p style={styles.subtitle}>
                120 soruluk resmi ÖSYM formatlı denemeler, yapay zeka destekli aralıklı tekrar ve sınırsız soru bankaları ile rakiplerinin önüne geç.
              </p>
            </div>

            {/* Fiyatlandırma Kartları */}
            <div style={styles.plansContainer}>
              {/* Yıllık VIP Plan */}
              <div
                onClick={() => setSelectedPlan('pro_annual')}
                style={{
                  ...styles.planCard,
                  borderColor: selectedPlan === 'pro_annual' ? '#4F46E5' : '#E2E8F0',
                  backgroundColor: selectedPlan === 'pro_annual' ? '#F5F3FF' : '#FFFFFF',
                  boxShadow: selectedPlan === 'pro_annual' ? '0 8px 24px rgba(79, 70, 229, 0.15)' : 'none',
                }}
              >
                <div style={styles.popularTag}>EN ÇOK TERCİH EDİLEN • %45 TASARRUF</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <div style={styles.planName}>KPSS 2026 Yıllık VIP</div>
                    <div style={styles.planPeriod}>Sınava kadar 12 ay boyunca sınırsız erişim</div>
                  </div>
                  <div style={styles.radioIndicator}>
                    {selectedPlan === 'pro_annual' && <div style={styles.radioInner} />}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
                  <span style={styles.priceMain}>₺999</span>
                  <span style={styles.priceSub}>/ yıllık</span>
                  <span style={styles.priceNote}>(Aylık sadece ₺83)</span>
                </div>
              </div>

              {/* Aylık Plan */}
              <div
                onClick={() => setSelectedPlan('pro_monthly')}
                style={{
                  ...styles.planCard,
                  borderColor: selectedPlan === 'pro_monthly' ? '#4F46E5' : '#E2E8F0',
                  backgroundColor: selectedPlan === 'pro_monthly' ? '#F5F3FF' : '#FFFFFF',
                  boxShadow: selectedPlan === 'pro_monthly' ? '0 8px 24px rgba(79, 70, 229, 0.15)' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <div>
                    <div style={styles.planName}>Aylık Esnek Paket</div>
                    <div style={styles.planPeriod}>İstediğin an iptal edilebilir</div>
                  </div>
                  <div style={styles.radioIndicator}>
                    {selectedPlan === 'pro_monthly' && <div style={styles.radioInner} />}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
                  <span style={styles.priceMain}>₺149</span>
                  <span style={styles.priceSub}>/ aylık</span>
                </div>
              </div>
            </div>

            {/* Özellikler Listesi */}
            <div style={styles.featuresList}>
              <div style={styles.featureItem}>
                <div style={styles.checkIconBox}>
                  <Check size={14} color="#16A34A" strokeWidth={3} />
                </div>
                <span><strong>120 Soruluk Tam GY-GK Denemeleri:</strong> 130 dakikalık gerçek ÖSYM sınav simülasyonu</span>
              </div>
              <div style={styles.featureItem}>
                <div style={styles.checkIconBox}>
                  <Check size={14} color="#16A34A" strokeWidth={3} />
                </div>
                <span><strong>Aralıklı Tekrar (Leitner) Sistemi:</strong> Yanlış çözdüğün soruları unutmadan kalıcı hafızaya aktarma</span>
              </div>
              <div style={styles.featureItem}>
                <div style={styles.checkIconBox}>
                  <Check size={14} color="#16A34A" strokeWidth={3} />
                </div>
                <span><strong>Soru Bankaları & Ayrıntılı Çözümler:</strong> Tüm konularda binlerce güncel soru ve videolu/metin açıklamalar</span>
              </div>
              <div style={styles.featureItem}>
                <div style={styles.checkIconBox}>
                  <Check size={14} color="#16A34A" strokeWidth={3} />
                </div>
                <span><strong>Çevrimdışı Kullanım:</strong> İnternet olmadan da kesintisiz test çözebilme</span>
              </div>
            </div>

            {/* İlerle Butonu */}
            <button
              type="button"
              onClick={handleStartCheckout}
              style={styles.actionBtn}
            >
              <Zap size={18} />
              <span>Hemen Premium'a Yükselt</span>
            </button>

            <div style={styles.secureNote}>
              <ShieldCheck size={16} color="#10B981" />
              <span>256-Bit SSL Korumalı Güvenli Ödeme • 14 Gün İade Garantisi</span>
            </div>
          </div>
        ) : (
          <div>
            {/* Ödeme Formu */}
            <div style={styles.headerArea}>
              <div style={styles.badgePill}>
                <Lock size={14} color="#10B981" />
                <span>GÜVENLİ ÖDEME</span>
              </div>
              <h2 style={styles.title}>Ödeme Bilgileri</h2>
              <p style={styles.subtitle}>
                Seçilen Paket: <strong>{selectedPlan === 'pro_annual' ? 'KPSS Yıllık VIP (₺999)' : 'Aylık PRO (₺149)'}</strong>
              </p>
            </div>

            {isSuccess ? (
              <div style={{ textAlign: 'center', padding: '36px 16px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '30px', backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Check size={32} color="#16A34A" strokeWidth={3} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>Ödeme Başarılı!</h3>
                <p style={{ fontSize: '13px', color: '#4B5563', margin: 0 }}>PRO üyeliğiniz anında aktifleştirildi. İyi çalışmalar!</p>
              </div>
            ) : (
              <form onSubmit={handleProcessPayment} style={styles.checkoutForm}>
                <div style={styles.checkoutField}>
                  <label style={styles.checkoutLabel}>Kart Üzerindeki İsim</label>
                  <input
                    type="text"
                    required
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    style={styles.checkoutInput}
                  />
                </div>

                <div style={styles.checkoutField}>
                  <label style={styles.checkoutLabel}>Kart Numarası</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <CreditCard size={18} color="#94A3B8" style={{ position: 'absolute', left: '12px' }} />
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      style={{ ...styles.checkoutInput, paddingLeft: '38px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={styles.checkoutField}>
                    <label style={styles.checkoutLabel}>Son Kullanma</label>
                    <input
                      type="text"
                      required
                      placeholder="AA/YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      style={styles.checkoutInput}
                    />
                  </div>
                  <div style={styles.checkoutField}>
                    <label style={styles.checkoutLabel}>CVV / Güvenlik</label>
                    <input
                      type="password"
                      required
                      maxLength={3}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      style={styles.checkoutInput}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  style={{
                    ...styles.actionBtn,
                    opacity: isProcessing ? 0.7 : 1,
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Lock size={16} />
                  <span>{isProcessing ? 'Ödeme Doğrulanıyor...' : `₺${selectedPlan === 'pro_annual' ? '999' : '149'} Öde ve Başla`}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCheckout(false)}
                  style={styles.backBtn}
                >
                  ← Paket Seçimine Geri Dön
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
  },
  backdrop: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    backdropFilter: 'blur(5px)',
  },
  modalCard: {
    position: 'relative',
    width: '100%',
    maxWidth: '520px',
    backgroundColor: '#FFFFFF',
    borderRadius: '24px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    padding: '32px',
    zIndex: 2,
    border: '1px solid #E2E8F0',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  closeBtn: {
    position: 'absolute',
    top: '18px',
    right: '18px',
    background: '#F1F5F9',
    border: 'none',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  headerArea: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  badgePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#FEF3C7',
    color: '#B45309',
    padding: '4px 12px',
    borderRadius: '9999px',
    fontSize: '11px',
    fontWeight: 700,
    marginBottom: '8px',
  },
  title: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#0F172A',
    margin: '0 0 6px 0',
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748B',
    margin: 0,
    lineHeight: 1.5,
  },
  plansContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px',
  },
  planCard: {
    position: 'relative',
    padding: '16px 20px',
    borderRadius: '16px',
    borderWidth: '2px',
    borderStyle: 'solid',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  popularTag: {
    position: 'absolute',
    top: '-11px',
    left: '18px',
    backgroundColor: '#4F46E5',
    color: '#FFFFFF',
    fontSize: '10px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '6px',
    letterSpacing: '0.3px',
  },
  planName: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#0F172A',
  },
  planPeriod: {
    fontSize: '12px',
    color: '#64748B',
    marginTop: '2px',
  },
  radioIndicator: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    border: '2px solid #CBD5E1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: '#4F46E5',
  },
  priceMain: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#0F172A',
  },
  priceSub: {
    fontSize: '13px',
    color: '#64748B',
    fontWeight: 500,
  },
  priceNote: {
    fontSize: '12px',
    color: '#16A34A',
    fontWeight: 600,
  },
  featuresList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#F8FAFC',
    borderRadius: '14px',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    fontSize: '12px',
    color: '#334155',
    lineHeight: 1.4,
  },
  checkIconBox: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    backgroundColor: '#DCFCE7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '1px',
  },
  actionBtn: {
    width: '100%',
    height: '48px',
    backgroundColor: '#111827',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '14px',
    fontSize: '15px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.2)',
    transition: 'all 0.15s ease',
  },
  secureNote: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    marginTop: '14px',
    fontSize: '11px',
    color: '#64748B',
  },
  checkoutForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  checkoutField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  checkoutLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#334155',
  },
  checkoutInput: {
    width: '100%',
    height: '42px',
    padding: '0 14px',
    borderRadius: '10px',
    border: '1px solid #CBD5E1',
    fontSize: '13px',
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    outline: 'none',
    boxSizing: 'border-box',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#64748B',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    padding: '8px 0',
    textAlign: 'center',
  },
};
