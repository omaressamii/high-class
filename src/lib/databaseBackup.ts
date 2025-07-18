/**
 * Database Backup and Restore Utilities for Firebase Realtime Database
 * Provides functionality to backup and restore the entire database or specific collections
 */

import { ref, get, set, remove, update } from 'firebase/database';
import { database } from '@/lib/firebase';

export interface BackupMetadata {
  timestamp: string;
  version: string;
  collections: string[];
  totalRecords: number;
  backupSize: number; // in bytes
  createdBy?: string;
  description?: string;
}

export interface BackupData {
  metadata: BackupMetadata;
  data: Record<string, any>;
}

export interface BackupProgress {
  stage: 'preparing' | 'reading' | 'processing' | 'complete' | 'error';
  progress: number; // 0-100
  currentCollection?: string;
  message: string;
}

export interface RestoreProgress {
  stage: 'preparing' | 'validating' | 'clearing' | 'restoring' | 'complete' | 'error';
  progress: number; // 0-100
  currentCollection?: string;
  message: string;
}

export interface RestoreOptions {
  clearExistingData?: boolean;
  selectedCollections?: string[];
  skipValidation?: boolean;
}

// Default collections to backup
const DEFAULT_COLLECTIONS = [
  'users',
  'customers', 
  'products',
  'orders',
  'branches',
  'financial_transactions',
  'system_settings',
  'product_types'
];

/**
 * Creates a complete backup of the database
 */
