import React from 'react';
import { Platform, Pressable, TouchableOpacity as RNTouchableOpacity, TouchableOpacityProps } from 'react-native';

/**
 * Web-compatible TouchableOpacity wrapper
 * Fixes onPress issues on web while maintaining mobile behavior
 */
export const WebCompatTouchable: React.FC<TouchableOpacityProps> = (props) => {
  if (Platform.OS === 'web') {
    // Web: Use Pressable which works better on web
    return (
      <Pressable
        {...props}
        style={({ pressed }) => [
          props.style,
          pressed && { opacity: 0.7 },
        ]}
      />
    );
  }

  // Mobile: default TouchableOpacity
  return <RNTouchableOpacity {...props} />;
};
