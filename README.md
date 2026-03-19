# 🏨 MotéisBrasil — Portal + Site Builder

Portal geolocalizado de motéis no Brasil com site builder integrado.

## Stack
| Camada | Tech |
|--------|------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Auth + DB | Supabase (Postgres + Auth + Storage) |
| Pagamento | PayPal Subscriptions (R$ 50/mês) |
| Deploy | Vercel (região `gru1` — São Paulo) |
| Maps | Google Maps JS API + Places + Geocoding |
| SEO | ISR + JSON-LD + Sitemap dinâmico + slugs |

---

## Estrutura
```
src/
├── app/
│   ├── page.tsx                        # Portal (home)
│   ├── cadastro/page.tsx               # Inscrição gratuita
│   ├── login/page.tsx                  # Login proprietários
│   ├── dashboard/page.tsx              # Painel do proprietário
│   ├── dashboard/novo/page.tsx         # Criar motel + builder
│   ├── dashboard/editar/[id]/page.tsx  # Editar motel + builder
│   ├── motel/[slug]/page.tsx           # Vitrine SEO do motel
│   ├── not-found.tsx
│   └── api/
│       ├── moteis/route.ts             # CRUD motéis
│       ├── suites/route.ts             # Salvar suítes + tarifas
│       ├── upload/route.ts             # Upload → Supabase Storage
│       ├── auth/route.ts               # Auth helper
│       ├── paypal/route.ts             # Criar subscription
│       ├── paypal/webhook/route.ts     # Webhook PayPal
│       └── sitemap/route.ts            # Sitemap XML dinâmico
├── components/
│   ├── shared/     NavBar, Footer, LoginForm
│   ├── portal/     HeroSearch, MoteisList, MapSection, CTASection, CadastroFlow
│   ├── builder/    BuilderForm, DashboardClient, PayPalSubscribe
│   └── vitrine/    MotelVitrine
├── lib/
│   ├── supabase.ts  Browser + Server + Admin clients
│   └── utils.ts     makeSlug, fmtBRL, wppLink, mapsLink, wazeLink
└── types/index.ts
```

---

## 🚀 Setup em 5 passos

### 1. Instalar
```bash
git clone <repo>
cd motelsbrasil
npm install
cp .env.local.example .env.local
```

### 2. Supabase
1. Crie projeto em [supabase.com](https://supabase.com)
2. **SQL Editor** → cole `supabase/schema.sql` → Run
3. Copie **Project URL** e **anon key** para `.env.local`
4. Copie **service_role key** para `SUPABASE_SERVICE_ROLE_KEY`

### 3. Google Maps
1. [console.cloud.google.com](https://console.cloud.google.com)
2. Ative: **Maps JavaScript API**, **Places API**, **Geocoding API**
3. Crie chave → restrinja ao seu domínio em produção
4. Cole em `NEXT_PUBLIC_GOOGLE_MAPS_KEY`

### 4. PayPal
1. [developer.paypal.com](https://developer.paypal.com) → Create App
2. **Criar plano de assinatura**:
   - Dashboard PayPal → Catálogo de Produtos → Novo produto: "Site MotéisBrasil"
   - Criar Plano → R$ 50,00 BRL / mensal recorrente
   - Copie o `Plan ID` → `NEXT_PUBLIC_PAYPAL_PLAN_ID` e `PAYPAL_PLAN_ID`
3. **Webhook** em developer.paypal.com → Meu App → Webhooks → Add:
   - URL: `https://seudominio.com/api/paypal/webhook`
   - Eventos: `BILLING.SUBSCRIPTION.ACTIVATED`, `BILLING.SUBSCRIPTION.CANCELLED`, `PAYMENT.SALE.COMPLETED`

### 5. Deploy Vercel
```bash
npx vercel --prod
```
Ou conecte o repositório GitHub no painel Vercel e configure as variáveis de ambiente.

> ⚡ **Região recomendada:** `gru1` (São Paulo) — já configurada em `vercel.json`

---

## 💡 Fluxo de negócio

```
Visitante acessa o portal
└── Motéis listados por proximidade (geolocalização)
    └── Card → Vitrine SEO (/motel/nome-uf-cidade)
        └── Reserva pelo WhatsApp

Proprietário se cadastra (GRATUITO)
├── Já tem site? → Cadastro direto → Aparece no portal grátis
└── Sem site?   → Vai para o Builder
    └── Preenche suítes, fotos, tarifas
        └── Paga R$ 50/mês via PayPal
            └── Webhook ativa o motel → Aparece no portal
```

---

## 🔑 Variáveis de ambiente necessárias

| Variável | Onde obter |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Google Cloud Console |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | PayPal Developer Dashboard |
| `PAYPAL_CLIENT_SECRET` | PayPal Developer Dashboard |
| `NEXT_PUBLIC_PAYPAL_PLAN_ID` | PayPal → Planos de assinatura |
| `PAYPAL_PLAN_ID` | PayPal → Planos de assinatura |
| `NEXT_PUBLIC_SITE_URL` | Seu domínio (ex: https://motelsbrasil.com.br) |
