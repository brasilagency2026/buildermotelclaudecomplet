-- ============================================================
-- MOTELSBRASIL — SCHEMA SUPABASE (v2 — fixed IMMUTABLE index)
-- Execute no SQL Editor do Supabase
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Wrapper IMMUTABLE necessário para usar unaccent em índices
CREATE OR REPLACE FUNCTION immutable_unaccent(text)
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS $$
  SELECT unaccent($1)
$$;

-- ── OWNERS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS owners (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  nome       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_self" ON owners FOR ALL USING (auth.uid() = id);

-- ── MOTEIS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS moteis (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug                   TEXT UNIQUE NOT NULL,
  owner_id               UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  nome                   TEXT NOT NULL,
  slogan                 TEXT,
  descricao              TEXT,
  endereco               TEXT NOT NULL,
  cidade                 TEXT NOT NULL,
  estado                 TEXT NOT NULL,
  cep                    TEXT,
  lat                    FLOAT,
  lng                    FLOAT,
  telefone               TEXT,
  whatsapp               TEXT,
  site_externo           TEXT,
  usa_builder            BOOLEAN DEFAULT FALSE,
  foto_capa              TEXT,
  fotos_galeria          TEXT[] DEFAULT '{}',
  status                 TEXT DEFAULT 'pending' CHECK (status IN ('pending','active','inactive')),
  paypal_subscription_id TEXT,
  paypal_status          TEXT DEFAULT 'inactive' CHECK (paypal_status IN ('inactive','active','cancelled')),
  paypal_next_billing    TIMESTAMPTZ,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

-- Índices simples (sem funções não-immutable)
CREATE INDEX IF NOT EXISTS moteis_slug_idx   ON moteis(slug);
CREATE INDEX IF NOT EXISTS moteis_owner_idx  ON moteis(owner_id);
CREATE INDEX IF NOT EXISTS moteis_estado_idx ON moteis(estado);
CREATE INDEX IF NOT EXISTS moteis_status_idx ON moteis(status);
CREATE INDEX IF NOT EXISTS moteis_latng_idx  ON moteis(lat, lng);

-- Índice full-text usando o wrapper IMMUTABLE
CREATE INDEX IF NOT EXISTS moteis_fts_idx ON moteis USING gin(
  to_tsvector('portuguese',
    immutable_unaccent(coalesce(nome,'')) || ' ' ||
    immutable_unaccent(coalesce(cidade,'')) || ' ' ||
    coalesce(estado,'')
  )
);

ALTER TABLE moteis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "moteis_public_read" ON moteis FOR SELECT USING (status = 'active');
CREATE POLICY "moteis_owner_write" ON moteis FOR ALL    USING (auth.uid() = owner_id);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS moteis_updated_at ON moteis;
CREATE TRIGGER moteis_updated_at
  BEFORE UPDATE ON moteis
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── SUITES ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suites (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  motel_id   UUID NOT NULL REFERENCES moteis(id) ON DELETE CASCADE,
  nome       TEXT NOT NULL,
  descricao  TEXT,
  servicos   TEXT,
  fotos      TEXT[] DEFAULT '{}',
  ordem      INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tarifas (
  id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suite_id UUID NOT NULL REFERENCES suites(id) ON DELETE CASCADE,
  periodo  TEXT NOT NULL,
  preco    NUMERIC(10,2) NOT NULL,
  ordem    INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS suites_motel_idx  ON suites(motel_id);
CREATE INDEX IF NOT EXISTS tarifas_suite_idx ON tarifas(suite_id);

ALTER TABLE suites  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarifas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suites_public_read" ON suites FOR SELECT USING (
  EXISTS (SELECT 1 FROM moteis m WHERE m.id = motel_id AND m.status = 'active')
);
CREATE POLICY "suites_owner_write" ON suites FOR ALL USING (
  EXISTS (SELECT 1 FROM moteis m WHERE m.id = motel_id AND m.owner_id = auth.uid())
);
CREATE POLICY "tarifas_public_read" ON tarifas FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM suites s
    JOIN moteis m ON m.id = s.motel_id
    WHERE s.id = suite_id AND m.status = 'active'
  )
);
CREATE POLICY "tarifas_owner_write" ON tarifas FOR ALL USING (
  EXISTS (
    SELECT 1 FROM suites s
    JOIN moteis m ON m.id = s.motel_id
    WHERE s.id = suite_id AND m.owner_id = auth.uid()
  )
);

-- ── STORAGE ───────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('motel-fotos', 'motel-fotos', true)
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "fotos_public_read"  ON storage.objects;
DROP POLICY IF EXISTS "fotos_auth_upload"  ON storage.objects;
DROP POLICY IF EXISTS "fotos_owner_delete" ON storage.objects;

CREATE POLICY "fotos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'motel-fotos');
CREATE POLICY "fotos_auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'motel-fotos' AND auth.role() = 'authenticated');
CREATE POLICY "fotos_owner_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'motel-fotos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ── SEARCH FUNCTION ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION search_moteis(
  p_busca  TEXT    DEFAULT NULL,
  p_estado TEXT    DEFAULT NULL,
  p_cidade TEXT    DEFAULT NULL,
  p_lat    FLOAT   DEFAULT NULL,
  p_lng    FLOAT   DEFAULT NULL,
  p_limit  INT     DEFAULT 24,
  p_offset INT     DEFAULT 0
)
RETURNS TABLE (
  id            UUID,
  slug          TEXT,
  nome          TEXT,
  cidade        TEXT,
  estado        TEXT,
  endereco      TEXT,
  whatsapp      TEXT,
  telefone      TEXT,
  foto_capa     TEXT,
  fotos_galeria TEXT[],
  lat           FLOAT,
  lng           FLOAT,
  preco_inicial NUMERIC,
  distancia_km  FLOAT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id, m.slug, m.nome, m.cidade, m.estado,
    m.endereco, m.whatsapp, m.telefone,
    m.foto_capa, m.fotos_galeria, m.lat, m.lng,
    (SELECT MIN(t.preco)
     FROM suites s JOIN tarifas t ON t.suite_id = s.id
     WHERE s.motel_id = m.id) AS preco_inicial,
    CASE
      WHEN p_lat IS NOT NULL AND p_lng IS NOT NULL AND m.lat IS NOT NULL THEN
        6371 * 2 * ASIN(SQRT(
          POWER(SIN((m.lat - p_lat) * PI() / 180 / 2), 2) +
          COS(p_lat * PI() / 180) * COS(m.lat * PI() / 180) *
          POWER(SIN((m.lng - p_lng) * PI() / 180 / 2), 2)
        ))
      ELSE NULL
    END AS distancia_km
  FROM moteis m
  WHERE
    m.status = 'active'
    AND (p_estado IS NULL OR m.estado = p_estado)
    AND (p_cidade IS NULL OR
         lower(immutable_unaccent(m.cidade)) ILIKE '%' || lower(immutable_unaccent(p_cidade)) || '%')
    AND (p_busca IS NULL OR
         to_tsvector('portuguese', immutable_unaccent(m.nome) || ' ' || immutable_unaccent(m.cidade))
         @@ plainto_tsquery('portuguese', immutable_unaccent(p_busca)))
  ORDER BY distancia_km ASC NULLS LAST, m.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- ── GET MOTEL COMPLETO ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_motel_completo(p_slug TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_motel moteis%ROWTYPE;
  v_suites JSON;
BEGIN
  SELECT * INTO v_motel FROM moteis WHERE slug = p_slug AND status = 'active';
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT json_agg(
    json_build_object(
      'id',        s.id,
      'nome',      s.nome,
      'descricao', s.descricao,
      'servicos',  s.servicos,
      'fotos',     s.fotos,
      'ordem',     s.ordem,
      'tarifas', (
        SELECT json_agg(
          json_build_object('periodo', t.periodo, 'preco', t.preco)
          ORDER BY t.ordem
        )
        FROM tarifas t WHERE t.suite_id = s.id
      )
    ) ORDER BY s.ordem
  ) INTO v_suites
  FROM suites s WHERE s.motel_id = v_motel.id;

  RETURN row_to_json(v_motel)::jsonb
    || jsonb_build_object('suites', COALESCE(v_suites, '[]'::json));
END;
$$;
