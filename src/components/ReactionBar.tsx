import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ReactionBarProps {
  reactions?: { [userId: string]: string };
  currentUserId: string;
  onPress: () => void;
}

const ReactionBar: React.FC<ReactionBarProps> = ({
  reactions = {},
  currentUserId,
  onPress,
}) => {
  // Emoji'leri grupla ve say
  const emojiCounts: { [emoji: string]: { count: number; userIds: string[] } } = {};
  
  Object.entries(reactions).forEach(([userId, emoji]) => {
    if (!emojiCounts[emoji]) {
      emojiCounts[emoji] = { count: 0, userIds: [] };
    }
    emojiCounts[emoji].count++;
    emojiCounts[emoji].userIds.push(userId);
  });

  const hasReactions = Object.keys(emojiCounts).length > 0;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {hasReactions ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.reactionsContainer}
        >
          {Object.entries(emojiCounts).map(([emoji, data]) => {
            const isUserReaction = data.userIds.includes(currentUserId);
            return (
              <View
                key={emoji}
                style={[
                  styles.reactionItem,
                  isUserReaction && styles.reactionItemHighlighted,
                ]}
              >
                <Text style={styles.emoji}>{emoji}</Text>
                <Text
                  style={[
                    styles.count,
                    isUserReaction && styles.countHighlighted,
                  ]}
                >
                  {data.count}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>😊 Reaksiyon ekle</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  reactionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  reactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 4,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  reactionItemHighlighted: {
    backgroundColor: '#3a2a1a',
    borderColor: '#FF9500',
  },
  emoji: {
    fontSize: 18,
  },
  count: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  countHighlighted: {
    color: '#FF9500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});

export default ReactionBar;
