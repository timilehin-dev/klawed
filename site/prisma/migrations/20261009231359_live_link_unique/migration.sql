-- One live listing per link, enforced by the database rather than the route.
--
-- The Content API's duplicate check is a findFirst followed by a create — two
-- round trips, so it is not atomic. Two concurrent POSTs carrying the same link
-- both pass the check and both insert, which is exactly the retry storm the
-- poster's 409 contract (TRD §4) exists to absorb.
--
-- PARTIAL, not a plain unique index, because the rule is about LIVE listings:
-- an expired row keeps its link (listings are never hard-deleted, TRD §3) and
-- must not block a future listing reusing that URL. Prisma's schema language
-- cannot express a partial index, which is why this is raw SQL. Prisma reports
-- no diff for it, so the migration is created empty and this file carries the
-- index.
--
-- The route catches the resulting P2002 and returns a clean 409, so the poster
-- still sees the idempotency contract it expects.

CREATE UNIQUE INDEX IF NOT EXISTS "live_link_unique"
  ON "Listing" ("link")
  WHERE "status" = 'live';