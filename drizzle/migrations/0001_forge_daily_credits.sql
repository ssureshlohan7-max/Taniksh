CREATE TABLE public.forge_credits (
  user_id uuid NOT NULL,
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Kolkata')::date,
  used int NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);
GRANT SELECT ON public.forge_credits TO authenticated;
GRANT ALL ON public.forge_credits TO service_role;
ALTER TABLE public.forge_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own credits" ON public.forge_credits FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.forge_credits_left()
RETURNS int LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT 5 - COALESCE((SELECT used FROM public.forge_credits
    WHERE user_id = auth.uid() AND day = (now() AT TIME ZONE 'Asia/Kolkata')::date), 0);
$$;

CREATE OR REPLACE FUNCTION public.consume_forge_credit()
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d date := (now() AT TIME ZONE 'Asia/Kolkata')::date; u int;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  INSERT INTO public.forge_credits(user_id, day, used) VALUES (auth.uid(), d, 1)
  ON CONFLICT (user_id, day) DO UPDATE SET used = forge_credits.used + 1
  WHERE forge_credits.used < 5
  RETURNING used INTO u;
  IF u IS NULL THEN RETURN -1; END IF;
  RETURN 5 - u;
END $$;

CREATE OR REPLACE FUNCTION public.refund_forge_credit()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.forge_credits SET used = GREATEST(used - 1, 0)
  WHERE user_id = auth.uid() AND day = (now() AT TIME ZONE 'Asia/Kolkata')::date;
$$;

REVOKE ALL ON FUNCTION public.forge_credits_left(), public.consume_forge_credit(), public.refund_forge_credit() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.forge_credits_left(), public.consume_forge_credit(), public.refund_forge_credit() TO authenticated;