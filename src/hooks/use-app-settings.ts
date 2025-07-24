'use client';

import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, get, onValue, off } from 'firebase/database';

// Types for different settings
export interface BarcodeSettings {
  width: number;
  height: number;
  fontSize: number;
  margin: number;
  spacing: number;
  containerWidth: string;
  containerHeight: string;
}

export interface GeneralSettings {
  companyName: string;
  companyNameAr: string;
  autoBackup: boolean;
  backupInterval: number;
  maxOrdersPerPage: number;
  maxProductsPerPage: number;
  enableNotifications: boolean;
  defaultCurrency: string;
}

// Default values
const DEFAULT_BARCODE_SETTINGS: BarcodeSettings = {
  width: 3.5,
  height: 70,
  fontSize: 12,
  margin: 5,
  spacing: 2,
  containerWidth: '4cm',
  containerHeight: '2.5cm'
};

const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  companyName: 'High Class',
  companyNameAr: 'هاي كلاس',
  autoBackup: true,
  backupInterval: 24,
  maxOrdersPerPage: 20,
  maxProductsPerPage: 20,
  enableNotifications: true,
  defaultCurrency: 'EGP'
};

// Hook for barcode settings
export function useBarcodeSettings() {
  const [settings, setSettings] = useState<BarcodeSettings>(DEFAULT_BARCODE_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const settingsRef = ref(database, 'system_settings/barcodeSettings');
    
    const loadSettings = async () => {
      try {
        const snapshot = await get(settingsRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          setSettings({
            width: data.width || DEFAULT_BARCODE_SETTINGS.width,
            height: data.height || DEFAULT_BARCODE_SETTINGS.height,
            fontSize: data.fontSize || DEFAULT_BARCODE_SETTINGS.fontSize,
            margin: data.margin || DEFAULT_BARCODE_SETTINGS.margin,
            containerWidth: data.containerWidth || DEFAULT_BARCODE_SETTINGS.containerWidth,
            containerHeight: data.containerHeight || DEFAULT_BARCODE_SETTINGS.containerHeight
          });
        }
      } catch (err) {
        console.error('Error loading barcode settings:', err);
        setError('Failed to load barcode settings');
      } finally {
        setIsLoading(false);
      }
    };

    // Set up real-time listener
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setSettings({
          width: data.width || DEFAULT_BARCODE_SETTINGS.width,
          height: data.height || DEFAULT_BARCODE_SETTINGS.height,
          fontSize: data.fontSize || DEFAULT_BARCODE_SETTINGS.fontSize,
          margin: data.margin || DEFAULT_BARCODE_SETTINGS.margin,
          spacing: data.spacing || DEFAULT_BARCODE_SETTINGS.spacing,
          containerWidth: data.containerWidth || DEFAULT_BARCODE_SETTINGS.containerWidth,
          containerHeight: data.containerHeight || DEFAULT_BARCODE_SETTINGS.containerHeight
        });
      }
      setIsLoading(false);
    }, (err) => {
      console.error('Error in barcode settings listener:', err);
      setError('Failed to load barcode settings');
      setIsLoading(false);
    });

    // Initial load
    loadSettings();

    // Cleanup
    return () => {
      off(settingsRef, 'value', unsubscribe);
    };
  }, []);

  return { settings, isLoading, error };
}

// Hook for general settings
export function useGeneralSettings() {
  const [settings, setSettings] = useState<GeneralSettings>(DEFAULT_GENERAL_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const settingsRef = ref(database, 'system_settings/generalSettings');
    
    const loadSettings = async () => {
      try {
        const snapshot = await get(settingsRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          setSettings({
            companyName: data.companyName || DEFAULT_GENERAL_SETTINGS.companyName,
            companyNameAr: data.companyNameAr || DEFAULT_GENERAL_SETTINGS.companyNameAr,
            autoBackup: data.autoBackup !== undefined ? data.autoBackup : DEFAULT_GENERAL_SETTINGS.autoBackup,
            backupInterval: data.backupInterval || DEFAULT_GENERAL_SETTINGS.backupInterval,
            maxOrdersPerPage: data.maxOrdersPerPage || DEFAULT_GENERAL_SETTINGS.maxOrdersPerPage,
            maxProductsPerPage: data.maxProductsPerPage || DEFAULT_GENERAL_SETTINGS.maxProductsPerPage,
            enableNotifications: data.enableNotifications !== undefined ? data.enableNotifications : DEFAULT_GENERAL_SETTINGS.enableNotifications,
            defaultCurrency: data.defaultCurrency || DEFAULT_GENERAL_SETTINGS.defaultCurrency
          });
        }
      } catch (err) {
        console.error('Error loading general settings:', err);
        setError('Failed to load general settings');
      } finally {
        setIsLoading(false);
      }
    };

    // Set up real-time listener
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setSettings({
          companyName: data.companyName || DEFAULT_GENERAL_SETTINGS.companyName,
          companyNameAr: data.companyNameAr || DEFAULT_GENERAL_SETTINGS.companyNameAr,
          autoBackup: data.autoBackup !== undefined ? data.autoBackup : DEFAULT_GENERAL_SETTINGS.autoBackup,
          backupInterval: data.backupInterval || DEFAULT_GENERAL_SETTINGS.backupInterval,
          maxOrdersPerPage: data.maxOrdersPerPage || DEFAULT_GENERAL_SETTINGS.maxOrdersPerPage,
          maxProductsPerPage: data.maxProductsPerPage || DEFAULT_GENERAL_SETTINGS.maxProductsPerPage,
          enableNotifications: data.enableNotifications !== undefined ? data.enableNotifications : DEFAULT_GENERAL_SETTINGS.enableNotifications,
          defaultCurrency: data.defaultCurrency || DEFAULT_GENERAL_SETTINGS.defaultCurrency
        });
      }
      setIsLoading(false);
    }, (err) => {
      console.error('Error in general settings listener:', err);
      setError('Failed to load general settings');
      setIsLoading(false);
    });

    // Initial load
    loadSettings();

    // Cleanup
    return () => {
      off(settingsRef, 'value', unsubscribe);
    };
  }, []);

  return { settings, isLoading, error };
}

// Combined hook for all settings
export function useAppSettings() {
  const barcodeSettings = useBarcodeSettings();
  const generalSettings = useGeneralSettings();

  return {
    barcode: barcodeSettings,
    general: generalSettings,
    isLoading: barcodeSettings.isLoading || generalSettings.isLoading,
    hasError: barcodeSettings.error !== null || generalSettings.error !== null
  };
}
