
-- 1) public.yacht_profiles
-- Replace broad ALL policy with granular policies and keep existing SELECT policy
DROP POLICY IF EXISTS "Owners can manage their yachts" ON public.yacht_profiles;

CREATE POLICY "Yacht owners can insert their yachts"
  ON public.yacht_profiles
  FOR INSERT
  TO public
  WITH CHECK ((owner_id = (SELECT auth.uid())));

CREATE POLICY "Yacht owners can update their yachts"
  ON public.yacht_profiles
  FOR UPDATE
  TO public
  USING ((owner_id = (SELECT auth.uid())))
  WITH CHECK ((owner_id = (SELECT auth.uid())));

CREATE POLICY "Yacht owners can delete their yachts"
  ON public.yacht_profiles
  FOR DELETE
  TO public
  USING ((owner_id = (SELECT auth.uid())));

-- Existing SELECT policy stays as-is (no direct auth.uid() used)
-- "Users can view accessible yachts"


-- 2) public.financial_transactions
-- Split ALL into granular policies; keep and optimize single SELECT policy
DROP POLICY IF EXISTS "Yacht owners can manage financial data" ON public.financial_transactions;

CREATE POLICY "Owners can insert financial data"
  ON public.financial_transactions
  FOR INSERT
  TO public
  WITH CHECK (
    yacht_id IN (
      SELECT y.id
      FROM yacht_profiles y
      WHERE y.owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Owners can update financial data"
  ON public.financial_transactions
  FOR UPDATE
  TO public
  USING (
    yacht_id IN (
      SELECT y.id
      FROM yacht_profiles y
      WHERE y.owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    yacht_id IN (
      SELECT y.id
      FROM yacht_profiles y
      WHERE y.owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Owners can delete financial data"
  ON public.financial_transactions
  FOR DELETE
  TO public
  USING (
    yacht_id IN (
      SELECT y.id
      FROM yacht_profiles y
      WHERE y.owner_id = (SELECT auth.uid())
    )
  );

ALTER POLICY "Users can view financial data for their yachts"
  ON public.financial_transactions
  USING (
    yacht_id IN (
      SELECT y.id
      FROM yacht_profiles y
      WHERE
        y.owner_id = (SELECT auth.uid())
        OR y.id IN (
          SELECT cm.yacht_id
          FROM crew_members cm
          WHERE cm.user_id = (SELECT auth.uid())
            AND cm."position" IN ('captain','purser')
        )
    )
  );


-- 3) public.fuel_consumption
-- Split ALL into granular policies; optimize SELECT policy
DROP POLICY IF EXISTS "Yacht owners and engineers can manage fuel data" ON public.fuel_consumption;

CREATE POLICY "Owners/engineers can insert fuel data"
  ON public.fuel_consumption
  FOR INSERT
  TO public
  WITH CHECK (
    yacht_id IN (
      SELECT y.id FROM yacht_profiles y
      WHERE y.owner_id = (SELECT auth.uid())
    )
    OR yacht_id IN (
      SELECT cm.yacht_id
      FROM crew_members cm
      WHERE cm.user_id = (SELECT auth.uid())
        AND cm."position" IN ('chief_engineer', 'engineer', 'captain')
    )
  );

CREATE POLICY "Owners/engineers can update fuel data"
  ON public.fuel_consumption
  FOR UPDATE
  TO public
  USING (
    yacht_id IN (
      SELECT y.id FROM yacht_profiles y
      WHERE y.owner_id = (SELECT auth.uid())
    )
    OR yacht_id IN (
      SELECT cm.yacht_id
      FROM crew_members cm
      WHERE cm.user_id = (SELECT auth.uid())
        AND cm."position" IN ('chief_engineer', 'engineer', 'captain')
    )
  )
  WITH CHECK (
    yacht_id IN (
      SELECT y.id FROM yacht_profiles y
      WHERE y.owner_id = (SELECT auth.uid())
    )
    OR yacht_id IN (
      SELECT cm.yacht_id
      FROM crew_members cm
      WHERE cm.user_id = (SELECT auth.uid())
        AND cm."position" IN ('chief_engineer', 'engineer', 'captain')
    )
  );

CREATE POLICY "Owners/engineers can delete fuel data"
  ON public.fuel_consumption
  FOR DELETE
  TO public
  USING (
    yacht_id IN (
      SELECT y.id FROM yacht_profiles y
      WHERE y.owner_id = (SELECT auth.uid())
    )
    OR yacht_id IN (
      SELECT cm.yacht_id
      FROM crew_members cm
      WHERE cm.user_id = (SELECT auth.uid())
        AND cm."position" IN ('chief_engineer', 'engineer', 'captain')
    )
  );

ALTER POLICY "Users can view fuel data for their yachts"
  ON public.fuel_consumption
  USING (
    yacht_id IN (
      SELECT y.id
      FROM yacht_profiles y
      WHERE
        y.owner_id = (SELECT auth.uid())
        OR y.id IN (
          SELECT cm.yacht_id
          FROM crew_members cm
          WHERE cm.user_id = (SELECT auth.uid())
        )
    )
  );


-- 4) public.guest_charters
-- Split ALL into granular policies; optimize SELECT policy
DROP POLICY IF EXISTS "Yacht owners can manage charters" ON public.guest_charters;

CREATE POLICY "Owners can insert charters"
  ON public.guest_charters
  FOR INSERT
  TO public
  WITH CHECK (
    yacht_id IN (
      SELECT y.id FROM yacht_profiles y
      WHERE y.owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Owners can update charters"
  ON public.guest_charters
  FOR UPDATE
  TO public
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

CREATE POLICY "Owners can delete charters"
  ON public.guest_charters
  FOR DELETE
  TO public
  USING (
    yacht_id IN (
      SELECT y.id FROM yacht_profiles y
      WHERE y.owner_id = (SELECT auth.uid())
    )
  );

ALTER POLICY "Users can view charters for their yachts"
  ON public.guest_charters
  USING (
    yacht_id IN (
      SELECT y.id
      FROM yacht_profiles y
      WHERE
        y.owner_id = (SELECT auth.uid())
        OR y.id IN (
          SELECT cm.yacht_id
          FROM crew_members cm
          WHERE cm.user_id = (SELECT auth.uid())
        )
    )
  );


-- 5) public.crew_members
-- Optimize UPDATE policy to cache auth.uid()
ALTER POLICY "crew_members_update_policy"
  ON public.crew_members
  USING (
    (
      yacht_id IN (
        SELECT g.yacht_id
        FROM get_user_yacht_access_safe() AS g(yacht_id, access_level)
        WHERE g.access_level = 'owner'
      )
    )
    OR (
      user_id = (SELECT auth.uid())
      AND "position" IN ('captain','first_officer')
    )
  );


-- 6) public.yacht_positions
-- Optimize SELECT policy to cache auth.uid()
ALTER POLICY "Users can view positions for their yachts"
  ON public.yacht_positions
  USING (
    yacht_id IN (
      SELECT y.id
      FROM yacht_profiles y
      WHERE
        y.owner_id = (SELECT auth.uid())
        OR y.id IN (
          SELECT cm.yacht_id
          FROM crew_members cm
          WHERE cm.user_id = (SELECT auth.uid())
        )
    )
  );


-- 7) public.system_settings
-- Optimize ALL policy to cache auth.uid()
ALTER POLICY "Users can manage their yacht settings"
  ON public.system_settings
  USING (
    yacht_id IN (
      SELECT y.id
      FROM yacht_profiles y
      WHERE y.owner_id = (SELECT auth.uid())
    )
  );
