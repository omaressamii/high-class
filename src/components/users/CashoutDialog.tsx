import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Wallet, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ref, push, set } from 'firebase/database';
import { database } from '@/lib/firebase';
import type { User, FinancialTransaction, UserCashout } from '@/types';
import {
  calculateUserCashBalance,
  getUserPaymentTransactions,
  getUserCashTransactions,
  getLastUserCashout
} from '@/lib/utils';

interface CashoutDialogProps {
  user: User;
  transactions: FinancialTransaction[];
  cashouts: UserCashout[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  lang: string;
  currentUser?: User;
  onCashoutComplete?: () => void;
}

export function CashoutDialog({
  user,
  transactions,
  cashouts,
  isOpen,
  onOpenChange,
  lang,
  currentUser,
  onCashoutComplete
}: CashoutDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const cashBalance = calculateUserCashBalance(user.id, transactions, cashouts);
  const userPaymentTransactions = getUserPaymentTransactions(user.id, transactions);
  const userCashTransactions = getUserCashTransactions(user.id, transactions, cashouts);
  const lastCashout = getLastUserCashout(user.id, cashouts);

  // Calculate total payments received since last cashout
  const totalPaymentsReceived = userCashTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

  const t = {
    title: lang === 'ar' ? 'تفريغ خزنة المستخدم' : 'User Cashout',
    description: lang === 'ar' 
      ? 'عرض تفاصيل الخزنة وتأكيد عملية التفريغ' 
      : 'View cashbox details and confirm cashout operation',
    userLabel: lang === 'ar' ? 'المستخدم' : 'User',
    currentBalance: lang === 'ar' ? 'الرصيد الحالي' : 'Current Balance',
    totalReceived: lang === 'ar' ? 'المبلغ المحصل منذ آخر تفريغ' : 'Amount Collected Since Last Cashout',
    transactionCount: lang === 'ar' ? 'عدد المعاملات منذ آخر تفريغ' : 'Transactions Since Last Cashout',
    lastCashout: lang === 'ar' ? 'آخر تفريغ' : 'Last Cashout',
    noCashoutYet: lang === 'ar' ? 'لم يتم التفريغ من قبل' : 'No previous cashout',
    noBalance: lang === 'ar' ? 'لا يوجد رصيد للتفريغ' : 'No balance to cashout',
    confirmCashout: lang === 'ar' ? 'تأكيد التفريغ' : 'Confirm Cashout',
    cancel: lang === 'ar' ? 'إلغاء' : 'Cancel',
    processing: lang === 'ar' ? 'جاري التفريغ...' : 'Processing...',
    cashout: lang === 'ar' ? 'تفريغ الخزنة' : 'Cashout',
    warningMessage: lang === 'ar' 
      ? 'سيتم تفريغ الخزنة وإعادة الرصيد إلى الصفر. هذا الإجراء لا يمكن التراجع عنه.' 
      : 'The cashbox will be emptied and balance reset to zero. This action cannot be undone.',
    successTitle: lang === 'ar' ? 'تم تفريغ الخزنة بنجاح' : 'Cashout Successful',
    successMessage: lang === 'ar' 
      ? `تم تفريغ خزنة ${user.fullName} بمبلغ ${cashBalance} جنيه` 
      : `Successfully cashed out ${user.fullName}'s balance of ${cashBalance} EGP`,
    errorTitle: lang === 'ar' ? 'خطأ في تفريغ الخزنة' : 'Cashout Error',
    currencySymbol: lang === 'ar' ? 'ج.م' : 'EGP',
  };

  const handleCashout = async () => {
    if (cashBalance <= 0) {
      toast({
        title: t.errorTitle,
        description: t.noBalance,
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create cashout record (separate from financial transactions)
      const cashoutRecord: Omit<UserCashout, 'id'> = {
        userId: user.id,
        userName: user.fullName,
        amount: cashBalance, // Positive amount representing what was cashed out
        cashoutDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        processedByUserId: currentUser?.id || 'SYSTEM',
        processedByUserName: currentUser?.fullName || 'System',
        branchId: user.branchId || null,
        branchName: user.branchName || null,
        notes: lang === 'ar'
          ? `تفريغ خزنة - عدد المعاملات: ${userCashTransactions.length}`
          : `Cashout - Transaction count: ${userCashTransactions.length}`,
        createdAt: new Date().toISOString(),
      };

      // Save to user_cashouts table (separate from financial_transactions)
      const cashoutsRef = ref(database, 'user_cashouts');
      const cleanCashoutRecord = Object.fromEntries(
        Object.entries(cashoutRecord).filter(([, value]) => value !== undefined)
      );
      const newCashoutRef = push(cashoutsRef);
      await set(newCashoutRef, cleanCashoutRecord);

      toast({
        title: t.successTitle,
        description: t.successMessage,
      });

      onOpenChange(false);
      if (onCashoutComplete) {
        onCashoutComplete();
      }

    } catch (error) {
      console.error('Error processing cashout:', error);
      toast({
        title: t.errorTitle,
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            {t.title}
          </DialogTitle>
          <DialogDescription>
            {t.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Info */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="font-medium">{t.userLabel}:</span>
            <span>{user.fullName}</span>
          </div>

          {/* Total Amount Collected */}
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="font-medium text-blue-800">{t.totalReceived}:</span>
            <Badge variant="outline" className="text-lg px-3 py-1 border-blue-300 text-blue-800">
              {totalPaymentsReceived.toFixed(2)} {t.currencySymbol}
            </Badge>
          </div>

          {/* Current Balance */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="font-medium">{t.currentBalance}:</span>
            <Badge variant={cashBalance > 0 ? "default" : "secondary"} className="text-lg px-3 py-1">
              {cashBalance.toFixed(2)} {t.currencySymbol}
            </Badge>
          </div>

          {/* Transaction Count */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="font-medium">{t.transactionCount}:</span>
            <span>{userCashTransactions.length}</span>
          </div>

          {/* Last Cashout Info */}
          <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <span className="font-medium text-gray-700">{t.lastCashout}:</span>
            <span className="text-sm text-gray-600">
              {lastCashout
                ? new Date(lastCashout.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')
                : t.noCashoutYet
              }
            </span>
          </div>

          {/* Warning */}
          {cashBalance > 0 && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-yellow-800">{t.warningMessage}</p>
            </div>
          )}

          {/* No Balance Message */}
          {cashBalance <= 0 && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-gray-600" />
              <p className="text-sm text-gray-700">{t.noBalance}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.cancel}
          </Button>
          <Button
            onClick={handleCashout}
            disabled={isProcessing || cashBalance <= 0}
            variant={cashBalance > 0 ? "destructive" : "secondary"}
          >
            {isProcessing ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {t.processing}
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-4 w-4" />
                {t.cashout}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
