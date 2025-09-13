import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Account {
  account_id: string;
  account_name: string;
  account_type: string;
  account_code: string;
  balance: number;
}

const accountTypeLabels = {
  asset: "Assets",
  liability: "Liabilities", 
  equity: "Equity",
  revenue: "Revenue",
  expense: "Expenses"
};

const accountTypeColors = {
  asset: "bg-success/10 text-success",
  liability: "bg-danger/10 text-danger",
  equity: "bg-warning/10 text-warning",
  revenue: "bg-primary/10 text-primary",
  expense: "bg-muted-foreground/10 text-muted-foreground"
};

export default function Accounts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
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

  const groupedAccounts = accounts.reduce((acc, account) => {
    if (!acc[account.account_type]) {
      acc[account.account_type] = [];
    }
    acc[account.account_type].push(account);
    return acc;
  }, {} as Record<string, Account[]>);

  const calculateTypeTotal = (accounts: Account[]) => {
    return accounts.reduce((sum, account) => sum + account.balance, 0);
  };

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
              <h1 className="text-2xl font-semibold text-foreground">Chart of Accounts</h1>
              <p className="text-sm text-muted-foreground">Manage your account structure and view balances</p>
            </div>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Account
          </Button>
        </div>

        {/* Account Groups */}
        <div className="space-y-6">
          {Object.entries(groupedAccounts).map(([type, typeAccounts]) => (
            <Card key={type} className="border-border bg-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-card-foreground">
                    {accountTypeLabels[type as keyof typeof accountTypeLabels]}
                  </CardTitle>
                  <Badge variant="secondary" className={accountTypeColors[type as keyof typeof accountTypeColors]}>
                    {formatCurrency(calculateTypeTotal(typeAccounts))}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {typeAccounts.map((account) => (
                    <div
                      key={account.account_id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono text-xs">
                          {account.account_code}
                        </Badge>
                        <span className="font-medium text-card-foreground">
                          {account.account_name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`font-semibold ${
                          account.balance >= 0 
                            ? 'text-success' 
                            : 'text-danger'
                        }`}>
                          {formatCurrency(account.balance)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {accounts.length === 0 && (
          <Card className="border-border bg-card">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No accounts found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add your first account to get started
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}