export async function createDatabaseBackup(
  options: {
    collections?: string[];
    description?: string;
    createdBy?: string;
  } = {},
  onProgress?: (progress: BackupProgress) => void
): Promise<BackupData> {
  const collections = options.collections || DEFAULT_COLLECTIONS;
  let totalRecords = 0;
  const backupData: Record<string, any> = {};

  try {
    // Stage 1: Preparing
    onProgress?.({
      stage: 'preparing',
      progress: 0,
      message: 'Preparing backup...'
    });

    // Stage 2: Reading data
    onProgress?.({
      stage: 'reading',
      progress: 10,
      message: 'Reading database collections...'
    });

    for (let i = 0; i < collections.length; i++) {
      const collection = collections[i];
      const progress = 10 + (i / collections.length) * 70;
      
      onProgress?.({
        stage: 'reading',
        progress,
        currentCollection: collection,
        message: `Reading ${collection}...`
      });

      try {
        const collectionRef = ref(database, collection);
        const snapshot = await get(collectionRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          backupData[collection] = data;
          
          // Count records
          if (typeof data === 'object' && data !== null) {
            totalRecords += Object.keys(data).length;
          } else {
            totalRecords += 1;
          }
        } else {
          backupData[collection] = null;
        }
      } catch (error) {
        console.warn(`Failed to backup collection ${collection}:`, error);
        backupData[collection] = null;
      }
    }

    // Stage 3: Processing
    onProgress?.({
      stage: 'processing',
      progress: 85,
      message: 'Processing backup data...'
    });

    // Calculate backup size (approximate)
    const backupJson = JSON.stringify(backupData);
    const backupSize = new Blob([backupJson]).size;

    // Create metadata
    const metadata: BackupMetadata = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      collections,
      totalRecords,
      backupSize,
      createdBy: options.createdBy,
      description: options.description
    };

    const finalBackup: BackupData = {
      metadata,
      data: backupData
    };

    // Stage 4: Complete
    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: 'Backup completed successfully!'
    });

    return finalBackup;

  } catch (error) {
    onProgress?.({
      stage: 'error',
      progress: 0,
      message: `Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    throw error;
  }
}

/**
 * Downloads backup data as a JSON file
 */
export function downloadBackup(backupData: BackupData, filename?: string): void {
  const json = JSON.stringify(backupData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const defaultFilename = `database-backup-${new Date().toISOString().split('T')[0]}.json`;
  const finalFilename = filename || defaultFilename;

  const link = document.createElement('a');
  link.href = url;
  link.download = finalFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validates backup data structure
 */
export function validateBackupData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    errors.push('Invalid backup file format');
    return { isValid: false, errors };
  }

  if (!data.metadata) {
    errors.push('Missing backup metadata');
  } else {
    if (!data.metadata.timestamp) errors.push('Missing backup timestamp');
    if (!data.metadata.version) errors.push('Missing backup version');
    if (!Array.isArray(data.metadata.collections)) errors.push('Invalid collections list');
  }

  if (!data.data || typeof data.data !== 'object') {
    errors.push('Missing or invalid backup data');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Reads and parses backup file
 */
export function readBackupFile(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const backupData = JSON.parse(content);

        const validation = validateBackupData(backupData);
        if (!validation.isValid) {
          reject(new Error(`Invalid backup file: ${validation.errors.join(', ')}`));
          return;
        }

        resolve(backupData as BackupData);
      } catch (error) {
        reject(new Error('Failed to parse backup file: Invalid JSON format'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read backup file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Restores database from backup data
 */
export async function restoreDatabase(
  backupData: BackupData,
  options: RestoreOptions = {},
  onProgress?: (progress: RestoreProgress) => void
): Promise<void> {
  const { clearExistingData = false, selectedCollections, skipValidation = false } = options;

  try {
    // Stage 1: Preparing
    onProgress?.({
      stage: 'preparing',
      progress: 0,
      message: 'Preparing restore operation...'
    });

    // Stage 2: Validation
    if (!skipValidation) {
      onProgress?.({
        stage: 'validating',
        progress: 10,
        message: 'Validating backup data...'
      });

      const validation = validateBackupData(backupData);
      if (!validation.isValid) {
        throw new Error(`Backup validation failed: ${validation.errors.join(', ')}`);
      }
    }

    const collectionsToRestore = selectedCollections || backupData.metadata.collections;
    const totalCollections = collectionsToRestore.length;

    // Stage 3: Clear existing data if requested
    if (clearExistingData) {
      onProgress?.({
        stage: 'clearing',
        progress: 20,
        message: 'Clearing existing data...'
      });

      for (let i = 0; i < collectionsToRestore.length; i++) {
        const collection = collectionsToRestore[i];
        const progress = 20 + (i / totalCollections) * 20;

        onProgress?.({
          stage: 'clearing',
          progress,
          currentCollection: collection,
          message: `Clearing ${collection}...`
        });

        try {
          const collectionRef = ref(database, collection);
          await remove(collectionRef);
        } catch (error) {
          console.warn(`Failed to clear collection ${collection}:`, error);
        }
      }
    }

    // Stage 4: Restore data
    onProgress?.({
      stage: 'restoring',
      progress: 40,
      message: 'Restoring data...'
    });

    for (let i = 0; i < collectionsToRestore.length; i++) {
      const collection = collectionsToRestore[i];
      const progress = 40 + (i / totalCollections) * 55;

      onProgress?.({
        stage: 'restoring',
        progress,
        currentCollection: collection,
        message: `Restoring ${collection}...`
      });

      const collectionData = backupData.data[collection];
      if (collectionData !== null && collectionData !== undefined) {
        try {
          const collectionRef = ref(database, collection);
          await set(collectionRef, collectionData);
        } catch (error) {
          console.error(`Failed to restore collection ${collection}:`, error);
          throw new Error(`Failed to restore ${collection}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Stage 5: Complete
    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: 'Database restore completed successfully!'
    });

  } catch (error) {
    onProgress?.({
      stage: 'error',
      progress: 0,
      message: `Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    throw error;
  }
}

/**
 * Gets backup file information without fully loading it
 */
export async function getBackupInfo(file: File): Promise<BackupMetadata | null> {
  try {
    const backupData = await readBackupFile(file);
    return backupData.metadata;
  } catch (error) {
    console.error('Failed to read backup info:', error);
    return null;
  }
}
