-- Fix RLS for users table if it exists
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create double-entry bookkeeping functions
CREATE OR REPLACE FUNCTION public.create_invoice_with_journal_entries(
    customer_id uuid,
    invoice_data jsonb,
    line_items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id uuid;
    new_invoice_id uuid;
    invoice_total numeric(15,2) := 0;
    line_item record;
    new_transaction_id uuid;
    accounts_receivable_id uuid;
BEGIN
    current_user_id := auth.uid();
    
    -- Get accounts receivable account
    SELECT id INTO accounts_receivable_id 
    FROM accounts 
    WHERE user_id = current_user_id AND type = 'asset' AND name ILIKE '%receivable%'
    LIMIT 1;
    
    -- Create the invoice
    INSERT INTO invoices (
        user_id, customer_id, invoice_number, date, due_date, 
        subtotal, tax_amount, total_amount, status, notes
    ) VALUES (
        current_user_id,
        customer_id,
        (invoice_data->>'invoice_number')::text,
        (invoice_data->>'date')::timestamptz,
        (invoice_data->>'due_date')::timestamptz,
        (invoice_data->>'subtotal')::numeric,
        (invoice_data->>'tax_amount')::numeric,
        (invoice_data->>'total_amount')::numeric,
        COALESCE((invoice_data->>'status')::text, 'draft'),
        (invoice_data->>'notes')::text
    ) RETURNING id INTO new_invoice_id;
    
    -- Create invoice lines and calculate total
    FOR line_item IN SELECT * FROM jsonb_to_recordset(line_items) AS x(
        description text, quantity numeric, unit_price numeric, total_amount numeric, revenue_account_id uuid
    ) LOOP
        INSERT INTO invoice_lines (
            invoice_id, description, quantity, unit_price, total_amount, revenue_account_id
        ) VALUES (
            new_invoice_id, line_item.description, line_item.quantity, 
            line_item.unit_price, line_item.total_amount, line_item.revenue_account_id
        );
        
        invoice_total := invoice_total + line_item.total_amount;
    END LOOP;
    
    -- Create transaction record
    INSERT INTO transactions (user_id, date, description, total_amount)
    VALUES (
        current_user_id, 
        (invoice_data->>'date')::timestamptz,
        'Invoice ' || (invoice_data->>'invoice_number')::text,
        invoice_total
    ) RETURNING id INTO new_transaction_id;
    
    -- Create journal entries (Double Entry)
    -- Debit Accounts Receivable
    IF accounts_receivable_id IS NOT NULL THEN
        INSERT INTO journal_entries (user_id, transaction_id, account_id, date, debit, description)
        VALUES (
            current_user_id, new_transaction_id, accounts_receivable_id, 
            (invoice_data->>'date')::timestamptz, invoice_total,
            'Invoice ' || (invoice_data->>'invoice_number')::text
        );
    END IF;
    
    -- Credit Revenue accounts
    FOR line_item IN SELECT * FROM jsonb_to_recordset(line_items) AS x(
        description text, quantity numeric, unit_price numeric, total_amount numeric, revenue_account_id uuid
    ) LOOP
        INSERT INTO journal_entries (user_id, transaction_id, account_id, date, credit, description)
        VALUES (
            current_user_id, new_transaction_id, line_item.revenue_account_id,
            (invoice_data->>'date')::timestamptz, line_item.total_amount,
            line_item.description
        );
    END LOOP;
    
    RETURN new_invoice_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_bill_with_journal_entries(
    vendor_id uuid,
    bill_data jsonb,
    line_items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id uuid;
    new_bill_id uuid;
    bill_total numeric(15,2) := 0;
    line_item record;
    new_transaction_id uuid;
    accounts_payable_id uuid;
BEGIN
    current_user_id := auth.uid();
    
    -- Get accounts payable account
    SELECT id INTO accounts_payable_id 
    FROM accounts 
    WHERE user_id = current_user_id AND type = 'liability' AND name ILIKE '%payable%'
    LIMIT 1;
    
    -- Create the bill
    INSERT INTO bills (
        user_id, vendor_id, bill_number, date, due_date,
        subtotal, tax_amount, total_amount, status, notes
    ) VALUES (
        current_user_id,
        vendor_id,
        (bill_data->>'bill_number')::text,
        (bill_data->>'date')::timestamptz,
        (bill_data->>'due_date')::timestamptz,
        (bill_data->>'subtotal')::numeric,
        (bill_data->>'tax_amount')::numeric,
        (bill_data->>'total_amount')::numeric,
        COALESCE((bill_data->>'status')::text, 'draft'),
        (bill_data->>'notes')::text
    ) RETURNING id INTO new_bill_id;
    
    -- Create bill lines and calculate total
    FOR line_item IN SELECT * FROM jsonb_to_recordset(line_items) AS x(
        description text, quantity numeric, unit_price numeric, total_amount numeric, expense_account_id uuid
    ) LOOP
        INSERT INTO bill_lines (
            bill_id, description, quantity, unit_price, total_amount, expense_account_id
        ) VALUES (
            new_bill_id, line_item.description, line_item.quantity,
            line_item.unit_price, line_item.total_amount, line_item.expense_account_id
        );
        
        bill_total := bill_total + line_item.total_amount;
    END LOOP;
    
    -- Create transaction record
    INSERT INTO transactions (user_id, vendor_id, date, description, total_amount)
    VALUES (
        current_user_id, vendor_id,
        (bill_data->>'date')::timestamptz,
        'Bill ' || COALESCE((bill_data->>'bill_number')::text, 'from vendor'),
        bill_total
    ) RETURNING id INTO new_transaction_id;
    
    -- Create journal entries (Double Entry)
    -- Debit Expense accounts
    FOR line_item IN SELECT * FROM jsonb_to_recordset(line_items) AS x(
        description text, quantity numeric, unit_price numeric, total_amount numeric, expense_account_id uuid
    ) LOOP
        INSERT INTO journal_entries (user_id, transaction_id, account_id, date, debit, description)
        VALUES (
            current_user_id, new_transaction_id, line_item.expense_account_id,
            (bill_data->>'date')::timestamptz, line_item.total_amount,
            line_item.description
        );
    END LOOP;
    
    -- Credit Accounts Payable
    IF accounts_payable_id IS NOT NULL THEN
        INSERT INTO journal_entries (user_id, transaction_id, account_id, date, credit, description)
        VALUES (
            current_user_id, new_transaction_id, accounts_payable_id,
            (bill_data->>'date')::timestamptz, bill_total,
            'Bill ' || COALESCE((bill_data->>'bill_number')::text, 'from vendor')
        );
    END IF;
    
    RETURN new_bill_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_payment_with_journal_entries(
    payment_data jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id uuid;
    new_payment_id uuid;
    new_transaction_id uuid;
    payment_amount numeric(15,2);
    payment_account_id uuid;
    target_invoice_id uuid;
    target_bill_id uuid;
    accounts_receivable_id uuid;
    accounts_payable_id uuid;
BEGIN
    current_user_id := auth.uid();
    payment_amount := (payment_data->>'amount')::numeric;
    payment_account_id := (payment_data->>'payment_account_id')::uuid;
    target_invoice_id := (payment_data->>'invoice_id')::uuid;
    target_bill_id := (payment_data->>'bill_id')::uuid;
    
    -- Create payment record
    INSERT INTO payments (
        user_id, payment_type, invoice_id, bill_id, amount,
        payment_method, payment_account_id, date, reference, notes
    ) VALUES (
        current_user_id,
        (payment_data->>'payment_type')::text,
        target_invoice_id,
        target_bill_id,
        payment_amount,
        (payment_data->>'payment_method')::text,
        payment_account_id,
        (payment_data->>'date')::timestamptz,
        (payment_data->>'reference')::text,
        (payment_data->>'notes')::text
    ) RETURNING id INTO new_payment_id;
    
    -- Create transaction record
    INSERT INTO transactions (user_id, date, description, total_amount)
    VALUES (
        current_user_id,
        (payment_data->>'date')::timestamptz,
        'Payment - ' || (payment_data->>'reference')::text,
        payment_amount
    ) RETURNING id INTO new_transaction_id;
    
    -- Handle customer payment (invoice)
    IF target_invoice_id IS NOT NULL THEN
        -- Get accounts receivable account
        SELECT id INTO accounts_receivable_id 
        FROM accounts 
        WHERE user_id = current_user_id AND type = 'asset' AND name ILIKE '%receivable%'
        LIMIT 1;
        
        -- Debit Cash/Bank Account
        INSERT INTO journal_entries (user_id, transaction_id, account_id, date, debit, description)
        VALUES (
            current_user_id, new_transaction_id, payment_account_id,
            (payment_data->>'date')::timestamptz, payment_amount,
            'Customer payment received'
        );
        
        -- Credit Accounts Receivable
        IF accounts_receivable_id IS NOT NULL THEN
            INSERT INTO journal_entries (user_id, transaction_id, account_id, date, credit, description)
            VALUES (
                current_user_id, new_transaction_id, accounts_receivable_id,
                (payment_data->>'date')::timestamptz, payment_amount,
                'Customer payment applied'
            );
        END IF;
        
        -- Update invoice paid amount
        UPDATE invoices 
        SET paid_amount = paid_amount + payment_amount,
            status = CASE 
                WHEN paid_amount + payment_amount >= total_amount THEN 'paid'
                ELSE status 
            END
        WHERE id = target_invoice_id;
    END IF;
    
    -- Handle vendor payment (bill)
    IF target_bill_id IS NOT NULL THEN
        -- Get accounts payable account
        SELECT id INTO accounts_payable_id 
        FROM accounts 
        WHERE user_id = current_user_id AND type = 'liability' AND name ILIKE '%payable%'
        LIMIT 1;
        
        -- Debit Accounts Payable
        IF accounts_payable_id IS NOT NULL THEN
            INSERT INTO journal_entries (user_id, transaction_id, account_id, date, debit, description)
            VALUES (
                current_user_id, new_transaction_id, accounts_payable_id,
                (payment_data->>'date')::timestamptz, payment_amount,
                'Vendor payment made'
            );
        END IF;
        
        -- Credit Cash/Bank Account
        INSERT INTO journal_entries (user_id, transaction_id, account_id, date, credit, description)
        VALUES (
            current_user_id, new_transaction_id, payment_account_id,
            (payment_data->>'date')::timestamptz, payment_amount,
            'Vendor payment sent'
        );
        
        -- Update bill paid amount
        UPDATE bills 
        SET paid_amount = paid_amount + payment_amount,
            status = CASE 
                WHEN paid_amount + payment_amount >= total_amount THEN 'paid'
                ELSE status 
            END
        WHERE id = target_bill_id;
    END IF;
    
    RETURN new_payment_id;
END;
$$;

-- Function to calculate account balances from journal entries
CREATE OR REPLACE FUNCTION public.get_account_balances(account_type_filter text DEFAULT NULL)
RETURNS TABLE (
    account_id uuid,
    account_name text,
    account_type text,
    account_code text,
    balance numeric(15,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id as account_id,
        a.name as account_name,
        a.type::text as account_type,
        a.code as account_code,
        CASE 
            WHEN a.type IN ('asset', 'expense') THEN 
                COALESCE(SUM(je.debit), 0) - COALESCE(SUM(je.credit), 0)
            ELSE 
                COALESCE(SUM(je.credit), 0) - COALESCE(SUM(je.debit), 0)
        END as balance
    FROM accounts a
    LEFT JOIN journal_entries je ON a.id = je.account_id
    WHERE a.user_id = auth.uid()
        AND (account_type_filter IS NULL OR a.type::text = account_type_filter)
    GROUP BY a.id, a.name, a.type, a.code
    ORDER BY a.code;
END;
$$;