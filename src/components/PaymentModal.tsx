import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentCreated: () => void;
}

interface Invoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  paid_amount: number;
  customer: { name: string };
}

interface Bill {
  id: string;
  bill_number: string | null;
  total_amount: number;
  paid_amount: number;
  vendor: { name: string };
}

interface Account {
  id: string;
  name: string;
  type: string;
}

export const PaymentModal = ({ open, onOpenChange, onPaymentCreated }: PaymentModalProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  const [formData, setFormData] = useState({
    payment_type: "",
    invoice_id: "",
    bill_id: "",
    amount: "",
    payment_method: "cash",
    payment_account_id: "",
    date: new Date().toISOString().split('T')[0],
    reference: "",
    notes: ""
  });

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    try {
      // Fetch unpaid/partially paid invoices
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select(`
          id, invoice_number, total_amount, paid_amount,
          customer:customers(name)
        `)
        .neq('status', 'paid');

      // Fetch unpaid/partially paid bills
      const { data: billsData } = await supabase
        .from('bills')
        .select(`
          id, bill_number, total_amount, paid_amount,
          vendor:vendors(name)
        `)
        .neq('status', 'paid');

      // Fetch cash and bank accounts
      const { data: accountsData } = await supabase
        .from('accounts')
        .select('id, name, type')
        .in('type', ['asset'])
        .in('name', ['Cash on Hand', 'Bank Account - Operating', 'Business Checking Account']);

      setInvoices(invoicesData || []);
      setBills(billsData || []);
      setAccounts(accountsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const paymentData = {
        payment_type: formData.payment_type,
        invoice_id: formData.invoice_id || null,
        bill_id: formData.bill_id || null,
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
        payment_account_id: formData.payment_account_id,
        date: formData.date,
        reference: formData.reference,
        notes: formData.notes
      };

      const { error } = await supabase.rpc('process_payment_with_journal_entries', {
        payment_data: paymentData
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });

      onPaymentCreated();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        payment_type: "",
        invoice_id: "",
        bill_id: "",
        amount: "",
        payment_method: "cash",
        payment_account_id: "",
        date: new Date().toISOString().split('T')[0],
        reference: "",
        notes: ""
      });
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedInvoice = invoices.find(inv => inv.id === formData.invoice_id);
  const selectedBill = bills.find(bill => bill.id === formData.bill_id);
  const remainingAmount = formData.payment_type === 'customer_payment' 
    ? selectedInvoice ? selectedInvoice.total_amount - selectedInvoice.paid_amount : 0
    : selectedBill ? selectedBill.total_amount - selectedBill.paid_amount : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment_type">Payment Type</Label>
              <Select
                value={formData.payment_type}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  payment_type: value,
                  invoice_id: "",
                  bill_id: "",
                  amount: ""
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer_payment">Customer Payment (Received)</SelectItem>
                  <SelectItem value="vendor_payment">Vendor Payment (Sent)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.payment_type === 'customer_payment' && (
            <div className="space-y-2">
              <Label htmlFor="invoice_id">Select Invoice</Label>
              <Select
                value={formData.invoice_id}
                onValueChange={(value) => {
                  const invoice = invoices.find(inv => inv.id === value);
                  setFormData(prev => ({ 
                    ...prev, 
                    invoice_id: value,
                    amount: invoice ? (invoice.total_amount - invoice.paid_amount).toString() : ""
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an invoice" />
                </SelectTrigger>
                <SelectContent>
                  {invoices.map((invoice) => (
                    <SelectItem key={invoice.id} value={invoice.id}>
                      {invoice.invoice_number} - {invoice.customer?.name} (Remaining: Rp{(invoice.total_amount - invoice.paid_amount).toLocaleString('id-ID')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.payment_type === 'vendor_payment' && (
            <div className="space-y-2">
              <Label htmlFor="bill_id">Select Bill</Label>
              <Select
                value={formData.bill_id}
                onValueChange={(value) => {
                  const bill = bills.find(b => b.id === value);
                  setFormData(prev => ({ 
                    ...prev, 
                    bill_id: value,
                    amount: bill ? (bill.total_amount - bill.paid_amount).toString() : ""
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a bill" />
                </SelectTrigger>
                <SelectContent>
                  {bills.map((bill) => (
                    <SelectItem key={bill.id} value={bill.id}>
                      {bill.bill_number || 'No Number'} - {bill.vendor?.name} (Remaining: Rp{(bill.total_amount - bill.paid_amount).toLocaleString('id-ID')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                required
              />
              {remainingAmount > 0 && (
                <p className="text-sm text-muted-foreground">
                  Remaining: Rp{remainingAmount.toLocaleString('id-ID')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_account_id">Payment Account</Label>
              <Select
                value={formData.payment_account_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, payment_account_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Reference</Label>
              <Input
                id="reference"
                placeholder="Payment reference"
                value={formData.reference}
                onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Optional payment notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Recording..." : "Record Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};