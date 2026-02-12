import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export type ModalType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export interface ActionOption {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

interface CustomModalProps {
  visible: boolean;
  type?: ModalType;
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  singleButton?: boolean;
  actions?: ActionOption[];
}

export default function CustomModal({
  visible,
  type = 'info',
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'OK',
  cancelText = 'Cancel',
  singleButton = false,
  actions,
}: CustomModalProps) {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 65,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getColorForType = (): string => {
    switch (type) {
      case 'success':
        return '#34C759';
      case 'error':
        return '#FF3B30';
      case 'warning':
        return '#FF9500';
      case 'confirm':
        return '#000000'; // Siyah - temaya uygun
      default:
        return '#000000';
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        {/* Dark Overlay Background */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.65)' }]} />

        {/* Touchable Overlay */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleCancel}
        />

        {/* Modal Content */}
        <Animated.View
          style={[
            styles.modalContainer,
            {
              backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFFFFF',
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim },
              ],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Title */}
          <Text style={[styles.title, { color: theme === 'dark' ? '#FFFFFF' : '#000000' }]}>
            {title.split(/(Guinness)/g).map((part, index) => (
              part === 'Guinness' ? (
                <Text key={index} style={{ color: '#34C759' }}>
                  {part}
                </Text>
              ) : (
                <Text key={index}>{part}</Text>
              )
            ))}
          </Text>

          {/* Message */}
          {message && (
            <Text style={[styles.message, { color: theme === 'dark' ? '#ABABAB' : '#666666' }]}>
              {message.split(/(Guinness)/g).map((part, index) => (
                part === 'Guinness' ? (
                  <Text key={index} style={{ color: '#34C759', fontWeight: '700' }}>
                    {part}
                  </Text>
                ) : (
                  <Text key={index}>{part}</Text>
                )
              ))}
            </Text>
          )}

          {/* Buttons */}
          {actions && actions.length > 0 ? (
            <View style={styles.actionSheetContainer}>
              {actions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F2F2F7',
                      borderBottomWidth: index < actions.length - 1 ? 0.5 : 0,
                      borderBottomColor: theme === 'dark' ? '#3A3A3C' : '#E0E0E0',
                    },
                  ]}
                  onPress={() => {
                    action.onPress();
                    if (onCancel) onCancel();
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.actionButtonText,
                      {
                        color: action.destructive
                          ? '#FF3B30'
                          : theme === 'dark'
                          ? '#FFFFFF'
                          : '#000000',
                        fontWeight: action.destructive ? '600' : '500',
                      },
                    ]}
                  >
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.cancelActionButton,
                  {
                    backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFFFFF',
                    marginTop: 12,
                  },
                ]}
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.actionButtonText,
                    styles.cancelActionButtonText,
                    { color: theme === 'dark' ? '#FFFFFF' : '#000000' },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.buttonContainer, singleButton && styles.buttonContainerSingle]}>
              {!singleButton && (
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.cancelButton,
                    {
                      backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F2F2F7',
                    },
                  ]}
                  onPress={handleCancel}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.buttonText, { color: theme === 'dark' ? '#FFFFFF' : '#000000' }]}>
                    {cancelText}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.confirmButton,
                  {
                    backgroundColor: getColorForType(),
                  },
                  singleButton && { flex: 1 },
                ]}
                onPress={handleConfirm}
                activeOpacity={0.7}
              >
                <Text style={[styles.buttonText, styles.confirmButtonText]}>
                  {confirmText}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.3,
        shadowRadius: 30,
      },
      android: {
        elevation: 16,
      },
      web: {
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 24,
    paddingHorizontal: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  buttonContainerSingle: {
    flexDirection: 'row',
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
  },
  confirmButton: {
    backgroundColor: '#000',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    letterSpacing: -0.3,
  },
  confirmButtonText: {
    color: '#FFFFFF',
  },
  actionSheetContainer: {
    width: '100%',
  },
  actionButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  actionButtonText: {
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: -0.3,
  },
  cancelActionButton: {
    borderRadius: 14,
  },
  cancelActionButtonText: {
    fontWeight: '600',
  },
});
