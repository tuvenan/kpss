import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { AppText } from '@/components/common/AppText';
import { colors } from '@/theme/colors';
import { dimensions } from '@/theme/dimensions';
import { adminService } from '@/services/adminService';
import { Question, OptionId } from '@/types';
import { MOCK_UNITS } from '@/data/mockQuestions';

export default function AdminQuestionsScreen() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Form State
  const [formUnitId, setFormUnitId] = useState('ilk-turk-devletleri');
  const [formNumber, setFormNumber] = useState('21');
  const [formText, setFormText] = useState('');
  const [formOptionA, setFormOptionA] = useState('');
  const [formOptionB, setFormOptionB] = useState('');
  const [formOptionC, setFormOptionC] = useState('');
  const [formOptionD, setFormOptionD] = useState('');
  const [formOptionE, setFormOptionE] = useState('');
  const [formCorrect, setFormCorrect] = useState<OptionId>('A');
  const [formExplanation, setFormExplanation] = useState('');

  useEffect(() => {
    loadQuestions();
  }, [selectedUnit]);

  const loadQuestions = async () => {
    const list = await adminService.getQuestions({
      unitId: selectedUnit,
      search: search.trim() || undefined,
    });
    setQuestions(list);
  };

  const handleSearch = () => {
    loadQuestions();
  };

  const openAddModal = () => {
    setEditingQuestion(null);
    setFormUnitId('ilk-turk-devletleri');
    setFormNumber(String(questions.length + 1));
    setFormText('');
    setFormOptionA('');
    setFormOptionB('');
    setFormOptionC('');
    setFormOptionD('');
    setFormOptionE('');
    setFormCorrect('A');
    setFormExplanation('');
    setIsModalOpen(true);
  };

  const openEditModal = (q: Question) => {
    setEditingQuestion(q);
    setFormUnitId(q.unitId || '');
    setFormNumber(String(q.questionNumber));
    setFormText(q.questionText);
    setFormOptionA(q.options.find((o) => o.id === 'A')?.text || '');
    setFormOptionB(q.options.find((o) => o.id === 'B')?.text || '');
    setFormOptionC(q.options.find((o) => o.id === 'C')?.text || '');
    setFormOptionD(q.options.find((o) => o.id === 'D')?.text || '');
    setFormOptionE(q.options.find((o) => o.id === 'E')?.text || '');
    setFormCorrect(q.correctOption);
    setFormExplanation(q.explanation);
    setIsModalOpen(true);
  };

  const handleSaveQuestion = async () => {
    if (!formText.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen soru metnini doldurunuz.');
      return;
    }

    const questionData: Question = {
      id: editingQuestion ? editingQuestion.id : `q_${Date.now()}`,
      unitId: formUnitId,
      questionNumber: parseInt(formNumber, 10) || 1,
      questionText: formText.trim(),
      options: [
        { id: 'A', text: formOptionA.trim() },
        { id: 'B', text: formOptionB.trim() },
        { id: 'C', text: formOptionC.trim() },
        { id: 'D', text: formOptionD.trim() },
        { id: 'E', text: formOptionE.trim() },
      ],
      correctOption: formCorrect,
      explanation: formExplanation.trim(),
    };

    if (editingQuestion) {
      await adminService.updateQuestion(editingQuestion.id, questionData);
    } else {
      await adminService.createQuestion(questionData);
    }

    setIsModalOpen(false);
    loadQuestions();
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Soruyu Sil', 'Bu soruyu silmek istediğinize emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await adminService.deleteQuestion(id);
          loadQuestions();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Üst Bar: Başlık + Arama + Yeni Soru Butonu */}
      <View style={styles.topBar}>
        <View>
          <AppText weight="bold" size="xl" color={colors.selected}>
            Soru Bankası Yönetimi ({questions.length} Soru)
          </AppText>
          <AppText weight="regular" size="sm" color={colors.textSecondary}>
            Soruları filtrele, yeni soru ekle veya düzenle
          </AppText>
        </View>

        <Pressable onPress={openAddModal} style={styles.addButton}>
          <AppText weight="bold" size="sm" color="#FFFFFF">
            + Yeni Soru Ekle
          </AppText>
        </Pressable>
      </View>

      {/* Filtre ve Arama Alanı */}
      <View style={styles.filterRow}>
        <View style={styles.searchBox}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            placeholder="Soru metninde ara..."
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />
          <Pressable onPress={handleSearch} style={styles.searchButton}>
            <AppText weight="medium" size="xs" color={colors.selected}>
              Ara
            </AppText>
          </Pressable>
        </View>

        {/* Ünite Seçimi */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitFilterScroll}>
          <Pressable
            onPress={() => setSelectedUnit('all')}
            style={[
              styles.unitFilterChip,
              { backgroundColor: selectedUnit === 'all' ? colors.selected : colors.surface },
            ]}
          >
            <AppText weight="medium" size="xs" color={selectedUnit === 'all' ? '#FFFFFF' : colors.text}>
              Tümü
            </AppText>
          </Pressable>

          {MOCK_UNITS.map((u) => (
            <Pressable
              key={u.id}
              onPress={() => setSelectedUnit(u.id)}
              style={[
                styles.unitFilterChip,
                { backgroundColor: selectedUnit === u.id ? colors.selected : colors.surface },
              ]}
            >
              <AppText weight="medium" size="xs" color={selectedUnit === u.id ? '#FFFFFF' : colors.text}>
                {u.title}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Soru Listesi */}
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {questions.map((q) => (
          <View key={q.id} style={styles.questionCard}>
            <View style={styles.questionCardHeader}>
              <View style={styles.badgeRow}>
                <View style={styles.numberBadge}>
                  <AppText weight="bold" size="xs" color={colors.selected}>
                    Soru {q.questionNumber}
                  </AppText>
                </View>
                <View style={styles.correctBadge}>
                  <AppText weight="bold" size="xs" color={colors.correct}>
                    Doğru Şık: {q.correctOption}
                  </AppText>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <Pressable onPress={() => openEditModal(q)} style={styles.editButton}>
                  <AppText weight="medium" size="xs" color={colors.selected}>
                    Düzenle
                  </AppText>
                </Pressable>
                <Pressable onPress={() => handleDelete(q.id)} style={styles.deleteButton}>
                  <AppText weight="medium" size="xs" color={colors.wrong}>
                    Sil
                  </AppText>
                </Pressable>
              </View>
            </View>

            <AppText weight="medium" size="base" color={colors.text} style={styles.questionText}>
              {q.questionText}
            </AppText>

            {/* Şıklar Özeti */}
            <View style={styles.optionsPreview}>
              {q.options.map((opt) => (
                <AppText
                  key={opt.id}
                  weight={opt.id === q.correctOption ? 'bold' : 'regular'}
                  size="xs"
                  color={opt.id === q.correctOption ? colors.correct : colors.textSecondary}
                >
                  {opt.id}) {opt.text}
                </AppText>
              ))}
            </View>

            {q.explanation && (
              <View style={styles.explanationSnippet}>
                <AppText weight="regular" size="xs" color={colors.textSecondary}>
                  Çözüm: {q.explanation}
                </AppText>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Soru Ekleme / Düzenleme Modal Formu */}
      <Modal visible={isModalOpen} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <AppText weight="bold" size="lg" color={colors.selected}>
                {editingQuestion ? 'Soruyu Düzenle' : 'Yeni KPSS Sorusu Ekle'}
              </AppText>
              <Pressable onPress={() => setIsModalOpen(false)}>
                <AppText weight="bold" size="base" color={colors.textMuted}>
                  ✕
                </AppText>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll}>
              <AppText weight="bold" size="xs" color={colors.textSecondary}>
                SORU METNİ
              </AppText>
              <TextInput
                value={formText}
                onChangeText={setFormText}
                placeholder="ÖSYM / MEB KPSS formatında soru metnini yazın..."
                multiline
                numberOfLines={3}
                style={styles.modalTextArea}
              />

              <AppText weight="bold" size="xs" color={colors.textSecondary} style={{ marginTop: 12 }}>
                ŞIKLAR (A - E)
              </AppText>
              <View style={styles.optionInputRow}>
                <AppText weight="bold" size="sm">A:</AppText>
                <TextInput value={formOptionA} onChangeText={setFormOptionA} style={styles.optionInput} placeholder="A seçeneği" />
              </View>
              <View style={styles.optionInputRow}>
                <AppText weight="bold" size="sm">B:</AppText>
                <TextInput value={formOptionB} onChangeText={setFormOptionB} style={styles.optionInput} placeholder="B seçeneği" />
              </View>
              <View style={styles.optionInputRow}>
                <AppText weight="bold" size="sm">C:</AppText>
                <TextInput value={formOptionC} onChangeText={setFormOptionC} style={styles.optionInput} placeholder="C seçeneği" />
              </View>
              <View style={styles.optionInputRow}>
                <AppText weight="bold" size="sm">D:</AppText>
                <TextInput value={formOptionD} onChangeText={setFormOptionD} style={styles.optionInput} placeholder="D seçeneği" />
              </View>
              <View style={styles.optionInputRow}>
                <AppText weight="bold" size="sm">E:</AppText>
                <TextInput value={formOptionE} onChangeText={setFormOptionE} style={styles.optionInput} placeholder="E seçeneği" />
              </View>

              <AppText weight="bold" size="xs" color={colors.textSecondary} style={{ marginTop: 12 }}>
                DOĞRU ŞIK
              </AppText>
              <View style={styles.correctSelectRow}>
                {(['A', 'B', 'C', 'D', 'E'] as OptionId[]).map((opt) => (
                  <Pressable
                    key={opt}
                    onPress={() => setFormCorrect(opt)}
                    style={[
                      styles.correctChip,
                      {
                        backgroundColor: formCorrect === opt ? colors.correct : colors.background,
                        borderColor: formCorrect === opt ? colors.correct : colors.border,
                      },
                    ]}
                  >
                    <AppText weight="bold" size="sm" color={formCorrect === opt ? '#FFFFFF' : colors.text}>
                      {opt}
                    </AppText>
                  </Pressable>
                ))}
              </View>

              <AppText weight="bold" size="xs" color={colors.textSecondary} style={{ marginTop: 12 }}>
                DETAYLI ÇÖZÜM VE AÇIKLAMA
              </AppText>
              <TextInput
                value={formExplanation}
                onChangeText={setFormExplanation}
                placeholder="Öğrencinin konuyu kavramasını sağlayacak çözüm metni..."
                multiline
                numberOfLines={3}
                style={styles.modalTextArea}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable onPress={() => setIsModalOpen(false)} style={styles.cancelButton}>
                <AppText weight="medium" size="sm" color={colors.text}>Vazgeç</AppText>
              </Pressable>
              <Pressable onPress={handleSaveQuestion} style={styles.saveButton}>
                <AppText weight="bold" size="sm" color="#FFFFFF">Kaydet</AppText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    padding: dimensions.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: dimensions.borderWidth.thin,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  addButton: {
    height: 42,
    paddingHorizontal: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.sm,
    backgroundColor: colors.selected,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterRow: {
    padding: dimensions.spacing.md,
    borderBottomWidth: dimensions.borderWidth.thin,
    borderBottomColor: colors.border,
    gap: dimensions.spacing.sm,
  },
  searchBox: {
    flexDirection: 'row',
    gap: dimensions.spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: colors.surface,
    borderWidth: dimensions.borderWidth.thin,
    borderColor: colors.border,
    borderRadius: dimensions.borderRadius.sm,
    paddingHorizontal: dimensions.spacing.md,
    fontSize: 14,
  },
  searchButton: {
    height: 40,
    paddingHorizontal: dimensions.spacing.md,
    backgroundColor: colors.surface,
    borderWidth: dimensions.borderWidth.thin,
    borderColor: colors.border,
    borderRadius: dimensions.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unitFilterScroll: {
    flexDirection: 'row',
  },
  unitFilterChip: {
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: 6,
    borderRadius: dimensions.borderRadius.sm,
    borderWidth: dimensions.borderWidth.thin,
    borderColor: colors.border,
    marginRight: dimensions.spacing.xs,
  },
  listContent: {
    padding: dimensions.spacing.lg,
    gap: dimensions.spacing.md,
  },
  questionCard: {
    backgroundColor: colors.surface,
    padding: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    borderWidth: dimensions.borderWidth.thin,
    borderColor: colors.border,
    gap: dimensions.spacing.sm,
  },
  questionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: dimensions.spacing.xs,
  },
  numberBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: colors.background,
    borderWidth: dimensions.borderWidth.thin,
    borderColor: colors.border,
  },
  correctBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#F0FDF4',
    borderWidth: dimensions.borderWidth.thin,
    borderColor: colors.correct,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: dimensions.spacing.xs,
  },
  editButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: colors.background,
    borderWidth: dimensions.borderWidth.thin,
    borderColor: colors.border,
  },
  deleteButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#FEF2F2',
    borderWidth: dimensions.borderWidth.thin,
    borderColor: colors.wrong,
  },
  questionText: {
    lineHeight: 22,
  },
  optionsPreview: {
    paddingVertical: dimensions.spacing.xs,
    gap: 2,
  },
  explanationSnippet: {
    padding: dimensions.spacing.sm,
    backgroundColor: colors.background,
    borderRadius: dimensions.borderRadius.sm,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.md,
    padding: dimensions.spacing.lg,
    gap: dimensions.spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 8,
  },
  modalScroll: {
    maxHeight: 500,
  },
  modalTextArea: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: dimensions.borderRadius.sm,
    padding: dimensions.spacing.sm,
    fontSize: 14,
    marginTop: 4,
  },
  optionInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  optionInput: {
    flex: 1,
    height: 36,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    paddingHorizontal: 8,
    fontSize: 13,
  },
  correctSelectRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  correctChip: {
    width: 36,
    height: 36,
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: colors.background,
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: colors.selected,
  },
});
