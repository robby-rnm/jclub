import { View, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: '#E0E0E0' },
        { opacity },
        style,
      ]}
    />
  );
}

export function MatchCardSkeleton() {
  return (
    <View style={cardStyles.container}>
      <View style={cardStyles.header}>
        <Skeleton width={"70%"} height={18} />
        <Skeleton width={60} height={22} borderRadius={8} />
      </View>
      <View style={cardStyles.clubInfo}>
        <Skeleton width={16} height={16} borderRadius={8} />
        <Skeleton width={"40%"} height={14} />
      </View>
      <View style={cardStyles.badgeRow}>
        <Skeleton width={80} height={20} borderRadius={4} />
      </View>
      <View style={cardStyles.infoRow}>
        <Skeleton width={16} height={16} borderRadius={4} />
        <Skeleton width={"60%"} height={14} />
      </View>
      <View style={cardStyles.infoRow}>
        <Skeleton width={16} height={16} borderRadius={4} />
        <Skeleton width={"50%"} height={14} />
      </View>
      <View style={cardStyles.footer}>
        <Skeleton width={80} height={14} />
        <Skeleton width={60} height={16} />
      </View>
    </View>
  );
}

export function ClubCardSkeleton() {
  return (
    <View style={clubCardStyles.container}>
      <View style={clubCardStyles.content}>
        <Skeleton width={60} height={60} borderRadius={30} />
        <View style={clubCardStyles.info}>
          <Skeleton width={"70%"} height={18} />
          <Skeleton width={"90%"} height={14} style={{ marginTop: 8 }} />
        </View>
      </View>
      <View style={clubCardStyles.actions}>
        <Skeleton width={"45%"} height={40} borderRadius={8} />
        <Skeleton width={"45%"} height={40} borderRadius={8} />
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  clubInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
});

const clubCardStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  content: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
});
