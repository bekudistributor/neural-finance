import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface AccountBalance {
  account_id: string;
  account_name: string;
  account_type: string;
  account_code: string;
  balance: number;
}

export default function Reports() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<AccountBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAccountBalances();
  }, []);

  const fetchAccountBalances = async () => {
    try {
      const { data, error } = await supabase.rpc('get_account_balances');
      
      if (error) throw error;
      
      setAccounts(data || []);
    } catch (error) {
      console.error('Error fetching account balances:', error);
      toast({
        title: "Error",
        description: "Failed to fetch account balances",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getAccountsByType = (type: string) => {
    return accounts.filter(account => account.account_type === type);
  };

  const getTotalByType = (type: string) => {
    return getAccountsByType(type).reduce((sum, account) => sum + account.balance, 0);
  };

  // Financial calculations
  const assets = getAccountsByType('asset');
  const liabilities = getAccountsByType('liability');
  const equity = getAccountsByType('equity');
  const revenue = getAccountsByType('revenue');
  const expenses = getAccountsByType('expense');

  const totalAssets = getTotalByType('asset');
  const totalLiabilities = getTotalByType('liability');
  const totalEquity = getTotalByType('equity');
  const totalRevenue = getTotalByType('revenue');
  const totalExpenses = getTotalByType('expense');

  const netIncome = totalRevenue - totalExpenses;

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
              <h1 className="text-2xl font-semibold text-foreground">Financial Reports</h1>
              <p className="text-sm text-muted-foreground">View profit & loss, balance sheet, and cash flow</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date Range
            </Button>
            <Button className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Reports Tabs */}
        <Tabs defaultValue="profit-loss" className="w-full">
          <TabsList className="mb-6 bg-muted w-full sm:w-auto">
            <TabsTrigger value="profit-loss" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-1 sm:flex-initial">
              Profit & Loss
            </TabsTrigger>
            <TabsTrigger value="balance-sheet" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-1 sm:flex-initial">
              Balance Sheet
            </TabsTrigger>
            <TabsTrigger value="cash-flow" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-1 sm:flex-initial">
              Cash Flow
            </TabsTrigger>
          </TabsList>

          {/* Profit & Loss Statement */}
          <TabsContent value="profit-loss">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-card-foreground">
                  Profit & Loss Statement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Revenue Section */}
                <div>
                  <h3 className="font-semibold text-lg text-card-foreground mb-3">Revenue</h3>
                  <div className="space-y-2">
                    {revenue.map((account) => (
                      <div key={account.account_id} className="flex justify-between py-2">
                        <span className="text-muted-foreground">{account.account_name}</span>
                        <span className="font-medium text-success">{formatCurrency(account.balance)}</span>
                      </div>
                    ))}
                    <div className="border-t border-border pt-2 flex justify-between font-semibold">
                      <span>Total Revenue</span>
                      <span className="text-success">{formatCurrency(totalRevenue)}</span>
                    </div>
                  </div>
                </div>

                {/* Expenses Section */}
                <div>
                  <h3 className="font-semibold text-lg text-card-foreground mb-3">Expenses</h3>
                  <div className="space-y-2">
                    {expenses.map((account) => (
                      <div key={account.account_id} className="flex justify-between py-2">
                        <span className="text-muted-foreground">{account.account_name}</span>
                        <span className="font-medium text-danger">{formatCurrency(account.balance)}</span>
                      </div>
                    ))}
                    <div className="border-t border-border pt-2 flex justify-between font-semibold">
                      <span>Total Expenses</span>
                      <span className="text-danger">{formatCurrency(totalExpenses)}</span>
                    </div>
                  </div>
                </div>

                {/* Net Income */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Net Income</span>
                    <span className={netIncome >= 0 ? 'text-success' : 'text-danger'}>
                      {formatCurrency(netIncome)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Balance Sheet */}
          <TabsContent value="balance-sheet">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Assets & Liabilities+Equity */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-card-foreground">
                    Assets
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {assets.map((account) => (
                    <div key={account.account_id} className="flex justify-between py-2">
                      <span className="text-muted-foreground">{account.account_name}</span>
                      <span className="font-medium">{formatCurrency(account.balance)}</span>
                    </div>
                  ))}
                  <div className="border-t border-border pt-2 flex justify-between font-semibold">
                    <span>Total Assets</span>
                    <span className="text-success">{formatCurrency(totalAssets)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-card-foreground">
                    Liabilities & Equity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-card-foreground mb-2">Liabilities</h4>
                    {liabilities.map((account) => (
                      <div key={account.account_id} className="flex justify-between py-1 pl-4">
                        <span className="text-muted-foreground">{account.account_name}</span>
                        <span className="font-medium">{formatCurrency(account.balance)}</span>
                      </div>
                    ))}
                    <div className="pl-4 flex justify-between font-medium text-sm">
                      <span>Total Liabilities</span>
                      <span>{formatCurrency(totalLiabilities)}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-card-foreground mb-2">Equity</h4>
                    {equity.map((account) => (
                      <div key={account.account_id} className="flex justify-between py-1 pl-4">
                        <span className="text-muted-foreground">{account.account_name}</span>
                        <span className="font-medium">{formatCurrency(account.balance)}</span>
                      </div>
                    ))}
                    <div className="pl-4 flex justify-between font-medium text-sm">
                      <span>Total Equity</span>
                      <span>{formatCurrency(totalEquity)}</span>
                    </div>
                  </div>

                  <div className="border-t border-border pt-2 flex justify-between font-semibold">
                    <span>Total Liabilities & Equity</span>
                    <span className="text-warning">{formatCurrency(totalLiabilities + totalEquity)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Cash Flow Statement */}
          <TabsContent value="cash-flow">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-card-foreground">
                  Cash Flow Statement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Cash flow report coming soon</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This will show cash movements and liquidity analysis
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}