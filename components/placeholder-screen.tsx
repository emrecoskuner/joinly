import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';

type PlaceholderScreenProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  accentColor: string;
};

export function PlaceholderScreen({
  eyebrow,
  title,
  description,
  icon,
  accentColor,
}: PlaceholderScreenProps) {
  return (
    <View style={styles.screen}>
      <View style={styles.background}>
        <View style={[styles.glow, styles.glowPrimary, { backgroundColor: `${accentColor}30` }]} />
        <View style={styles.glowSecondary} />
      </View>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.copyBlock}>
            <ThemedText style={styles.eyebrow}>{eyebrow}</ThemedText>
            <ThemedText style={styles.title}>{title}</ThemedText>
            <ThemedText style={styles.description}>{description}</ThemedText>
          </View>

          <View style={styles.heroCard}>
            <View style={[styles.iconWrap, { backgroundColor: `${accentColor}18` }]}>
              <MaterialIcons name={icon} size={34} color={accentColor} />
            </View>
            <ThemedText style={styles.cardTitle}>Coming together nicely</ThemedText>
            <ThemedText style={styles.cardBody}>
              This tab is ready for the next feature pass, with navigation and styling already in
              place.
            </ThemedText>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  glowPrimary: {
    top: -70,
    right: -20,
  },
  glowSecondary: {
    position: 'absolute',
    bottom: 100,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#F1E4D5',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    justifyContent: 'space-between',
    paddingBottom: 140,
  },
  copyBlock: {
    gap: 10,
  },
  eyebrow: {
    color: '#7C7468',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  title: {
    color: '#171411',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.9,
  },
  description: {
    color: '#5F584F',
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 320,
  },
  heroCard: {
    gap: 18,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    padding: 24,
    shadowColor: '#1A1714',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    color: '#171411',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },
  cardBody: {
    color: '#686157',
    fontSize: 15,
    lineHeight: 22,
  },
});
