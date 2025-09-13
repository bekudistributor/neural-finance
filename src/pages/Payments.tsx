import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowLeft, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { PaymentModal } from "@/components/PaymentModal";

interface Payment {
  id: string;
  payment_type: string;
  amount: number;
  payment_method: string;
  date: string;
  reference: string;
  notes: string;
  invoice?: {
    invoice_number: string;
    customer: { name: string };
  };
  bill?: {
    bill_number: string;
    vendor: { name: string };
  };
}

const paymentTypeColors = {
  customer_payment: "bg-success/10 text-success",
  vendor_payment: "bg-danger/10 text-danger"
};

const paymentMethodColors = {
  cash: "bg-warning/10 text-warning",
  bank_transfer: "bg-primary/10 text-primary",
  credit_card: "bg-secondary/10 text-secondary",
  check: "bg-muted/10 text-muted-foreground"
};

export default function Payments() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          invoice:invoices(
            invoice_number,
            customer:customers(name)
          ),
          bill:bills(
            bill_number,
            vendor:vendors(name)
          )
        `)
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPayments = payments.filter(payment =>
    payment.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.invoice?.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.bill?.vendor?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Payments</h1>
              <p className="text-sm text-muted-foreground">Track customer payments and vendor payments</p>
            </div>
          </div>
          <Button 
            onClick={() => setIsPaymentModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Record Payment
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>

        {/* Payments List */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-card-foreground">
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPayments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No payments found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Record your first payment to get started
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 space-y-2 sm:space-y-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="secondary" 
                            className={paymentTypeColors[payment.payment_type as keyof typeof paymentTypeColors]}
                          >
                            {payment.payment_type === 'customer_payment' ? 'Received' : 'Sent'}
                          </Badge>
                          <Badge 
                            variant="outline"
                            className={paymentMethodColors[payment.payment_method as keyof typeof paymentMethodColors]}
                          >
                            {payment.payment_method.replace('_', ' ')}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(payment.date).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-card-foreground">
                            {payment.reference || 'No reference'}
                          </span>
                          {payment.invoice && (
                            <span className="text-sm text-muted-foreground">
                              → Invoice {payment.invoice.invoice_number} ({payment.invoice.customer?.name})
                            </span>
                          )}
                          {payment.bill && (
                            <span className="text-sm text-muted-foreground">
                              → Bill {payment.bill.bill_number || 'N/A'} ({payment.bill.vendor?.name})
                            </span>
                          )}
                        </div>
                        {payment.notes && (
                          <p className="text-sm text-muted-foreground">{payment.notes}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right mt-2 sm:mt-0">
                      <div className={`text-lg font-semibold ${
                        payment.payment_type === 'customer_payment' 
                          ? 'text-success' 
                          : 'text-danger'
                      }`}>
                        {payment.payment_type === 'customer_payment' ? '+' : '-'}
                        {formatCurrency(payment.amount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <PaymentModal
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        onPaymentCreated={fetchPayments}
      />
    </div>
  );
}