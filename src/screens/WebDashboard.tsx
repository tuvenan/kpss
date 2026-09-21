import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function WebDashboard() {
  const { width } = useWindowDimensions();
  const isMobile = width < 840;
  const isSmallMobile = width < 520;

  return (
    <View style={[styles.container, isMobile && styles.containerMobile]}>
      
      {/* 1. SOL KENAR ÇUBUĞU (SIDEBAR) - Yalnızca masaüstünde görünür */}
      {!isMobile && (
        <View style={styles.sidebar}>
        <View>
          <View style={styles.logoRow}>
            <Ionicons name="book-outline" size={24} color="#111" style={{ marginRight: 10 }} />
            <View>
              <Text style={styles.logoText}>KPSS</Text>
              <Text style={styles.logoSubText}>Hedefine Odaklan</Text>
            </View>
          </View>

          <View style={styles.menuList}>
            <TouchableOpacity style={[styles.menuItem, styles.menuItemActive]}>
              <Ionicons name="home-outline" size={18} color="#111" style={styles.menuIcon} />
              <Text style={[styles.menuText, styles.menuTextActive]}>Ana Sayfa</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="book-outline" size={18} color="#666" style={styles.menuIcon} />
              <Text style={styles.menuText}>Dersler</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="alert-circle-outline" size={18} color="#666" style={styles.menuIcon} />
              <Text style={styles.menuText}>Hatalarım</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="person-outline" size={18} color="#666" style={styles.menuIcon} />
              <Text style={styles.menuText}>Profil</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sol Alt Motivasyon Alanı */}
        <View style={styles.sidebarFooter}>
          <Text style={styles.quoteBig}>66</Text>
          <Text style={styles.quoteText}>Küçük adımlar büyük hedeflere götürür.</Text>
          <Text style={styles.quoteAuthor}>Başarı seninle.</Text>
        </View>
      </View>
      )}

      {/* 2. ANA İÇERİK ALANI */}
      <View style={styles.mainContent}>
        
        {/* Üst Bar (Header) */}
        <View style={[styles.header, isMobile && styles.headerMobile]}>
          <View style={[styles.searchContainer, isMobile && styles.searchContainerMobile]}>
            <Ionicons name="search-outline" size={18} color="#888" style={{ marginRight: 8 }} />
            <TextInput 
              placeholder="Ders, ünite veya konu ara..." 
              placeholderTextColor="#888"
              style={styles.searchInput}
            />
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerIconBtn}>
              <Ionicons name="notifications-outline" size={18} color="#333" />
            </TouchableOpacity>
            <View style={styles.userProfileBadge}>
              <Ionicons name="person" size={14} color="#333" style={{ marginRight: 6 }} />
              <Text style={styles.userNameText}>Ali</Text>
              <Ionicons name="chevron-down" size={14} color="#666" style={{ marginLeft: 4 }} />
            </View>
          </View>
        </View>

        {/* İçerik Grid / Scroll Alanı */}
        <ScrollView
          contentContainerStyle={[styles.scrollBody, isMobile && styles.scrollBodyMobile]}
          showsVerticalScrollIndicator={false}
        >
          
          {/* Sol Kolon (Ana Akış) */}
          <View style={[styles.leftColumn, isMobile && styles.leftColumnMobile]}>
            
            {/* Karşılama ve Günlük İlerleme */}
            <View style={[styles.welcomeSection, isSmallMobile && styles.welcomeSectionMobile]}>
              <View>
                <Text style={styles.welcomeTitle}>Merhaba, Ali</Text>
                <Text style={styles.welcomeSub}>Bugün ne çalışalım?</Text>
              </View>
              <View style={styles.dateBadge}>
                <Ionicons name="calendar-outline" size={16} color="#555" style={{ marginRight: 6 }} />
                <Text style={styles.dateText}>24 Eylül 2025, Çarşamba</Text>
              </View>
            </View>

            {/* Günlük Hedef Kartı */}
            <View style={styles.goalCard}>
              <View style={styles.goalHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={styles.goalTargetIconBox}>
                    <Ionicons name="radio-button-on-outline" size={16} color="#111" />
                  </View>
                  <Text style={styles.goalCardTitle}>Günlük İlerleme</Text>
                </View>
                <Text style={styles.goalTargetText}>Hedef: 60 soru</Text>
              </View>
              <Text style={styles.goalBigNumbers}>
                42 <Text style={styles.goalTotalDim}>/ 60 soru</Text>
              </Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: '70%' }]} />
              </View>
              <Text style={styles.goalFooterInfo}>42 soru çözüldü</Text>
            </View>

            {/* Dersler Bölümü (Grid) */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Dersler</Text>
              <TouchableOpacity><Text style={styles.seeAllText}>Tümünü Gör →</Text></TouchableOpacity>
            </View>

            <Text style={styles.categorySubHeading}>KPSS Genel Yetenek</Text>
            <View style={[styles.gridRow, isSmallMobile && styles.gridRowMobile]}>
              <View style={styles.gridCard}>
                <View style={styles.cardIconBox}><Ionicons name="book-outline" size={18} color="#111" /></View>
                <View style={{ flex: 1 }}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardSubjectTitle}>Türkçe</Text>
                    <Ionicons name="chevron-forward" size={16} color="#666" />
                  </View>
                  <Text style={styles.cardSubInfo}>12 / 20 ünite</Text>
                  <View style={styles.miniBarBg}><View style={[styles.miniBarFill, { width: '58%' }]} /></View>
                </View>
                <Text style={styles.percentLabel}>%58</Text>
              </View>

              <View style={styles.gridCard}>
                <View style={styles.cardIconBox}><Ionicons name="calculator-outline" size={18} color="#111" /></View>
                <View style={{ flex: 1 }}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardSubjectTitle}>Matematik</Text>
                    <Ionicons name="chevron-forward" size={16} color="#666" />
                  </View>
                  <Text style={styles.cardSubInfo}>8 / 20 ünite</Text>
                  <View style={styles.miniBarBg}><View style={[styles.miniBarFill, { width: '42%' }]} /></View>
                </View>
                <Text style={styles.percentLabel}>%42</Text>
              </View>
            </View>

            <Text style={[styles.categorySubHeading, { marginTop: 16 }]}>KPSS Genel Kültür</Text>
            <View style={[styles.gridRow, isSmallMobile && styles.gridRowMobile]}>
              <View style={styles.gridCard}>
                <View style={styles.cardIconBox}><Ionicons name={"landmark-outline" as any} size={18} color="#111" /></View>
                <View style={{ flex: 1 }}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardSubjectTitle}>Tarih</Text>
                    <Ionicons name="chevron-forward" size={16} color="#666" />
                  </View>
                  <Text style={styles.cardSubInfo}>5 / 20 ünite</Text>
                  <View style={styles.miniBarBg}><View style={[styles.miniBarFill, { width: '71%' }]} /></View>
                </View>
                <Text style={styles.percentLabel}>%71</Text>
              </View>

              <View style={styles.gridCard}>
                <View style={styles.cardIconBox}><Ionicons name="earth-outline" size={18} color="#111" /></View>
                <View style={{ flex: 1 }}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardSubjectTitle}>Coğrafya</Text>
                    <Ionicons name="chevron-forward" size={16} color="#666" />
                  </View>
                  <Text style={styles.cardSubInfo}>0 / 20 ünite</Text>
                  <View style={styles.miniBarBg}><View style={[styles.miniBarFill, { width: '0%' }]} /></View>
                </View>
                <Text style={styles.percentLabel}>%0</Text>
              </View>
            </View>

            <View style={[styles.gridRow, isSmallMobile && styles.gridRowMobile]}>
              <View style={styles.gridCard}>
                <View style={styles.cardIconBox}><Ionicons name="people-outline" size={18} color="#111" /></View>
                <View style={{ flex: 1 }}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardSubjectTitle}>Vatandaşlık</Text>
                    <Ionicons name="chevron-forward" size={16} color="#666" />
                  </View>
                  <Text style={styles.cardSubInfo}>8 / 20 ünite</Text>
                  <View style={styles.miniBarBg}><View style={[styles.miniBarFill, { width: '38%' }]} /></View>
                </View>
                <Text style={styles.percentLabel}>%38</Text>
              </View>

              <View style={styles.gridCard}>
                <View style={styles.cardIconBox}><Ionicons name="newspaper-outline" size={18} color="#111" /></View>
                <View style={{ flex: 1 }}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardSubjectTitle}>Güncel Bilgiler</Text>
                    <Ionicons name="chevron-forward" size={16} color="#666" />
                  </View>
                  <Text style={styles.cardSubInfo}>6 / 20 ünite</Text>
                  <View style={styles.miniBarBg}><View style={[styles.miniBarFill, { width: '25%' }]} /></View>
                </View>
                <Text style={styles.percentLabel}>%25</Text>
              </View>
            </View>

            {/* Hızlı Erişim */}
            <Text style={styles.quickAccessHeading}>Hızlı Erişim</Text>
            <View style={[styles.quickAccessRow, isMobile && styles.quickAccessRowMobile]}>
              <TouchableOpacity style={[styles.quickAccessCard, isMobile && styles.quickAccessCardMobile]}>
                <View style={styles.quickAccessIconBox}>
                  <Ionicons name="play" size={16} color="#111" />
                </View>
                <View>
                  <Text style={styles.quickAccessTitle}>Soru Çöz</Text>
                  <Text style={styles.quickAccessSub}>Teste başla</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.quickAccessCard, isMobile && styles.quickAccessCardMobile]}>
                <View style={styles.quickAccessIconBox}>
                  <Ionicons name="document-text-outline" size={16} color="#111" />
                </View>
                <View>
                  <Text style={styles.quickAccessTitle}>Hata Havuzu</Text>
                  <Text style={styles.quickAccessSub}>Yanlışlarını tekrar et</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.quickAccessCard, isMobile && styles.quickAccessCardMobile]}>
                <View style={styles.quickAccessIconBox}>
                  <Ionicons name="book-outline" size={16} color="#111" />
                </View>
                <View>
                  <Text style={styles.quickAccessTitle}>Dersler</Text>
                  <Text style={styles.quickAccessSub}>Tüm derslere göz at</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.quickAccessCard, isMobile && styles.quickAccessCardMobile]}>
                <View style={styles.quickAccessIconBox}>
                  <Ionicons name="person-outline" size={16} color="#111" />
                </View>
                <View>
                  <Text style={styles.quickAccessTitle}>Profil</Text>
                  <Text style={styles.quickAccessSub}>İstatistiklerini gör</Text>
                </View>
              </TouchableOpacity>
            </View>

          </View>

          {/* Sağ Kolon (Çalışma Planı & İstatistikler) */}
          <View style={[styles.rightColumn, isMobile && styles.rightColumnMobile]}>
            
            {/* Bugünün Çalışma Planı */}
            <View style={styles.rightWidget}>
              <View style={styles.widgetHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="calendar-outline" size={18} color="#111" style={{ marginRight: 8 }} />
                  <Text style={styles.widgetTitle}>Bugünün Çalışma Planı</Text>
                </View>
                <TouchableOpacity><Text style={styles.editText}>Düzenle</Text></TouchableOpacity>
              </View>

              <View style={styles.planItem}>
                <Text style={styles.planNumber}>01</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.planSubject}>Tarih — İslamiyet Öncesi Türk Tarihi</Text>
                  <Text style={styles.planDetail}>20 soru</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#666" />
              </View>

              <View style={styles.planItem}>
                <Text style={styles.planNumber}>02</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.planSubject}>Türkçe — Sözcükte Anlam</Text>
                  <Text style={styles.planDetail}>20 soru</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#666" />
              </View>

              <View style={styles.planItem}>
                <Text style={styles.planNumber}>03</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.planSubject}>Matematik — Problemler</Text>
                  <Text style={styles.planDetail}>20 soru</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#666" />
              </View>

              <View style={styles.planItem}>
                <Text style={styles.planNumber}>04</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.planSubject}>Coğrafya — Türkiye Fiziki Yapısı</Text>
                  <Text style={styles.planDetail}>20 soru</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#666" />
              </View>

              <TouchableOpacity style={styles.startPlanButton}>
                <Text style={styles.startPlanButtonText}>Çalışmaya Başla</Text>
              </TouchableOpacity>
            </View>

            {/* Sonuçlarım İstatistik Kutusu */}
            <View style={styles.rightWidget}>
              <View style={styles.widgetHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="bar-chart-outline" size={18} color="#111" style={{ marginRight: 8 }} />
                  <Text style={styles.widgetTitle}>Sonuçlarım</Text>
                </View>
                <TouchableOpacity><Text style={styles.seeAllText}>Tümünü Gör →</Text></TouchableOpacity>
              </View>

              <View style={[styles.statsHorizontalRow, isSmallMobile && styles.statsHorizontalRowMobile]}>
                <View style={[styles.statBoxHorizontal, isSmallMobile && styles.statBoxHorizontalMobile]}>
                  <Text style={styles.statBoxLabel}>Toplam Soru</Text>
                  <Text style={styles.statBoxVal}>1.240</Text>
                </View>
                <View style={[styles.statBoxHorizontal, isSmallMobile && styles.statBoxHorizontalMobile]}>
                  <Text style={styles.statBoxLabel}>Doğru</Text>
                  <Text style={[styles.statBoxVal, { color: '#16A34A' }]}>982</Text>
                </View>
                <View style={[styles.statBoxHorizontal, isSmallMobile && styles.statBoxHorizontalMobile]}>
                  <Text style={styles.statBoxLabel}>Yanlış</Text>
                  <Text style={[styles.statBoxVal, { color: '#DC2626' }]}>258</Text>
                </View>
                <View style={[styles.statBoxHorizontal, isSmallMobile && styles.statBoxHorizontalMobile]}>
                  <Text style={styles.statBoxLabel}>Başarı Oranı</Text>
                  <Text style={styles.statBoxVal}>%79</Text>
                </View>
              </View>
            </View>

            {/* Hata Havuzu Kartı */}
            <View style={styles.rightWidget}>
              <View style={styles.widgetHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="warning-outline" size={18} color="#111" style={{ marginRight: 8 }} />
                  <Text style={styles.widgetTitle}>Hata Havuzu</Text>
                </View>
                <TouchableOpacity><Text style={styles.seeAllText}>Tümünü Gör →</Text></TouchableOpacity>
              </View>
              <Text style={styles.errorSubCount}>4 hata sorusu</Text>

              <View style={styles.errorMiniList}>
                <TouchableOpacity style={styles.errorMiniCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.errorMiniSubject}>Tarih — İslamiyet Öncesi</Text>
                    <Text style={styles.errorMiniNum}>Soru 07</Text>
                  </View>
                  <View style={styles.errorRedBadge}>
                    <Text style={styles.errorRedBadgeText}>Yanlış</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#666" style={{ marginLeft: 6 }} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.errorMiniCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.errorMiniSubject}>Türkçe — Sözcükte Anlam</Text>
                    <Text style={styles.errorMiniNum}>Soru 13</Text>
                  </View>
                  <View style={styles.errorRedBadge}>
                    <Text style={styles.errorRedBadgeText}>Yanlış</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#666" style={{ marginLeft: 6 }} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.errorMiniCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.errorMiniSubject}>Matematik — Problemler</Text>
                    <Text style={styles.errorMiniNum}>Soru 05</Text>
                  </View>
                  <View style={styles.errorRedBadge}>
                    <Text style={styles.errorRedBadgeText}>Yanlış</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#666" style={{ marginLeft: 6 }} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.errorMiniCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.errorMiniSubject}>Coğrafya — Türkiye'nin Fiziki Yapısı</Text>
                    <Text style={styles.errorMiniNum}>Soru 11</Text>
                  </View>
                  <View style={styles.errorRedBadge}>
                    <Text style={styles.errorRedBadgeText}>Yanlış</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#666" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </View>
            </View>

          </View>

        </ScrollView>
      </View>

      {/* 3. MOBİL ALT SEKME ÇUBUĞU */}
      {isMobile && (
        <View style={styles.mobileBottomNav}>
          <TouchableOpacity style={styles.mobileBottomNavItem} activeOpacity={0.7}>
            <Ionicons name="home" size={20} color="#111" />
            <Text style={[styles.mobileBottomNavText, styles.mobileBottomNavTextActive]}>Ana Sayfa</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mobileBottomNavItem} activeOpacity={0.7}>
            <Ionicons name="book-outline" size={20} color="#888" />
            <Text style={styles.mobileBottomNavText}>Dersler</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mobileBottomNavItem} activeOpacity={0.7}>
            <Ionicons name="alert-circle-outline" size={20} color="#888" />
            <Text style={styles.mobileBottomNavText}>Hatalarım</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mobileBottomNavItem} activeOpacity={0.7}>
            <Ionicons name="person-outline" size={20} color="#888" />
            <Text style={styles.mobileBottomNavText}>Profil</Text>
          </TouchableOpacity>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F9F9FB',
  },
  sidebar: {
    width: 260,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#EFEFF2',
    padding: 24,
    justifyContent: 'space-between',
  },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111',
  },
  logoSubText: {
    fontSize: 12,
    color: '#777',
    marginBottom: 32,
  },
  menuList: {
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  menuItemActive: {
    backgroundColor: '#F2F2F5',
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  menuTextActive: {
    color: '#111',
    fontWeight: '600',
  },
  sidebarFooter: {
    backgroundColor: '#F9F9FB',
    padding: 16,
    borderRadius: 12,
  },
  quoteBig: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 4,
  },
  quoteText: {
    fontSize: 12,
    color: '#444',
    marginBottom: 4,
  },
  quoteAuthor: {
    fontSize: 11,
    color: '#888',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#F9F9FB',
  },
  header: {
    height: 70,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFF2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    width: 320,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F2F2F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userProfileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F5',
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 10,
  },
  userNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  scrollBody: {
    padding: 30,
    flexDirection: 'row',
    gap: 30,
  },
  leftColumn: {
    flex: 1.4,
  },
  rightColumn: {
    flex: 1,
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 4,
  },
  welcomeSub: {
    fontSize: 15,
    color: '#666',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EFEFF2',
  },
  dateText: {
    fontSize: 13,
    color: '#444',
    fontWeight: '500',
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#EFEFF2',
  },
  goalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  goalCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  goalTargetText: {
    fontSize: 13,
    color: '#777',
  },
  goalBigNumbers: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 14,
  },
  goalTotalDim: {
    fontSize: 16,
    fontWeight: 'normal',
    color: '#777',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#EFEFF2',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#111',
    borderRadius: 4,
  },
  goalFooterInfo: {
    fontSize: 12,
    color: '#666',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
  },
  seeAllText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  categorySubHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  gridCard: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEFF2',
  },
  cardIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F2F2F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  cardSubjectTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  cardSubInfo: {
    fontSize: 12,
    color: '#777',
    marginBottom: 8,
  },
  miniBarBg: {
    height: 4,
    backgroundColor: '#EFEFF2',
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    backgroundColor: '#111',
    borderRadius: 2,
  },
  percentLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginLeft: 12,
  },
  rightWidget: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EFEFF2',
  },
  widgetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  widgetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
  },
  editText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  planItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9FB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EFEFF2',
  },
  planNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111',
    backgroundColor: '#EFEFF2',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  planSubject: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111',
    marginBottom: 2,
  },
  planDetail: {
    fontSize: 11,
    color: '#777',
  },
  startPlanButton: {
    backgroundColor: '#111',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  startPlanButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F9F9FB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFEFF2',
  },
  statBoxLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statBoxVal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  goalTargetIconBox: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: '#F2F2F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  quickAccessHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
    marginTop: 20,
    marginBottom: 12,
  },
  quickAccessRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  quickAccessCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EFEFF2',
  },
  quickAccessIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F2F2F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  quickAccessTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111',
  },
  quickAccessSub: {
    fontSize: 10,
    color: '#777',
    marginTop: 1,
  },
  statsHorizontalRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBoxHorizontal: {
    flex: 1,
    backgroundColor: '#F9F9FB',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EFEFF2',
    alignItems: 'center',
  },
  errorSubCount: {
    fontSize: 12,
    color: '#777',
    marginBottom: 12,
    marginTop: -8,
  },
  errorMiniList: {
    gap: 8,
  },
  errorMiniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F9F9FB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EFEFF2',
  },
  errorMiniSubject: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111',
  },
  errorMiniNum: {
    fontSize: 11,
    color: '#777',
    marginTop: 2,
  },
  errorRedBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  errorRedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
  },
  containerMobile: {
    flexDirection: 'column',
  },
  headerMobile: {
    paddingHorizontal: 16,
    height: 60,
  },
  searchContainerMobile: {
    width: 'auto',
    flex: 1,
    marginRight: 10,
  },
  scrollBodyMobile: {
    flexDirection: 'column',
    padding: 16,
    gap: 20,
    paddingBottom: 90,
  },
  leftColumnMobile: {
    flex: 0,
    width: '100%',
  },
  rightColumnMobile: {
    flex: 0,
    width: '100%',
  },
  welcomeSectionMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 10,
  },
  gridRowMobile: {
    flexDirection: 'column',
  },
  quickAccessRowMobile: {
    flexWrap: 'wrap',
  },
  quickAccessCardMobile: {
    minWidth: '47%',
  },
  statsHorizontalRowMobile: {
    flexWrap: 'wrap',
  },
  statBoxHorizontalMobile: {
    minWidth: '47%',
    marginBottom: 8,
  },
  mobileBottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EFEFF2',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 4,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  mobileBottomNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  mobileBottomNavText: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
    fontWeight: '500',
  },
  mobileBottomNavTextActive: {
    color: '#111',
    fontWeight: '600',
  },
});
