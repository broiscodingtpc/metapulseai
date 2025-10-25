import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

interface ConsoleCardProps {
  title: string;
  children: React.ReactNode;
  variant?: 'default' | 'highlight' | 'danger';
}

export const ConsoleCard: React.FC<ConsoleCardProps> = ({
  title,
  children,
  variant = 'default',
}) => {
  const getBorderColor = () => {
    switch (variant) {
      case 'highlight':
        return '#00ff41';
      case 'danger':
        return '#ff4444';
      default:
        return '#333';
    }
  };

  const getTitleColor = () => {
    switch (variant) {
      case 'highlight':
        return '#00ff41';
      case 'danger':
        return '#ff4444';
      default:
        return '#00ff41';
    }
  };

  return (
    <View style={[styles.container, {borderColor: getBorderColor()}]}>
      {/* Header */}
      <View style={[styles.header, {borderBottomColor: getBorderColor()}]}>
        <Text style={[styles.title, {color: getTitleColor()}]}>
          ╔══ {title} ══╗
        </Text>
      </View>

      {/* Content */}
      <View style={styles.content}>{children}</View>

      {/* Footer */}
      <View style={[styles.footer, {borderTopColor: getBorderColor()}]}>
        <Text style={[styles.footerText, {color: getBorderColor()}]}>
          ╚{'═'.repeat(title.length + 8)}╝
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  header: {
    borderBottomWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#0f0f0f',
  },
  title: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    padding: 16,
  },
  footer: {
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#0f0f0f',
  },
  footerText: {
    fontFamily: 'monospace',
    fontSize: 12,
    textAlign: 'center',
  },
});