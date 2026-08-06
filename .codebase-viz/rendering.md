# Rendering Architecture

```mermaid
%%{init:{'theme':'base','themeVariables':{'background':'#060810','primaryColor':'#0c1a30','primaryTextColor':'#7dd3fc','primaryBorderColor':'#0e3a6e','edgeLabelBackground':'#0c1a30','lineColor':'#334155','secondaryColor':'#0f172a','clusterBkg':'#060c18','clusterBorder':'#1e3a5f','fontFamily':'JetBrains Mono','fontSize':'14'}}}%%
graph LR
  classDef ssr fill:#0d1a0d,stroke:#16a34a,color:#86efac
  classDef ctrl fill:#042f2e,stroke:#0d9488,color:#5eead4
  classDef csr fill:#2d1200,stroke:#c2410c,color:#fb923c
  classDef ssg fill:#1a0d1a,stroke:#7c3aed,color:#c4b5fd
  classDef isr fill:#1a1a0d,stroke:#ca8a04,color:#fde047
  classDef ppr fill:#0d1a2d,stroke:#2563eb,color:#93c5fd
  classDef unk fill:#1a1a1a,stroke:#6b7280,color:#9ca3af
  classDef pkg fill:#0c1018,stroke:#475569,color:#cbd5e1
  classDef ext fill:#2d1a06,stroke:#d97706,color:#fcd34d
  classDef muted fill:#0a0d14,stroke:#374151,color:#64748b,stroke-dasharray: 3 3
  classDef hdr fill:#06080f,stroke:#1e3a5f,color:#7dd3fc
  subgraph INFRA["☁ VERCEL · Edge Network"]
    subgraph RUNTIME["⚙ Node.js · Server Runtime"]
      subgraph FRAMEWORK["▲ Next.js · App Router"]
        subgraph REACT["⚛ React · SSR Engine"]
          T1_forgot_password["📁 /forgot-password · 1 route"]:::pkg
          T1_login["📁 /login · 1 route"]:::pkg
          T1_reset_password["📁 /reset-password · 1 route"]:::pkg
          T1_signup["📁 /signup · 1 route"]:::pkg
          T1_two_factor["📁 /two-factor · 1 route"]:::pkg
          T1_admin["📁 /admin · 3 routes"]:::pkg
          T1_bible["📁 /bible · 1 route"]:::pkg
          T1_booking["📁 /booking · 1 route"]:::pkg
          T1_calendar["📁 /calendar · 1 route"]:::pkg
          T1_feed["📁 /feed · 1 route"]:::pkg
          T1_groups["📁 /groups · 1 route"]:::pkg
          T1_messages["📁 /messages · 1 route"]:::pkg
          T1_notifications["📁 /notifications · 1 route"]:::pkg
          T1_overview["📁 /overview · 1 route"]:::pkg
          T1_prayer["📁 /prayer · 1 route"]:::pkg
          T1_settings["📁 /settings · 1 route"]:::pkg
          T1_unauthorized["📁 /unauthorized · 1 route"]:::pkg
          T1_worship["📁 /worship · 1 route"]:::pkg
          T1_auth["📁 /auth · 4 routes"]:::pkg
          T1_root["📁 / · 1 route"]:::pkg
          T1_test["📁 /test · 1 route"]:::pkg
          T1_forgot_password ~~~ T1_login ~~~ T1_reset_password ~~~ T1_signup ~~~ T1_two_factor ~~~ T1_admin ~~~ T1_bible ~~~ T1_booking ~~~ T1_calendar ~~~ T1_feed ~~~ T1_groups ~~~ T1_messages ~~~ T1_notifications ~~~ T1_overview ~~~ T1_prayer ~~~ T1_settings ~~~ T1_unauthorized ~~~ T1_worship ~~~ T1_auth ~~~ T1_root ~~~ T1_test
        end
      end
    end
  end
  subgraph DATALAYER["🗄 DATA LAYER"]
    subgraph PRISMA_G["Prisma ORM"]
      PG_DB[("Database")]
    end
  end
  INFRA -.->|"prisma"| PG_DB
```
