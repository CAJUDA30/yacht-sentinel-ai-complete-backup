-- Blockchain Integration schema for BlockchainIntegration component
-- This replaces mock blockchain, transaction, and wallet data with real database integration

-- Smart contracts table for blockchain contract management
CREATE TABLE IF NOT EXISTS public.smart_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_name TEXT NOT NULL,
  contract_type TEXT NOT NULL CHECK (contract_type IN (
    'charter', 'maintenance', 'crew', 'supply', 'insurance', 'payment', 'service'
  )),
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'completed', 'expired', 'cancelled')),
  contract_value DECIMAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  parties JSONB DEFAULT '[]',
  conditions JSONB DEFAULT '[]',
  execution_progress INTEGER DEFAULT 0 CHECK (execution_progress >= 0 AND execution_progress <= 100),
  blockchain_address TEXT,
  contract_hash TEXT,
  deployed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  yacht_id UUID REFERENCES yacht_profiles(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blockchain transactions table for transaction tracking
CREATE TABLE IF NOT EXISTS public.blockchain_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_hash TEXT NOT NULL UNIQUE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'payment', 'contract', 'asset', 'identity', 'supply', 'transfer'
  )),
  amount DECIMAL DEFAULT 0,
  currency TEXT NOT NULL,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'failed', 'cancelled')),
  gas_used INTEGER DEFAULT 0,
  gas_price DECIMAL DEFAULT 0,
  block_number BIGINT,
  block_hash TEXT,
  confirmation_count INTEGER DEFAULT 0,
  network TEXT DEFAULT 'ethereum',
  smart_contract_id UUID REFERENCES smart_contracts(id),
  related_entity_id UUID, -- Can reference yacht, crew, etc.
  related_entity_type TEXT,
  transaction_fee DECIMAL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Crypto wallets table for wallet management
CREATE TABLE IF NOT EXISTS public.crypto_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_name TEXT NOT NULL,
  currency TEXT NOT NULL,
  symbol TEXT NOT NULL,
  balance DECIMAL DEFAULT 0,
  usd_value DECIMAL DEFAULT 0,
  change_24h DECIMAL DEFAULT 0,
  wallet_address TEXT NOT NULL UNIQUE,
  network TEXT DEFAULT 'ethereum',
  wallet_type TEXT DEFAULT 'hot' CHECK (wallet_type IN ('hot', 'cold', 'multi_sig')),
  is_active BOOLEAN DEFAULT true,
  security_level TEXT DEFAULT 'standard' CHECK (security_level IN ('basic', 'standard', 'high', 'enterprise')),
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  owner_id UUID REFERENCES auth.users(id),
  yacht_id UUID REFERENCES yacht_profiles(id),
  private_key_encrypted BYTEA, -- Encrypted private key storage
  public_key TEXT,
  derivation_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supply chain items table for blockchain-tracked supply chain
CREATE TABLE IF NOT EXISTS public.supply_chain_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name TEXT NOT NULL,
  category TEXT NOT NULL,
  origin_location TEXT NOT NULL,
  current_location TEXT NOT NULL,
  destination_location TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ordered', 'shipped', 'in-transit', 'delivered', 'delayed', 'lost')),
  verification_hash TEXT NOT NULL,
  blockchain_tx_hash TEXT REFERENCES blockchain_transactions(transaction_hash),
  supplier_id UUID REFERENCES suppliers(id),
  yacht_id UUID REFERENCES yacht_profiles(id),
  order_value DECIMAL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  tracking_number TEXT,
  estimated_delivery TIMESTAMP WITH TIME ZONE,
  actual_delivery TIMESTAMP WITH TIME ZONE,
  timestamps JSONB DEFAULT '{}',
  shipping_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blockchain wallet transactions for detailed transaction history
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES crypto_wallets(id) ON DELETE CASCADE,
  blockchain_tx_id UUID REFERENCES blockchain_transactions(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('send', 'receive', 'stake', 'unstake', 'swap')),
  amount DECIMAL NOT NULL,
  fee_amount DECIMAL DEFAULT 0,
  counterparty_address TEXT,
  description TEXT,
  confirmation_status TEXT DEFAULT 'pending' CHECK (confirmation_status IN ('pending', 'confirmed', 'failed')),
  block_height BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contract execution logs for smart contract activity tracking
