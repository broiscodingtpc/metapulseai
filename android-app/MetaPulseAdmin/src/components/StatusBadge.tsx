import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

interface StatusBadgeProps {
  status: string;
  text: string;
  size?: 'small' | 'medium' | 'large';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  text,
  size = 'medium',
}) => {
  const getStatusColor = () => {
    switch (status.toLowerCase()) {
      case 'running':
      case 'online':
      case 'success':
      case 'bullish':
      case 'low':
        return '#00ff41';
      case 'warning':
      case 'medium':
      case 'neutral':
        return '#ffff00';
      case 'stopped':
      case 'offline':
      case 'error':
      case 'bearish':
      case 'high':
        return '#ff4444';
      default:
        return '#666';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 4,
          paddingHorizontal: 8,
          fontSize: 10,
        };
      case 'large':
        return {
          paddingVertical: 12,
          paddingHorizontal: 16,
          fontSize: 16,
        };
      default:
        return {
          paddingVertical: 8,
          paddingHorizontal: 12,
          fontSize: 12,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const statusColor = getStatusColor();

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: statusColor,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
        },
      ]}>
      <Text
        style={[
          styles.text,
          {
            color: statusColor,
            fontSize: sizeStyles.fontSize,
          },
        ]}>
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});