'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  Upload, 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  Loader2,
  FileText,
  Shield,
  Clock,
  HardDrive
} from 'lucide-react';
import {
  createDatabaseBackup,
  downloadBackup,
  restoreDatabase,
  readBackupFile,
  getBackupInfo,
  BackupData,
  BackupProgress,
  RestoreProgress,
  BackupMetadata
} from '@/lib/databaseBackup';
import { useAuth } from '@/context/AuthContext';

interface DatabaseBackupManagerProps {
  lang: 'ar' | 'en';
}

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

export default function DatabaseBackupManager({ lang }: DatabaseBackupManagerProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Backup state
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupProgress, setBackupProgress] = useState<BackupProgress | null>(null);
  const [backupDescription, setBackupDescription] = useState('');
  const [selectedBackupCollections, setSelectedBackupCollections] = useState<string[]>(DEFAULT_COLLECTIONS);

  // Restore state
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState<RestoreProgress | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [backupInfo, setBackupInfo] = useState<BackupMetadata | null>(null);
  const [clearExistingData, setClearExistingData] = useState(false);
  const [selectedRestoreCollections, setSelectedRestoreCollections] = useState<string[]>([]);

  const t = {
    title: lang === 'ar' ? 'إدارة النسخ الاحتياطي للقاعدة' : 'Database Backup Manager',
    description: lang === 'ar' 
      ? 'إنشاء واستعادة النسخ الاحتياطية لقاعدة البيانات' 
      : 'Create and restore database backups',
    
    // Backup section
    backupTitle: lang === 'ar' ? 'إنشاء نسخة احتياطية' : 'Create Backup',
    backupDescription: lang === 'ar' ? 'إنشاء نسخة احتياطية من قاعدة البيانات' : 'Create a backup of the database',
    backupDescriptionLabel: lang === 'ar' ? 'وصف النسخة الاحتياطية (اختياري)' : 'Backup Description (Optional)',
    backupDescriptionPlaceholder: lang === 'ar' ? 'أدخل وصفاً للنسخة الاحتياطية...' : 'Enter backup description...',
    selectCollections: lang === 'ar' ? 'اختر المجموعات للنسخ الاحتياطي' : 'Select Collections to Backup',
    createBackup: lang === 'ar' ? 'إنشاء نسخة احتياطية' : 'Create Backup',
    creatingBackup: lang === 'ar' ? 'جاري إنشاء النسخة الاحتياطية...' : 'Creating backup...',
    
    // Restore section
    restoreTitle: lang === 'ar' ? 'استعادة من نسخة احتياطية' : 'Restore from Backup',
    restoreDescription: lang === 'ar' ? 'استعادة قاعدة البيانات من نسخة احتياطية' : 'Restore database from backup',
    selectFile: lang === 'ar' ? 'اختر ملف النسخة الاحتياطية' : 'Select Backup File',
    chooseFile: lang === 'ar' ? 'اختر ملف' : 'Choose File',
    clearExisting: lang === 'ar' ? 'مسح البيانات الموجودة قبل الاستعادة' : 'Clear existing data before restore',
    restoreData: lang === 'ar' ? 'استعادة البيانات' : 'Restore Data',
    restoring: lang === 'ar' ? 'جاري الاستعادة...' : 'Restoring...',
    
    // File info
    fileInfo: lang === 'ar' ? 'معلومات الملف' : 'File Information',
    backupDate: lang === 'ar' ? 'تاريخ النسخة الاحتياطية' : 'Backup Date',
    totalRecords: lang === 'ar' ? 'إجمالي السجلات' : 'Total Records',
    fileSize: lang === 'ar' ? 'حجم الملف' : 'File Size',
    collections: lang === 'ar' ? 'المجموعات' : 'Collections',
    createdBy: lang === 'ar' ? 'أنشئت بواسطة' : 'Created By',
    
    // Messages
    backupSuccess: lang === 'ar' ? 'تم إنشاء النسخة الاحتياطية بنجاح' : 'Backup created successfully',
    restoreSuccess: lang === 'ar' ? 'تم استعادة البيانات بنجاح' : 'Data restored successfully',
    error: lang === 'ar' ? 'خطأ' : 'Error',
    warning: lang === 'ar' ? 'تحذير' : 'Warning',
    dangerousOperation: lang === 'ar' ? 'عملية خطيرة' : 'Dangerous Operation',
    restoreWarning: lang === 'ar' 
      ? 'استعادة البيانات ستستبدل البيانات الحالية. تأكد من إنشاء نسخة احتياطية أولاً.' 
      : 'Restoring data will replace current data. Make sure to create a backup first.',
    
    // Collection names
    collectionNames: {
      users: lang === 'ar' ? 'المستخدمون' : 'Users',
      customers: lang === 'ar' ? 'العملاء' : 'Customers',
      products: lang === 'ar' ? 'المنتجات' : 'Products',
      orders: lang === 'ar' ? 'الطلبات' : 'Orders',
      branches: lang === 'ar' ? 'الفروع' : 'Branches',
      financial_transactions: lang === 'ar' ? 'المعاملات المالية' : 'Financial Transactions',
      system_settings: lang === 'ar' ? 'إعدادات النظام' : 'System Settings',
      product_types: lang === 'ar' ? 'أنواع المنتجات' : 'Product Types'
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US');
  };

  const handleCreateBackup = async () => {
    if (!currentUser) return;

    setIsBackingUp(true);
    setBackupProgress(null);

    try {
      const backupData = await createDatabaseBackup(
        {
          collections: selectedBackupCollections,
          description: backupDescription.trim() || undefined,
          createdBy: currentUser.fullName || currentUser.username
        },
        setBackupProgress
      );

      downloadBackup(backupData);
      
      toast({
        title: t.backupSuccess,
        description: `${backupData.metadata.totalRecords} records backed up`,
      });

      setBackupDescription('');
    } catch (error) {
      toast({
        title: t.error,
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setIsBackingUp(false);
      setBackupProgress(null);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setBackupInfo(null);
    setSelectedRestoreCollections([]);

    try {
      const info = await getBackupInfo(file);
      if (info) {
        setBackupInfo(info);
        setSelectedRestoreCollections(info.collections);
      }
    } catch (error) {
      toast({
        title: t.error,
        description: 'Failed to read backup file information',
        variant: 'destructive'
      });
    }
  };

  const handleRestoreData = async () => {
    if (!selectedFile || !backupInfo) return;

    setIsRestoring(true);
    setRestoreProgress(null);

    try {
      const backupData = await readBackupFile(selectedFile);
      
      await restoreDatabase(
        backupData,
        {
          clearExistingData,
          selectedCollections: selectedRestoreCollections
        },
        setRestoreProgress
      );

      toast({
        title: t.restoreSuccess,
        description: `${selectedRestoreCollections.length} collections restored`,
      });

      // Reset form
      setSelectedFile(null);
      setBackupInfo(null);
      setSelectedRestoreCollections([]);
      setClearExistingData(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast({
        title: t.error,
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setIsRestoring(false);
      setRestoreProgress(null);
    }
  };

  const toggleBackupCollection = (collection: string) => {
    setSelectedBackupCollections(prev => 
      prev.includes(collection) 
        ? prev.filter(c => c !== collection)
        : [...prev, collection]
    );
  };

  const toggleRestoreCollection = (collection: string) => {
    setSelectedRestoreCollections(prev => 
      prev.includes(collection) 
        ? prev.filter(c => c !== collection)
        : [...prev, collection]
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            {t.title}
          </CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
      </Card>

      {/* Backup Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t.backupTitle}
          </CardTitle>
          <CardDescription>{t.backupDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="backup-description">{t.backupDescriptionLabel}</Label>
            <Textarea
              id="backup-description"
              placeholder={t.backupDescriptionPlaceholder}
              value={backupDescription}
              onChange={(e) => setBackupDescription(e.target.value)}
              disabled={isBackingUp}
            />
          </div>

          <div className="space-y-3">
            <Label>{t.selectCollections}</Label>
            <div className="grid grid-cols-2 gap-2">
              {DEFAULT_COLLECTIONS.map(collection => (
                <div key={collection} className="flex items-center space-x-2">
                  <Checkbox
                    id={`backup-${collection}`}
                    checked={selectedBackupCollections.includes(collection)}
                    onCheckedChange={() => toggleBackupCollection(collection)}
                    disabled={isBackingUp}
                  />
                  <Label htmlFor={`backup-${collection}`} className="text-sm">
                    {t.collectionNames[collection as keyof typeof t.collectionNames] || collection}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {backupProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{backupProgress.message}</span>
                <span>{Math.round(backupProgress.progress)}%</span>
              </div>
              <Progress value={backupProgress.progress} />
              {backupProgress.currentCollection && (
                <p className="text-xs text-muted-foreground">
                  {lang === 'ar' ? 'المجموعة الحالية:' : 'Current collection:'} {backupProgress.currentCollection}
                </p>
              )}
            </div>
          )}

          <Button
            onClick={handleCreateBackup}
            disabled={isBackingUp || selectedBackupCollections.length === 0}
            className="w-full"
          >
            {isBackingUp ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.creatingBackup}
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                {t.createBackup}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Restore Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {t.restoreTitle}
          </CardTitle>
          <CardDescription>{t.restoreDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>{t.dangerousOperation}</strong>
              <br />
              {t.restoreWarning}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="backup-file">{t.selectFile}</Label>
            <Input
              ref={fileInputRef}
              id="backup-file"
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              disabled={isRestoring}
            />
          </div>

          {backupInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" />
                  {t.fileInfo}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{t.backupDate}</p>
                      <p className="text-muted-foreground">{formatDate(backupInfo.timestamp)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{t.totalRecords}</p>
                      <p className="text-muted-foreground">{backupInfo.totalRecords.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{t.fileSize}</p>
                      <p className="text-muted-foreground">{formatFileSize(backupInfo.backupSize)}</p>
                    </div>
                  </div>
                  {backupInfo.createdBy && (
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{t.createdBy}</p>
                        <p className="text-muted-foreground">{backupInfo.createdBy}</p>
                      </div>
                    </div>
                  )}
                </div>

                {backupInfo.description && (
                  <div>
                    <p className="font-medium text-sm mb-1">{t.backupDescriptionLabel}</p>
                    <p className="text-sm text-muted-foreground">{backupInfo.description}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <Label>{t.selectCollections}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {backupInfo.collections.map(collection => (
                      <div key={collection} className="flex items-center space-x-2">
                        <Checkbox
                          id={`restore-${collection}`}
                          checked={selectedRestoreCollections.includes(collection)}
                          onCheckedChange={() => toggleRestoreCollection(collection)}
                          disabled={isRestoring}
                        />
                        <Label htmlFor={`restore-${collection}`} className="text-sm">
                          {t.collectionNames[collection as keyof typeof t.collectionNames] || collection}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="clear-existing"
                    checked={clearExistingData}
                    onCheckedChange={(checked) => setClearExistingData(checked as boolean)}
                    disabled={isRestoring}
                  />
                  <Label htmlFor="clear-existing" className="text-sm">
                    {t.clearExisting}
                  </Label>
                </div>
              </CardContent>
            </Card>
          )}

          {restoreProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{restoreProgress.message}</span>
                <span>{Math.round(restoreProgress.progress)}%</span>
              </div>
              <Progress value={restoreProgress.progress} />
              {restoreProgress.currentCollection && (
                <p className="text-xs text-muted-foreground">
                  {lang === 'ar' ? 'المجموعة الحالية:' : 'Current collection:'} {restoreProgress.currentCollection}
                </p>
              )}
            </div>
          )}

          <Button
            onClick={handleRestoreData}
            disabled={isRestoring || !backupInfo || selectedRestoreCollections.length === 0}
            variant="destructive"
            className="w-full"
          >
            {isRestoring ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.restoring}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {t.restoreData}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