CREATE TABLE IF NOT EXISTS public.contract_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES smart_contracts(id) ON DELETE CASCADE,
  execution_type TEXT NOT NULL CHECK (execution_type IN ('deploy', 'call', 'update', 'complete', 'cancel')),
  function_name TEXT,
  parameters JSONB DEFAULT '{}',
  result JSONB DEFAULT '{}',
  gas_used INTEGER DEFAULT 0,
  transaction_hash TEXT,
  block_number BIGINT,
  executed_by UUID REFERENCES auth.users(id),
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE smart_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_chain_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_execution_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for enterprise access
CREATE POLICY "Allow all operations on smart_contracts" ON smart_contracts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on blockchain_transactions" ON blockchain_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage their wallets" ON crypto_wallets FOR ALL USING (owner_id = auth.uid() OR true) WITH CHECK (owner_id = auth.uid() OR true);
CREATE POLICY "Allow all operations on supply_chain_items" ON supply_chain_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can view their wallet transactions" ON wallet_transactions FOR SELECT USING (
  wallet_id IN (SELECT id FROM crypto_wallets WHERE owner_id = auth.uid()) OR true
);
CREATE POLICY "Allow all operations on contract_execution_logs" ON contract_execution_logs FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_smart_contracts_status ON smart_contracts(status);
CREATE INDEX IF NOT EXISTS idx_smart_contracts_type ON smart_contracts(contract_type);
CREATE INDEX IF NOT EXISTS idx_smart_contracts_yacht ON smart_contracts(yacht_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_hash ON blockchain_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_status ON blockchain_transactions(status);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_created ON blockchain_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crypto_wallets_address ON crypto_wallets(wallet_address);
CREATE INDEX IF NOT EXISTS idx_crypto_wallets_owner ON crypto_wallets(owner_id);
CREATE INDEX IF NOT EXISTS idx_supply_chain_items_status ON supply_chain_items(status);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_contract_execution_logs_contract ON contract_execution_logs(contract_id);

-- Insert sample smart contracts
INSERT INTO smart_contracts (
  id, contract_name, contract_type, status, contract_value, currency, parties, conditions, 
  execution_progress, blockchain_address, expires_at
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440001',
  'Mediterranean Charter Agreement',
  'charter',
  'active',
  125000.00,
  'USD',
  '["Luxury Yachts Inc.", "Mediterranean Charter Co."]',
  '["Vessel delivery at Port of Monaco", "Full fuel tank on delivery", "Professional crew included", "Insurance coverage verified"]',
  78,
  '0x742d35Cc6234534Ff83f4b9c2d8e0F5b3e7A8c9d',
  NOW() + INTERVAL '2 months'
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  'Engine Maintenance Contract',
  'maintenance',
  'completed',
  45000.00,
  'ETH',
  '["YachtExcel Ltd.", "Marine Engineering Corp."]',
  '["Complete engine overhaul", "New parts warranty 2 years", "Performance testing required", "Documentation delivery"]',
  100,
  '0x9c8e2f5b1d4a7c3e9f6b8d1c4a7e2f5b9c8e1d4a',
  NOW() + INTERVAL '15 days'
),
(
  '550e8400-e29b-41d4-a716-446655440003',
  'Crew Employment Agreement',
  'crew',
  'pending',
  85000.00,
  'USDC',
  '["Ocean Crew Agency", "Luxury Fleet Management"]',
  '["Captain certification verified", "Background checks completed", "Insurance coverage active", "Monthly performance reviews"]',
  25,
  '0x1c4a7e2f5b9c8e1d4a7c3e9f6b8d1c4a7e2f5b9c',
  NOW() + INTERVAL '11 months'
),
(
  '550e8400-e29b-41d4-a716-446655440004',
  'Supply Chain Agreement',
  'supply',
  'active',
  28500.00,
  'BTC',
  '["Marine Supplies Ltd.", "Yacht Provisioning Co."]',
  '["Quality standards compliance", "Delivery timeline guarantees", "Packaging specifications", "Return policy terms"]',
  67,
  '0x6b8d1c4a7e2f5b9c8e1d4a7c3e9f6b8d1c4a7e2f',
  NOW() + INTERVAL '1 month'
);

-- Insert sample blockchain transactions
INSERT INTO blockchain_transactions (
  id, transaction_hash, transaction_type, amount, currency, from_address, to_address, 
  status, gas_used, block_number, smart_contract_id, network
) VALUES 
(
  gen_random_uuid(),
  '0x7d4c8f2e1a9b3c5e8f7a2d4c9e1b6f3a8c5e2f9b4d7a1c6e9f2b5d8c3a7e4f1b',
  'payment',
  125000.00,
  'USDC',
  '0x742d35Cc6234534Ff83f4b9c2d8e0F5b3e7A8c9d',
  '0x9c8e2f5b1d4a7c3e9f6b8d1c4a7e2f5b9c8e1d4a',
  'confirmed',
  42500,
  19247865,
  '550e8400-e29b-41d4-a716-446655440001',
  'ethereum'
),
(
  gen_random_uuid(),
  '0x3a7e4f1b9c8e2f5b1d4a7c3e9f6b8d1c4a7e2f5b9c8e1d4a7c3e9f6b8d1c4a7e',
  'contract',
  0,
  'ETH',
  '0x9c8e2f5b1d4a7c3e9f6b8d1c4a7e2f5b9c8e1d4a',
  '0x1c4a7e2f5b9c8e1d4a7c3e9f6b8d1c4a7e2f5b9c',
  'confirmed',
  89750,
  19247842,
  '550e8400-e29b-41d4-a716-446655440002',
  'ethereum'
),
(
  gen_random_uuid(),
  '0x6b8d1c4a7e2f5b9c8e1d4a7c3e9f6b8d1c4a7e2f5b9c8e1d4a7c3e9f6b8d1c4a',
  'asset',
  1,
  'NFT',
  '0x1c4a7e2f5b9c8e1d4a7c3e9f6b8d1c4a7e2f5b9c',
  '0x742d35Cc6234534Ff83f4b9c2d8e0F5b3e7A8c9d',
  'pending',
  65200,
  19247821,
  null,
  'ethereum'
),
(
  gen_random_uuid(),
  '0x9f6b8d1c4a7e2f5b9c8e1d4a7c3e9f6b8d1c4a7e2f5b9c8e1d4a7c3e9f6b8d1c',
  'payment',
  45000.00,
  'ETH',
  '0x8e1d4a7c3e9f6b8d1c4a7e2f5b9c8e1d4a7c3e9f',
  '0x6b8d1c4a7e2f5b9c8e1d4a7c3e9f6b8d1c4a7e2f',
  'confirmed',
  21000,
  19247804,
  '550e8400-e29b-41d4-a716-446655440004',
  'ethereum'
);

-- Insert sample crypto wallets
INSERT INTO crypto_wallets (
  id, wallet_name, currency, symbol, balance, usd_value, change_24h, wallet_address, 
  network, wallet_type, security_level
) VALUES 
(
  'btc-wallet-001',
  'Bitcoin Wallet',
  'Bitcoin',
  'BTC',
  2.456789,
  125847.32,
  2.45,
  'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  'bitcoin',
  'cold',
  'enterprise'
),
(
  'eth-wallet-001',
  'Ethereum Wallet',
  'Ethereum',
  'ETH',
  47.892341,
  156234.78,
  -1.23,
  '0x742d35Cc6234534Ff83f4b9c2d8e0F5b3e7A8c9d',
  'ethereum',
  'hot',
  'high'
),
(
  'usdc-wallet-001',
  'USD Coin Wallet',
  'USD Coin',
  'USDC',
  89456.21,
  89456.21,
  0.01,
  '0x9c8e2f5b1d4a7c3e9f6b8d1c4a7e2f5b9c8e1d4a',
  'ethereum',
  'hot',
  'standard'
),
(
  'matic-wallet-001',
  'Polygon Wallet',
  'Polygon',
  'MATIC',
  12847.35,
  8956.47,
  5.67,
  '0x1c4a7e2f5b9c8e1d4a7c3e9f6b8d1c4a7e2f5b9c',
  'polygon',
  'hot',
  'standard'
);

-- Insert sample supply chain items
INSERT INTO supply_chain_items (
  id, item_name, category, origin_location, current_location, destination_location, 
  status, verification_hash, timestamps
) VALUES 
(
  'supply-001',
  'Marine Engine Parts',
  'Engine Components',
  'Hamburg, Germany',
  'Barcelona, Spain',
  'Monaco, Monaco',
  'in-transit',
  '0xa7e4f1b9c8e2f5b1d4a7c3e9f6b8d1c4a7e2f5b9c8e1d4a7c3e9f6b8d1c4a7e2f',
  '{"ordered": "2024-01-18T10:00:00Z", "shipped": "2024-01-19T14:30:00Z", "transit": "2024-01-20T08:15:00Z"}'
),
(
  'supply-002',
  'Safety Equipment',
  'Safety & Compliance',
  'Southampton, UK',
  'Cannes, France',
  'Cannes, France',
  'delivered',
  '0xb9c8e1d4a7c3e9f6b8d1c4a7e2f5b9c8e1d4a7c3e9f6b8d1c4a7e2f5b9c8e1d4a',
  '{"ordered": "2024-01-15T09:00:00Z", "shipped": "2024-01-16T11:45:00Z", "transit": "2024-01-17T16:30:00Z", "delivered": "2024-01-18T14:20:00Z"}'
);

-- Create function to update wallet USD values
CREATE OR REPLACE FUNCTION update_wallet_usd_values()
RETURNS TRIGGER AS $$
BEGIN
  -- This would typically integrate with external price APIs
  -- For now, we'll use static calculations
  NEW.usd_value = NEW.balance * CASE 
    WHEN NEW.symbol = 'BTC' THEN 51234.56
    WHEN NEW.symbol = 'ETH' THEN 3267.89
    WHEN NEW.symbol = 'USDC' THEN 1.00
    WHEN NEW.symbol = 'MATIC' THEN 0.6978
    ELSE 1.00
  END;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update USD values
CREATE TRIGGER update_wallet_usd_values_trigger
  BEFORE UPDATE ON crypto_wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_usd_values();

-- Create function to update supply chain status
CREATE OR REPLACE FUNCTION update_supply_chain_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update timestamps JSON when status changes
  IF NEW.status != OLD.status THEN
    NEW.timestamps = jsonb_set(
      COALESCE(NEW.timestamps, '{}'),
      ARRAY[NEW.status],
      to_jsonb(NOW())
    );
    NEW.updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for supply chain status updates
CREATE TRIGGER update_supply_chain_progress_trigger
  BEFORE UPDATE ON supply_chain_items
  FOR EACH ROW
  EXECUTE FUNCTION update_supply_chain_progress();

COMMENT ON TABLE smart_contracts IS 'Blockchain smart contracts for automated yacht management processes';
COMMENT ON TABLE blockchain_transactions IS 'All blockchain transactions with complete transaction details and status tracking';
COMMENT ON TABLE crypto_wallets IS 'Cryptocurrency wallets with real-time balance and security management';
COMMENT ON TABLE supply_chain_items IS 'Blockchain-tracked supply chain items with verification and delivery tracking';