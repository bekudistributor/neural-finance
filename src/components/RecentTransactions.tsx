import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownLeft, MoreVertical } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// TODO: Replace with Supabase data fetching
const transactions = [
  // Empty array - will be populated from Supabase
];

export const RecentTransactions = () => {
  // TODO: Fetch data from Supabase
  const isLoading = true; // Set to false when data is loaded
  const hasData = transactions.length > 0;

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg sm:text-xl font-semibold text-card-foreground">
          Recent Transactions
        </CardTitle>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs sm:text-sm">
          View All
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 py-3">
                <div className="h-8 w-8 bg-muted rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                  <div className="h-3 bg-muted rounded w-1/2 animate-pulse"></div>
                </div>
                <div className="h-4 w-16 bg-muted rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : !hasData ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No transactions yet</p>
            <p className="text-sm text-muted-foreground">Add your first transaction to get started</p>
          </div>
        ) : (
          transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between py-3 border-b border-border last:border-0"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={`p-2 rounded-full flex-shrink-0 ${
                  transaction.amount > 0 
                    ? 'bg-success-light' 
                    : 'bg-danger-light'
                }`}>
                  {transaction.amount > 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-success" />
                  ) : (
                    <ArrowDownLeft className="h-4 w-4 text-danger" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-card-foreground truncate">
                    {transaction.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <p className="text-xs text-muted-foreground">
                      {new Date(transaction.date).toLocaleDateString()}
                    </p>
                    <Badge 
                      variant={transaction.status === 'completed' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-right">
                  <p className={`text-sm font-semibold ${
                    transaction.amount > 0 ? 'text-success' : 'text-danger'
                  }`}>
                    {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                  </p>
                  <p className="text-xs text-muted-foreground truncate max-w-20">
                    {transaction.category}
                  </p>
                </div>
                
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hidden sm:flex">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};