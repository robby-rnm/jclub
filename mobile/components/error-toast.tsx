import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';

interface ErrorToastProps {
  visible: boolean;
  message: string;
  onDismiss?: () => void;
  duration?: number;
  type?: 'error' | 'warning' | 'success';
}

export function ErrorToast({ 
  visible, 
  message, 
  onDismiss, 
  duration = 3000,
  type = 'error' 
}: ErrorToastProps) {
  const [show, setShow] = useState(visible);

  useEffect(() => {
    setShow(visible);
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        setShow(false);
        onDismiss?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onDismiss]);

  if (!show) return null;

  const colors = {
    error: { bg: '#FFEBEE', icon: '#D32F2F', text: '#C62828' },
    warning: { bg: '#FFF3E0', icon: '#EF6C00', text: '#E65100' },
    success: { bg: '#E8F5E9', icon: '#2E7D32', text: '#1B5E20' },
  };

  const color = colors[type];

  return (
    <View style={[styles.toast, { backgroundColor: color.bg }]}>
      <Ionicons 
        name={type === 'success' ? 'checkmark-circle' : 'alert-circle'} 
        size={24} 
        color={color.icon} 
      />
      <Text style={[styles.toastText, { color: color.text }]}>{message}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={() => { setShow(false); onDismiss(); }}>
          <Ionicons name="close" size={20} color={color.text} />
        </TouchableOpacity>
      )}
    </View>
  );
}

interface ErrorModalProps {
  visible: boolean;
  title?: string;
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
}

export function ErrorModal({ 
  visible, 
  title = 'Terjadi Kesalahan',
  message, 
  onDismiss,
  onRetry 
}: ErrorModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalIcon}>
            <Ionicons name="alert-circle" size={48} color="#D32F2F" />
          </View>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          
          <View style={styles.modalActions}>
            {onRetry && (
              <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                <Text style={styles.retryButtonText}>Coba Lagi</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
              <Text style={styles.dismissButtonText}>
                {onRetry ? 'Tutup' : 'OK'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    gap: 12,
    zIndex: 1000,
  },
  toastText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: '#616161',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  retryButton: {
    flex: 1,
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  dismissButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  dismissButtonText: {
    color: '#616161',
    fontSize: 14,
    fontWeight: '600',
  },
});
