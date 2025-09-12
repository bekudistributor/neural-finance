import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownLeft, MoreVertical } from "lucide-react";

const transactions = [
  {
    id: "1",
    description: "Office Supplies - Staples",
    amount: -234.50,
    date: "2024-01-15",
    category: "Office",
    status: "completed",
  },
  {
    id: "2", 
    description: "Client Payment - Acme Corp",
    amount: 2500.00,
    date: "2024-01-14",
    category: "Revenue",
    status: "completed",
  },
  {
    id: "3",
    description: "Software Subscription - Adobe",
    amount: -79.99,
    date: "2024-01-13",
    category: "Software",
    status: "pending",
  },
  {
    id: "4",
    description: "Marketing Campaign - Google Ads",
    amount: -450.00,
    date: "2024-01-12",
    category: "Marketing",
    status: "completed",
  },
  {
    id: "5",
    description: "Freelancer Payment - John Doe",
    amount: -800.00,
    date: "2024-01-11",
    category: "Services",
    status: "completed",
  },
];

export const RecentTransactions = () => {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xl font-semibold text-card-foreground">
          Recent Transactions
        </CardTitle>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          View All
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between py-3 border-b border-border last:border-0"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
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
                <div className="flex items-center gap-2 mt-1">
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
            
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className={`text-sm font-semibold ${
                  transaction.amount > 0 ? 'text-success' : 'text-danger'
                }`}>
                  {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {transaction.category}
                </p>
              </div>
              
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};