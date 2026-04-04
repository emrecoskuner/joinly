import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomSheetModal } from '@/components/ui/bottom-sheet-modal';
import type { RatingPromptActivity, RatingSubmissionEntry } from '@/services/ratings';

type ActivityRatingSheetProps = {
  prompt: RatingPromptActivity | null;
  visible: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (entries: RatingSubmissionEntry[]) => void;
};

type DraftEntry = {
  score: number;
  comment: string;
};

export function ActivityRatingSheet({
  prompt,
  visible,
  isSubmitting,
  onClose,
  onSubmit,
}: ActivityRatingSheetProps) {
  const insets = useSafeAreaInsets();
  const [draftByUserId, setDraftByUserId] = useState<Record<string, DraftEntry>>({});
  const [invalidUserIds, setInvalidUserIds] = useState<string[]>([]);
  const scrollViewRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    if (!prompt) {
      setDraftByUserId({});
      setInvalidUserIds([]);
      return;
    }

    setDraftByUserId(
      prompt.targets.reduce<Record<string, DraftEntry>>((acc, target) => {
        acc[target.userId] = {
          score: target.existingScore,
          comment: target.existingComment,
        };
        return acc;
      }, {})
    );
    setInvalidUserIds([]);
  }, [prompt]);

  const invalidUserIdSet = useMemo(() => new Set(invalidUserIds), [invalidUserIds]);

  const handleSubmit = () => {
    if (!prompt) {
      return;
    }

    const invalidIds = prompt.targets
      .filter((target) => {
        const draft = draftByUserId[target.userId];
        return Boolean(draft?.comment.trim()) && !draft?.score;
      })
      .map((target) => target.userId);

    if (invalidIds.length > 0) {
      setInvalidUserIds(invalidIds);
      Alert.alert('Add a star rating', 'Comments need a star rating before you can submit.');
      return;
    }

    const entries = prompt.targets.reduce<RatingSubmissionEntry[]>((acc, target) => {
      const draft = draftByUserId[target.userId];

      if (!draft?.score) {
        return acc;
      }

      acc.push({
        toUserId: target.userId,
        score: draft.score,
        comment: draft.comment.trim() || null,
      });
      return acc;
    }, []);

    setInvalidUserIds([]);
    onSubmit(entries);
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <BottomSheetModal onRequestClose={onClose} visible={visible}>
      <View style={styles.sheetBody}>
        <Pressable onPress={dismissKeyboard} style={styles.flexFill}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <ThemedText style={styles.title}>Share trust feedback</ThemedText>
              <ThemedText style={styles.body}>
                {prompt
                  ? `Rate the people from ${prompt.activityTitle}. You can skip anyone you do not want to review.`
                  : 'Rate the people from your recent activity.'}
              </ThemedText>
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                pressed ? styles.buttonPressed : null,
                isSubmitting ? styles.buttonDisabled : null,
              ]}>
              <MaterialIcons color="#5E584F" name="close" size={20} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            style={styles.scrollArea}>
            {prompt?.targets.map((target, index) => {
              const draft = draftByUserId[target.userId] ?? { score: 0, comment: '' };
              const isInvalid = invalidUserIdSet.has(target.userId);

              return (
                <View
                  key={target.userId}
                  style={[styles.personCard, isInvalid ? styles.personCardInvalid : null]}>
                  <View style={styles.personHeader}>
                    <View style={styles.personIdentity}>
                      {target.avatarUrl ? (
                        <Image contentFit="cover" source={{ uri: target.avatarUrl }} style={styles.avatar} />
                      ) : (
                        <View style={styles.avatarFallback}>
                          <ThemedText style={styles.avatarFallbackText}>{target.initials}</ThemedText>
                        </View>
                      )}
                      <ThemedText style={styles.personName}>{target.fullName}</ThemedText>
                    </View>
                    <View style={styles.starsRow}>
                      {STAR_VALUES.map((value) => (
                        <Pressable
                          accessibilityRole="button"
                          disabled={isSubmitting}
                          key={value}
                          onPress={() => {
                            setDraftByUserId((currentValue) => ({
                              ...currentValue,
                              [target.userId]: {
                                ...(currentValue[target.userId] ?? { score: 0, comment: '' }),
                                score: value,
                              },
                            }));
                            setInvalidUserIds((currentValue) =>
                              currentValue.filter((userId) => userId !== target.userId)
                            );
                          }}
                          style={({ pressed }) => [
                            styles.starButton,
                            pressed ? styles.buttonPressed : null,
                          ]}>
                          <MaterialIcons
                            color={value <= draft.score ? '#D89E35' : '#D6CCBF'}
                            name={value <= draft.score ? 'star' : 'star-border'}
                            size={24}
                          />
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <TextInput
                    blurOnSubmit
                    editable={!isSubmitting}
                    multiline
                    onChangeText={(value) => {
                      setDraftByUserId((currentValue) => ({
                        ...currentValue,
                        [target.userId]: {
                          ...(currentValue[target.userId] ?? { score: 0, comment: '' }),
                          comment: value,
                        },
                      }));
                    }}
                    onFocus={() => {
                      scrollViewRef.current?.scrollTo({
                        y: index * 220,
                        animated: true,
                      });
                    }}
                    onSubmitEditing={dismissKeyboard}
                    placeholder="Add a short comment if you want"
                    placeholderTextColor="#958D83"
                    returnKeyType="done"
                    style={[styles.commentInput, isInvalid ? styles.commentInputInvalid : null]}
                    submitBehavior="blurAndSubmit"
                    textAlignVertical="top"
                    value={draft.comment}
                  />
                  {isInvalid ? (
                    <ThemedText style={styles.validationText}>
                      Add a star rating before leaving a comment.
                    </ThemedText>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>
        </Pressable>

        <View
          style={[
            styles.footer,
            {
              paddingBottom: Math.max(insets.bottom, 10),
            },
          ]}>
          <ThemedText style={styles.footerHint}>You can submit a few ratings now and skip the rest.</ThemedText>
          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={() => {
              dismissKeyboard();
              handleSubmit();
            }}
            style={({ pressed }) => [
              styles.submitButton,
              pressed ? styles.buttonPressed : null,
              isSubmitting ? styles.buttonDisabled : null,
            ]}>
            {isSubmitting ? (
              <ActivityIndicator color="#FFFDFC" size="small" />
            ) : (
              <ThemedText style={styles.submitButtonText}>Submit feedback</ThemedText>
            )}
          </Pressable>
        </View>
      </View>
    </BottomSheetModal>
  );
}

const STAR_VALUES = [1, 2, 3, 4, 5];

const styles = StyleSheet.create({
  sheetBody: {
    flex: 1,
  },
  flexFill: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
  },
  headerCopy: {
    flex: 1,
    gap: 6,
  },
  title: {
    color: '#171411',
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '700',
  },
  body: {
    color: '#645C52',
    fontSize: 14,
    lineHeight: 21,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5EEE4',
  },
  content: {
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 32,
  },
  scrollArea: {
    flex: 1,
  },
  personCard: {
    gap: 12,
    padding: 16,
    borderRadius: 24,
    backgroundColor: '#FFF8F0',
    borderWidth: 1,
    borderColor: '#F0E4D4',
  },
  personCardInvalid: {
    borderColor: '#D98B7F',
    backgroundColor: '#FFF6F4',
  },
  personHeader: {
    gap: 12,
  },
  personIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBDCC6',
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBDCC6',
  },
  avatarFallbackText: {
    color: '#6A5237',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },
  personName: {
    flex: 1,
    color: '#171411',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starButton: {
    padding: 2,
  },
  commentInput: {
    minHeight: 88,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7D9C8',
    color: '#171411',
    fontSize: 14,
    lineHeight: 20,
  },
  commentInputInvalid: {
    borderColor: '#D98B7F',
  },
  validationText: {
    color: '#B14F46',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  footer: {
    borderTopWidth: 1,
    borderColor: '#F0E4D4',
    backgroundColor: '#FFFDFC',
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 10,
    shadowColor: '#2D2218',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -6 },
    elevation: 10,
  },
  footerHint: {
    color: '#7B6F62',
    fontSize: 12,
    lineHeight: 16,
  },
  submitButton: {
    minHeight: 54,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#171411',
  },
  submitButtonText: {
    color: '#FFFDFC',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '800',
  },
  buttonPressed: {
    opacity: 0.92,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
