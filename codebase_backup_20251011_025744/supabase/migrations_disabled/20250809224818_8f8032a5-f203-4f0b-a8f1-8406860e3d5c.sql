-- RLS performance optimization migration
-- Wrap volatile auth.uid() calls with SELECT auth.uid() in existing policies
-- and add useful indexes for columns used in policies

-- 1) financial_transactions
ALTER POLICY "Owners can delete financial data" ON public.financial_transactions
USING (
  yacht_id IN (
    SELECT y.id FROM yacht_profiles y
    WHERE y.owner_id = (SELECT auth.uid())
  )
);

ALTER POLICY "Owners can insert financial data" ON public.financial_transactions
WITH CHECK (
  yacht_id IN (
    SELECT y.id FROM yacht_profiles y
    WHERE y.owner_id = (SELECT auth.uid())
  )
);

ALTER POLICY "Owners can update financial data" ON public.financial_transactions
USING (
  yacht_id IN (
    SELECT y.id FROM yacht_profiles y
    WHERE y.owner_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  yacht_id IN (
    SELECT y.id FROM yacht_profiles y
    WHERE y.owner_id = (SELECT auth.uid())
  )
);

ALTER POLICY "Users can view financial data for their yachts" ON public.financial_transactions
USING (
  yacht_id IN (
    SELECT y.id FROM yacht_profiles y
    WHERE (
      y.owner_id = (SELECT auth.uid())
      OR y.id IN (
        SELECT cm.yacht_id
        FROM crew_members cm
        WHERE cm.user_id = (SELECT auth.uid())
          AND cm."position" = ANY (ARRAY['captain'::text, 'purser'::text])
      )
    )
  )
);

-- 2) fuel_consumption
ALTER POLICY "Owners/engineers can delete fuel data" ON public.fuel_consumption
USING (
  (
    yacht_id IN (
      SELECT y.id FROM yacht_profiles y
      WHERE y.owner_id = (SELECT auth.uid())
    )
  ) OR (
    yacht_id IN (
      SELECT cm.yacht_id
      FROM crew_members cm
      WHERE cm.user_id = (SELECT auth.uid())
        AND cm."position" = ANY (ARRAY['chief_engineer'::text, 'engineer'::text, 'captain'::text])
    )
  )
);

ALTER POLICY "Owners/engineers can insert fuel data" ON public.fuel_consumption
WITH CHECK (
  (
    yacht_id IN (
      SELECT y.id FROM yacht_profiles y
      WHERE y.owner_id = (SELECT auth.uid())
    )
  ) OR (
    yacht_id IN (
      SELECT cm.yacht_id
      FROM crew_members cm
      WHERE cm.user_id = (SELECT auth.uid())
        AND cm."position" = ANY (ARRAY['chief_engineer'::text, 'engineer'::text, 'captain'::text])
    )
  )
);

ALTER POLICY "Owners/engineers can update fuel data" ON public.fuel_consumption
USING (
  (
    yacht_id IN (
      SELECT y.id FROM yacht_profiles y
      WHERE y.owner_id = (SELECT auth.uid())
    )
  ) OR (
    yacht_id IN (
      SELECT cm.yacht_id
      FROM crew_members cm
      WHERE cm.user_id = (SELECT auth.uid())
        AND cm."position" = ANY (ARRAY['chief_engineer'::text, 'engineer'::text, 'captain'::text])
    )
  )
)
WITH CHECK (
  (
    yacht_id IN (
      SELECT y.id FROM yacht_profiles y
      WHERE y.owner_id = (SELECT auth.uid())
    )
  ) OR (
    yacht_id IN (
      SELECT cm.yacht_id
      FROM crew_members cm
      WHERE cm.user_id = (SELECT auth.uid())
        AND cm."position" = ANY (ARRAY['chief_engineer'::text, 'engineer'::text, 'captain'::text])
    )
  )
);

ALTER POLICY "Users can view fuel data for their yachts" ON public.fuel_consumption
USING (
  yacht_id IN (
    SELECT y.id FROM yacht_profiles y
    WHERE (
      y.owner_id = (SELECT auth.uid())
      OR y.id IN (
        SELECT cm.yacht_id
        FROM crew_members cm
        WHERE cm.user_id = (SELECT auth.uid())
      )
    )
  )
);

-- 3) guest_charters
ALTER POLICY "Owners can delete charters" ON public.guest_charters
USING (
  yacht_id IN (
    SELECT y.id FROM yacht_profiles y
    WHERE y.owner_id = (SELECT auth.uid())
  )
);

ALTER POLICY "Owners can insert charters" ON public.guest_charters
WITH CHECK (
  yacht_id IN (
    SELECT y.id FROM yacht_profiles y
    WHERE y.owner_id = (SELECT auth.uid())
  )
);

ALTER POLICY "Owners can update charters" ON public.guest_charters
USING (
  yacht_id IN (
    SELECT y.id FROM yacht_profiles y
    WHERE y.owner_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  yacht_id IN (
    SELECT y.id FROM yacht_profiles y
    WHERE y.owner_id = (SELECT auth.uid())
  )
);

ALTER POLICY "Users can view charters for their yachts" ON public.guest_charters
USING (
  yacht_id IN (
    SELECT y.id FROM yacht_profiles y
    WHERE (
      y.owner_id = (SELECT auth.uid())
      OR y.id IN (
        SELECT cm.yacht_id
        FROM crew_members cm
        WHERE cm.user_id = (SELECT auth.uid())
      )
    )
  )
);

-- 4) crew_members: UPDATE policy already caches auth.uid(); others do not use auth.uid() directly, so no changes needed.

-- Helpful indexes to speed up policy subqueries
CREATE INDEX IF NOT EXISTS idx_yacht_profiles_owner_id ON public.yacht_profiles(owner_id);
CREATE INDEX IF NOT EXISTS idx_crew_members_user_id ON public.crew_members(user_id);
CREATE INDEX IF NOT EXISTS idx_crew_members_yacht_id ON public.crew_members(yacht_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_yacht_id ON public.financial_transactions(yacht_id);
CREATE INDEX IF NOT EXISTS idx_fuel_consumption_yacht_id ON public.fuel_consumption(yacht_id);
CREATE INDEX IF NOT EXISTS idx_guest_charters_yacht_id ON public.guest_charters(yacht_id);
