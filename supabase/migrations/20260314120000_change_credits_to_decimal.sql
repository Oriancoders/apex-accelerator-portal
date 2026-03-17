-- Change credit_cost and related columns to support decimals

-- Tickets: credit_cost
ALTER TABLE tickets 
ALTER COLUMN credit_cost TYPE numeric(10, 2) USING credit_cost::numeric;

-- Profiles: credits
ALTER TABLE profiles 
ALTER COLUMN credits TYPE numeric(10, 2) USING credits::numeric;

-- Credit Transactions: amount
ALTER TABLE credit_transactions 
ALTER COLUMN amount TYPE numeric(10, 2) USING amount::numeric;

-- Agent Company Assignments: commission_percent
ALTER TABLE agent_company_assignments 
ALTER COLUMN commission_percent TYPE numeric(5, 2) USING commission_percent::numeric;
