import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileText, DollarSign, TrendingUp, Users } from "lucide-react";
import { FinancialOverview } from "@/components/FinancialOverview";
import { RecentTransactions } from "@/components/RecentTransactions";
import { InvoiceModal } from "@/components/InvoiceModal";
import { TransactionModal } from "@/components/TransactionModal";
import { formatCurrency } from "@/lib/utils";

const Index = () => {
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  // TODO: Replace with Supabase data fetching
  const stats = [
    {
      title: "Total Revenue",
      value: formatCurrency(0), // Will be populated from Supabase
      change: "+0%",
      icon: DollarSign,
      trend: "up" as const,
    },
    {
      title: "Active Invoices",
      value: "0", // Will be populated from Supabase
      change: "+0 this month",
      icon: FileText,
      trend: "up" as const,
    },
    {
      title: "Total Expenses",
      value: formatCurrency(0), // Will be populated from Supabase
      change: "-0%",
      icon: TrendingUp,
      trend: "down" as const,
    },
    {
      title: "Active Customers",
      value: "0", // Will be populated from Supabase
      change: "+0 this month",
      icon: Users,
      trend: "up" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Neural Finance</h1>
              <p className="text-sm text-muted-foreground">Financial management dashboard</p>
            </div>
            
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:gap-3 sm:space-y-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search transactions, invoices..."
                  className="w-full sm:w-80 pl-10"
                />
              </div>
              
              <div className="flex gap-2 sm:gap-3">
                <Button 
                  onClick={() => setShowInvoiceModal(true)}
                  className="flex-1 sm:flex-initial gap-2 bg-primary hover:bg-primary-hover text-primary-foreground"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">New Invoice</span>
                  <span className="sm:hidden">Invoice</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => setShowTransactionModal(true)}
                  className="flex-1 sm:flex-initial gap-2 border-border hover:bg-accent"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Transaction</span>
                  <span className="sm:hidden">Transaction</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
        {/* Stats Cards */}
        <div className="mb-6 sm:mb-8 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="border-border bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground line-clamp-2">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-card-foreground truncate">{stat.value}</div>
                  <p className={`text-xs ${
                    stat.trend === 'up' ? 'text-success' : 'text-danger'
                  } truncate`}>
                    {stat.change}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts and Data */}
        <div className="grid grid-cols-1 gap-6 sm:gap-8 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <FinancialOverview />
          </div>
          <div className="xl:col-span-1">
            <RecentTransactions />
          </div>
        </div>
      </main>

      {/* Modals */}
      <InvoiceModal 
        open={showInvoiceModal} 
        onOpenChange={setShowInvoiceModal} 
      />
      <TransactionModal 
        open={showTransactionModal} 
        onOpenChange={setShowTransactionModal} 
      />
    </div>
  );
};

export default Index;
