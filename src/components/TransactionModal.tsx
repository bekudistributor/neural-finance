import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TransactionModal = ({ open, onOpenChange }: TransactionModalProps) => {
  const [transactionData, setTransactionData] = useState({
    date: new Date().toISOString().split('T')[0],
    vendor: "",
    amount: "",
    category: "",
    description: "",
    paymentMethod: "",
  });
  
  const { toast } = useToast();

  const categories = [
    "Office Supplies",
    "Marketing",
    "Software",
    "Travel",
    "Services",
    "Equipment",
    "Utilities",
    "Other"
  ];

  const paymentMethods = [
    "Credit Card",
    "Debit Card", 
    "Bank Transfer",
    "Cash",
    "Check"
  ];

  const handleInputChange = (field: string, value: string) => {
    setTransactionData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Here you would typically save the transaction to Supabase
    console.log("Transaction data:", transactionData);
    
    toast({
      title: "Transaction Added",
      description: "Transaction has been recorded successfully.",
    });
    
    // Reset form
    setTransactionData({
      date: new Date().toISOString().split('T')[0],
      vendor: "",
      amount: "",
      category: "",
      description: "",
      paymentMethod: "",
    });
    
    onOpenChange(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Placeholder for OCR functionality
    toast({
      title: "OCR Processing",
      description: "Receipt processing feature will be available soon!",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add New Transaction</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* OCR Upload Section */}
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-4">
                <Button variant="outline" className="gap-2" asChild>
                  <label htmlFor="receipt-upload" className="cursor-pointer">
                    <Upload className="h-4 w-4" />
                    Upload Receipt
                    <input
                      id="receipt-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </Button>
                <Button variant="outline" className="gap-2">
                  <Camera className="h-4 w-4" />
                  Take Photo
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Upload a receipt for automatic data extraction, or fill in the details manually below
              </p>
            </div>
          </div>

          {/* Manual Entry Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={transactionData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="vendor">Vendor</Label>
              <Input
                id="vendor"
                value={transactionData.vendor}
                onChange={(e) => handleInputChange('vendor', e.target.value)}
                placeholder="Enter vendor name"
              />
            </div>
            
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={transactionData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                placeholder="0.00"
              />
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <Select onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select onValueChange={(value) => handleInputChange('paymentMethod', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={transactionData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Additional notes about this transaction"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-primary hover:bg-primary-hover">
            Add Transaction
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};