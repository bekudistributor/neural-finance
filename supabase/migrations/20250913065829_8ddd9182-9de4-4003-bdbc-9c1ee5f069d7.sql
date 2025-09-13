-- Fix RLS issues for existing tables
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Fix search path for existing functions
DROP FUNCTION IF EXISTS public.create_expense_transaction(text, uuid, timestamp with time zone, text, jsonb);
DROP FUNCTION IF EXISTS public.copy_default_accounts_for_user();
DROP FUNCTION IF EXISTS public.copy_default_accounts_for_user(uuid);

-- Recreate functions with proper search path
CREATE OR REPLACE FUNCTION public.create_expense_transaction(
    vendor_name text, 
    payment_account_id uuid, 
    transaction_date timestamp with time zone, 
    transaction_description text, 
    items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
    target_vendor_id UUID;
    new_transaction_id UUID;
    total_amount NUMERIC(10, 2) := 0;
    item RECORD;
BEGIN
    -- 1. Get the current user's ID
    current_user_id := auth.uid();

    -- 2. Find or create the vendor
    SELECT id INTO target_vendor_id FROM vendors WHERE name = vendor_name AND user_id = current_user_id;
    IF target_vendor_id IS NULL THEN
        INSERT INTO vendors (name, user_id) VALUES (vendor_name, current_user_id)
        RETURNING id INTO target_vendor_id;
    END IF;

    -- 3. Calculate total amount from items
    FOR item IN SELECT * FROM jsonb_to_recordset(items) AS x(description TEXT, amount NUMERIC, expense_account_id UUID)
    LOOP
        total_amount := total_amount + item.amount;
    END LOOP;

    -- 4. Create the main transaction record
    INSERT INTO transactions (user_id, vendor_id, date, description, total_amount)
    VALUES (current_user_id, target_vendor_id, transaction_date, transaction_description, total_amount)
    RETURNING id INTO new_transaction_id;

    -- 5. Create transaction items and debit journal entries
    FOR item IN SELECT * FROM jsonb_to_recordset(items) AS x(description TEXT, amount NUMERIC, expense_account_id UUID)
    LOOP
        -- Create transaction item
        INSERT INTO transaction_items (transaction_id, expense_account_id, description, amount)
        VALUES (new_transaction_id, item.expense_account_id, item.description, item.amount);

        -- Create debit journal entry for the expense
        INSERT INTO journal_entries (user_id, transaction_id, account_id, date, debit, description)
        VALUES (current_user_id, new_transaction_id, item.expense_account_id, transaction_date, item.amount, item.description);
    END LOOP;

    -- 6. Create the balancing credit journal entry for the payment account
    INSERT INTO journal_entries (user_id, transaction_id, account_id, date, credit, description)
    VALUES (current_user_id, new_transaction_id, payment_account_id, transaction_date, total_amount, 'Payment for transaction ' || new_transaction_id::text);

    RETURN new_transaction_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.copy_default_accounts_for_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- This function gives the currently logged-in user a full set of default F&B accounts.
    -- It checks if the user already has accounts before inserting to prevent duplicates.
    IF NOT EXISTS (SELECT 1 FROM accounts WHERE user_id = auth.uid()) THEN
        INSERT INTO accounts (user_id, name, type, code) VALUES
            (auth.uid(), 'Cash on Hand', 'asset', '1010'),
            (auth.uid(), 'Business Checking Account', 'asset', '1020'),
            (auth.uid(), 'Inventory - Food', 'asset', '1200'),
            (auth.uid(), 'Inventory - Beverage', 'asset', '1210'),
            (auth.uid(), 'Accounts Payable', 'liability', '2010'),
            (auth.uid(), 'Credit Card Payable', 'liability', '2020'),
            (auth.uid(), 'Owner''s Equity', 'equity', '3010'),
            (auth.uid(), 'Food Sales', 'revenue', '4010'),
            (auth.uid(), 'Beverage Sales', 'revenue', '4020'),
            (auth.uid(), 'COGS - Food', 'cogs', '5010'),
            (auth.uid(), 'COGS - Beverage', 'cogs', '5020'),
            (auth.uid(), 'Payroll Expenses', 'expense', '6010'),
            (auth.uid(), 'Rent Expense', 'expense', '6020'),
            (auth.uid(), 'Utilities', 'expense', '6030'),
            (auth.uid(), 'Marketing & Advertising', 'expense', '6040'),
            (auth.uid(), 'Insurance', 'expense', '6050'),
            (auth.uid(), 'Repairs & Maintenance', 'expense', '6060'),
            (auth.uid(), 'Kitchen Supplies', 'expense', '6070'),
            (auth.uid(), 'Cleaning Supplies', 'expense', '6080'),
            (auth.uid(), 'Software & Subscriptions', 'expense', '6090');
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.copy_default_accounts_for_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- This function gives the specified user a full set of default F&B accounts.
    -- It checks if the user already has accounts before inserting to prevent duplicates.
    IF NOT EXISTS (SELECT 1 FROM accounts WHERE user_id = target_user_id) THEN
        INSERT INTO accounts (user_id, name, type, code) VALUES
            (target_user_id, 'Cash on Hand', 'asset', '1010'),
            (target_user_id, 'Business Checking Account', 'asset', '1020'),
            (target_user_id, 'Inventory - Food', 'asset', '1200'),
            (target_user_id, 'Inventory - Beverage', 'asset', '1210'),
            (target_user_id, 'Accounts Payable', 'liability', '2010'),
            (target_user_id, 'Credit Card Payable', 'liability', '2020'),
            (target_user_id, 'Owner''s Capital', 'equity', '3010'),
            (target_user_id, 'Food Sales', 'revenue', '4010'),
            (target_user_id, 'Beverage Sales', 'revenue', '4020'),
            (target_user_id, 'COGS - Food', 'cogs', '5010'),
            (target_user_id, 'COGS - Beverage', 'cogs', '5020'),
            (target_user_id, 'Payroll Expenses', 'expense', '6010'),
            (target_user_id, 'Rent Expense', 'expense', '6020'),
            (target_user_id, 'Utilities', 'expense', '6030'),
            (target_user_id, 'Marketing & Advertising', 'expense', '6040'),
            (target_user_id, 'Insurance', 'expense', '6050'),
            (target_user_id, 'Repairs & Maintenance', 'expense', '6060'),
            (target_user_id, 'Kitchen Supplies', 'expense', '6070'),
            (target_user_id, 'Cleaning Supplies', 'expense', '6080'),
            (target_user_id, 'Software & Subscriptions', 'expense', '6090');
    END IF;
END;
$$;