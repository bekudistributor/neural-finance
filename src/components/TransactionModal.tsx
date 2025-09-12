import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Upload, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

interface TransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TransactionItem {
  id: string;
  description: string;
  category: string;
  amount: number;
}

export const TransactionModal = ({ open, onOpenChange }: TransactionModalProps) => {
  const [transactionData, setTransactionData] = useState({
    date: new Date().toISOString().split('T')[0],
    vendor: "",
    description: "",
    paymentMethod: "",
  });
  
  const [items, setItems] = useState<TransactionItem[]>([
    { id: "1", description: "", category: "", amount: 0 }
  ]);
  
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

  const addItem = () => {
    const newItem: TransactionItem = {
      id: Date.now().toString(),
      description: "",
      category: "",
      amount: 0,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof TransactionItem, value: string | number) => {
    setItems(items.map(item => 
      item.id === id 
        ? { ...item, [field]: field === 'amount' ? Number(value) || 0 : value }
        : item
    ));
  };

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  const handleSubmit = async () => {
    // Here you would typically save the transaction and items to Supabase
    console.log("Transaction data:", { ...transactionData, items, totalAmount });
    
    toast({
      title: "Transaction Added",
      description: `Transaction with total ${formatCurrency(totalAmount)} has been recorded successfully.`,
    });
    
    // Reset form
    setTransactionData({
      date: new Date().toISOString().split('T')[0],
      vendor: "",
      description: "",
      paymentMethod: "",
    });
    setItems([{ id: "1", description: "", category: "", amount: 0 }]);
    
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add New Transaction</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* OCR Upload Section */}
          <div className="border-2 border-dashed border-border rounded-lg p-4 sm:p-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <Button variant="outline" className="gap-2 w-full sm:w-auto" asChild>
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
                <Button variant="outline" className="gap-2 w-full sm:w-auto">
                  <Camera className="h-4 w-4" />
                  Take Photo
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Upload a receipt for automatic data extraction, or fill in the details manually below
              </p>
            </div>
          </div>

          {/* Basic Transaction Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            
            <div className="sm:col-span-2">
              <Label htmlFor="description">Transaction Notes</Label>
              <Textarea
                id="description"
                value={transactionData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Additional notes about this transaction"
                rows={2}
              />
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Transaction Items</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.id} className="border border-border rounded-lg p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="sm:col-span-2 lg:col-span-1">
                      <Label htmlFor={`item-description-${item.id}`}>Description</Label>
                      <Input
                        id={`item-description-${item.id}`}
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        placeholder="Item description"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`item-category-${item.id}`}>Category</Label>
                      <Select 
                        value={item.category} 
                        onValueChange={(value) => updateItem(item.id, 'category', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Category" />
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
                    
                    <div>
                      <Label htmlFor={`item-amount-${item.id}`}>Amount</Label>
                      <Input
                        id={`item-amount-${item.id}`}
                        type="number"
                        min="0"
                        step="1000"
                        value={item.amount || ''}
                        onChange={(e) => updateItem(item.id, 'amount', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <Label>Total</Label>
                        <div className="h-10 flex items-center px-3 bg-muted border border-input rounded-md text-sm">
                          {formatCurrency(item.amount)}
                        </div>
                      </div>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="h-10 w-10 p-0 text-danger hover:text-danger hover:bg-danger-light"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Amount */}
            <div className="flex justify-end border-t border-border pt-4">
              <div className="text-right">
                <Label className="text-base font-medium">Total Amount</Label>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(totalAmount)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6 pt-6 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-primary hover:bg-primary-hover w-full sm:w-auto">
            Add Transaction
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};