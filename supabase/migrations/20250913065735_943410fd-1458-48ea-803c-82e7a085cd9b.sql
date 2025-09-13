-- Create customers table
CREATE TABLE public.customers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    customer_type TEXT NOT NULL DEFAULT 'dine-in', -- 'dine-in', 'catering', 'delivery'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoices table
CREATE TABLE public.invoices (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    invoice_number TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    due_date TIMESTAMP WITH TIME ZONE,
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'sent', 'paid', 'overdue', 'cancelled'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoice_lines table
CREATE TABLE public.invoice_lines (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL,
    description TEXT NOT NULL,
    quantity NUMERIC(10,3) NOT NULL DEFAULT 1,
    unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    revenue_account_id UUID NOT NULL
);

-- Create bills table
CREATE TABLE public.bills (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    vendor_id UUID NOT NULL,
    bill_number TEXT,
    date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    due_date TIMESTAMP WITH TIME ZONE,
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'received', 'paid', 'overdue', 'cancelled'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bill_lines table
CREATE TABLE public.bill_lines (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    bill_id UUID NOT NULL,
    description TEXT NOT NULL,
    quantity NUMERIC(10,3) NOT NULL DEFAULT 1,
    unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    expense_account_id UUID NOT NULL
);

-- Create payments table
CREATE TABLE public.payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    payment_type TEXT NOT NULL, -- 'customer_payment', 'vendor_payment'
    invoice_id UUID,
    bill_id UUID,
    amount NUMERIC(15,2) NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'cash', -- 'cash', 'bank_transfer', 'credit_card', 'check'
    payment_account_id UUID NOT NULL, -- cash or bank account
    date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    reference TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own customers" ON public.customers
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own invoices" ON public.invoices
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own invoice lines" ON public.invoice_lines
FOR ALL USING (auth.uid() = (SELECT user_id FROM invoices WHERE invoices.id = invoice_lines.invoice_id));

CREATE POLICY "Users can manage their own bills" ON public.bills
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own bill lines" ON public.bill_lines
FOR ALL USING (auth.uid() = (SELECT user_id FROM bills WHERE bills.id = bill_lines.bill_id));

CREATE POLICY "Users can manage their own payments" ON public.payments
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own audit logs" ON public.audit_logs
FOR SELECT USING (auth.uid() = user_id);

-- Create foreign key relationships
ALTER TABLE public.customers ADD CONSTRAINT fk_customers_user_id 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.invoices ADD CONSTRAINT fk_invoices_user_id 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.invoices ADD CONSTRAINT fk_invoices_customer_id 
    FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

ALTER TABLE public.invoice_lines ADD CONSTRAINT fk_invoice_lines_invoice_id 
    FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;
ALTER TABLE public.invoice_lines ADD CONSTRAINT fk_invoice_lines_revenue_account_id 
    FOREIGN KEY (revenue_account_id) REFERENCES public.accounts(id);

ALTER TABLE public.bills ADD CONSTRAINT fk_bills_user_id 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.bills ADD CONSTRAINT fk_bills_vendor_id 
    FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;

ALTER TABLE public.bill_lines ADD CONSTRAINT fk_bill_lines_bill_id 
    FOREIGN KEY (bill_id) REFERENCES public.bills(id) ON DELETE CASCADE;
ALTER TABLE public.bill_lines ADD CONSTRAINT fk_bill_lines_expense_account_id 
    FOREIGN KEY (expense_account_id) REFERENCES public.accounts(id);

ALTER TABLE public.payments ADD CONSTRAINT fk_payments_user_id 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.payments ADD CONSTRAINT fk_payments_invoice_id 
    FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;
ALTER TABLE public.payments ADD CONSTRAINT fk_payments_bill_id 
    FOREIGN KEY (bill_id) REFERENCES public.bills(id) ON DELETE CASCADE;
ALTER TABLE public.payments ADD CONSTRAINT fk_payments_payment_account_id 
    FOREIGN KEY (payment_account_id) REFERENCES public.accounts(id);

ALTER TABLE public.audit_logs ADD CONSTRAINT fk_audit_logs_user_id 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX idx_invoices_date ON public.invoices(date);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoice_lines_invoice_id ON public.invoice_lines(invoice_id);

CREATE INDEX idx_bills_vendor_id ON public.bills(vendor_id);
CREATE INDEX idx_bills_date ON public.bills(date);
CREATE INDEX idx_bills_status ON public.bills(status);
CREATE INDEX idx_bill_lines_bill_id ON public.bill_lines(bill_id);

CREATE INDEX idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX idx_payments_bill_id ON public.payments(bill_id);
CREATE INDEX idx_payments_date ON public.payments(date);

CREATE INDEX idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON public.bills
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update default F&B chart of accounts
INSERT INTO public.accounts (user_id, name, type, code, description) VALUES
    (auth.uid(), 'Cash on Hand', 'asset', '1010', 'Physical cash in register and safe'),
    (auth.uid(), 'Bank Account - Operating', 'asset', '1020', 'Primary business checking account'),
    (auth.uid(), 'Accounts Receivable', 'asset', '1200', 'Money owed by customers'),
    (auth.uid(), 'Inventory - Raw Materials', 'asset', '1300', 'Ingredients and raw food items'),
    (auth.uid(), 'Inventory - Finished Goods', 'asset', '1310', 'Prepared food ready for sale'),
    (auth.uid(), 'Equipment & Utensils', 'asset', '1500', 'Kitchen equipment and utensils'),
    
    (auth.uid(), 'Accounts Payable', 'liability', '2010', 'Money owed to suppliers'),
    (auth.uid(), 'Accrued Expenses', 'liability', '2100', 'Unpaid salaries, utilities, etc.'),
    (auth.uid(), 'Taxes Payable', 'liability', '2200', 'Sales tax and other tax obligations'),
    
    (auth.uid(), 'Owner''s Capital', 'equity', '3010', 'Owner investment in business'),
    (auth.uid(), 'Retained Earnings', 'equity', '3020', 'Accumulated profits'),
    
    (auth.uid(), 'Sales - Dine-in', 'revenue', '4010', 'Revenue from dine-in customers'),
    (auth.uid(), 'Sales - Delivery/Takeaway', 'revenue', '4020', 'Revenue from delivery and takeaway'),
    (auth.uid(), 'Sales - Catering', 'revenue', '4030', 'Revenue from catering services'),
    
    (auth.uid(), 'COGS - Ingredients', 'expense', '5010', 'Cost of ingredients used'),
    (auth.uid(), 'Wages & Salaries', 'expense', '6010', 'Staff compensation'),
    (auth.uid(), 'Rent Expense', 'expense', '6020', 'Monthly rent payments'),
    (auth.uid(), 'Utilities Expense', 'expense', '6030', 'Electricity, water, gas'),
    (auth.uid(), 'Marketing Expense', 'expense', '6040', 'Advertising and promotion'),
    (auth.uid(), 'Miscellaneous Operating Expense', 'expense', '6050', 'Other operating expenses')
ON CONFLICT DO NOTHING;