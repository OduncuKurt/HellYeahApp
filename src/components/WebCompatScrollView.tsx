import React from 'react';
import { Platform, ScrollView as RNScrollView, ScrollViewProps } from 'react-native';

/**
 * Web-compatible ScrollView wrapper
 * Fixes scroll issues on web while maintaining mobile behavior
 */
export const WebCompatScrollView: React.FC<ScrollViewProps> = (props) => {
  if (Platform.OS === 'web') {
    // Web-specific styling for proper scroll
    return (
      <RNScrollView
        {...props}
        style={[
          props.style,
          {
            height: '100%',
            overflow: 'auto' as any,
          },
        ]}
        contentContainerStyle={props.contentContainerStyle}
      />
    );
  }

  // Mobile: default behavior
  return <RNScrollView {...props} />;
};
