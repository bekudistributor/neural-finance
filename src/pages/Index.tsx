import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileText, DollarSign, TrendingUp, Users } from "lucide-react";
import { FinancialOverview } from "@/components/FinancialOverview";
import { RecentTransactions } from "@/components/RecentTransactions";
import { InvoiceModal } from "@/components/InvoiceModal";
import { TransactionModal } from "@/components/TransactionModal";

const Index = () => {
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  const stats = [
    {
      title: "Total Revenue",
      value: "$45,231.89",
      change: "+20.1%",
      icon: DollarSign,
      trend: "up" as const,
    },
    {
      title: "Active Invoices",
      value: "23",
      change: "+5 this month",
      icon: FileText,
      trend: "up" as const,
    },
    {
      title: "Total Expenses",
      value: "$12,234.50",
      change: "-8.2%",
      icon: TrendingUp,
      trend: "down" as const,
    },
    {
      title: "Active Customers",
      value: "89",
      change: "+12 this month",
      icon: Users,
      trend: "up" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Neural Finance</h1>
              <p className="text-sm text-muted-foreground">Financial management dashboard</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search transactions, invoices..."
                  className="w-80 pl-10"
                />
              </div>
              
              <Button 
                onClick={() => setShowInvoiceModal(true)}
                className="gap-2 bg-primary hover:bg-primary-hover text-primary-foreground"
              >
                <Plus className="h-4 w-4" />
                New Invoice
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setShowTransactionModal(true)}
                className="gap-2 border-border hover:bg-accent"
              >
                <Plus className="h-4 w-4" />
                Add Transaction
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="border-border bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-card-foreground">{stat.value}</div>
                  <p className={`text-xs ${
                    stat.trend === 'up' ? 'text-success' : 'text-danger'
                  }`}>
                    {stat.change}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts and Data */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <FinancialOverview />
          </div>
          <div className="lg:col-span-1">
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
