# Screen–Component Mapping

```mermaid
%%{init:{'theme':'base','themeVariables':{'background':'#060810','primaryColor':'#0c1a30','primaryTextColor':'#7dd3fc','primaryBorderColor':'#0e3a6e','edgeLabelBackground':'#0c1a30','lineColor':'#334155','secondaryColor':'#0f172a','clusterBkg':'#060c18','clusterBorder':'#1e3a5f','fontFamily':'JetBrains Mono','fontSize':'14'},'flowchart':{'nodeSpacing':40,'rankSpacing':24,'padding':8}}}%%
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
  leaf_route_app__auth__forgot_password_page["forgot-password · CSR<br/>🔗 /forgot-password<br/>📂 app/(auth)/forgot-password<br/>📄 page.tsx"]:::csr
  file_component_components_ui_button_tsx_Button["📂 components/ui<br/>📄 button.tsx"]:::pkg
  file_component_components_ui_card_tsx_Card["📂 components/ui<br/>📄 card.tsx"]:::pkg
  file_component_components_ui_input_tsx_Input["📂 components/ui<br/>📄 input.tsx"]:::pkg
  file_component_components_ui_label_tsx_Label["📂 components/ui<br/>📄 label.tsx"]:::pkg
  leaf_route_app__auth__login_page["login · CSR<br/>🔗 /login<br/>📂 app/(auth)/login<br/>📄 page.tsx"]:::csr
  leaf_route_app__auth__reset_password_page["reset-password · CSR<br/>🔗 /reset-password<br/>📂 app/(auth)/reset-password<br/>📄 page.tsx"]:::csr
  leaf_route_app__auth__signup_page["signup · CSR<br/>🔗 /signup<br/>📂 app/(auth)/signup<br/>📄 page.tsx"]:::csr
  leaf_route_app__auth__two_factor_page["two-factor · CSR<br/>🔗 /two-factor<br/>📂 app/(auth)/two-factor<br/>📄 page.tsx"]:::csr
  subgraph ADMIN_T["⚙ /admin"]
    route_app__dashboard__admin_page["admin · SSR<br/>🔗 /admin"]:::ssr
    file_component_app__dashboard__admin_page_tsx_page["📂 app/(dashboard)/admin<br/>📄 page.tsx"]:::pkg
    route_app__dashboard__admin_page --> file_component_app__dashboard__admin_page_tsx_page
    file_component_components_dashboard_StatCard_tsx_StatCard["📂 components/dashboard<br/>📄 StatCard.tsx"]:::pkg
    leaf_route_app__dashboard__admin_reports_page["reports · CSR<br/>🔗 /admin/reports<br/>📂 app/(dashboard)/admin/reports<br/>📄 page.tsx"]:::csr
    file_component_components_ui_badge_tsx_Badge["📂 components/ui<br/>📄 badge.tsx"]:::pkg
    file_component_components_ui_table_tsx_Table["📂 components/ui<br/>📄 table.tsx"]:::pkg
    leaf_route_app__dashboard__admin_users_page["users · CSR<br/>🔗 /admin/users<br/>📂 app/(dashboard)/admin/users<br/>📄 page.tsx"]:::csr
    file_component_components_ui_select_tsx_Select["📂 components/ui<br/>📄 select.tsx"]:::pkg
  end
  leaf_route_app__dashboard__admin_reports_page ~~~ leaf_route_app__dashboard__admin_users_page
  leaf_route_app__dashboard__bible_page["bible · SSR<br/>🔗 /bible<br/>📂 app/(dashboard)/bible<br/>📄 page.tsx"]:::ssr
  leaf_route_app__dashboard__booking_page["booking · SSR<br/>🔗 /booking<br/>📂 app/(dashboard)/booking<br/>📄 page.tsx"]:::ssr
  leaf_route_app__dashboard__calendar_page["calendar · CSR<br/>🔗 /calendar<br/>📂 app/(dashboard)/calendar<br/>📄 page.tsx"]:::csr
  file_component_components_ui_calendar_tsx_Calendar["📂 components/ui<br/>📄 calendar.tsx"]:::pkg
  leaf_route_app__dashboard__feed_page["feed · CSR<br/>🔗 /feed<br/>📂 app/(dashboard)/feed<br/>📄 page.tsx"]:::csr
  file_component_components_ui_dialog_tsx_Dialog["📂 components/ui<br/>📄 dialog.tsx"]:::pkg
  file_component_components_ui_textarea_tsx_Textarea["📂 components/ui<br/>📄 textarea.tsx"]:::pkg
  leaf_route_app__dashboard__groups_page["groups · CSR<br/>🔗 /groups<br/>📂 app/(dashboard)/groups<br/>📄 page.tsx"]:::csr
  leaf_route_app__dashboard__messages_page["messages · CSR<br/>🔗 /messages<br/>📂 app/(dashboard)/messages<br/>📄 page.tsx"]:::csr
  leaf_route_app__dashboard__notifications_page["notifications · CSR<br/>🔗 /notifications<br/>📂 app/(dashboard)/notifications<br/>📄 page.tsx"]:::csr
  leaf_route_app__dashboard__overview_page["overview · SSR<br/>🔗 /overview<br/>📂 app/(dashboard)/overview<br/>📄 page.tsx"]:::ssr
  leaf_route_app__dashboard__prayer_page["prayer · SSR<br/>🔗 /prayer<br/>📂 app/(dashboard)/prayer<br/>📄 page.tsx"]:::ssr
  leaf_route_app__dashboard__settings_page["settings · CSR<br/>🔗 /settings<br/>📂 app/(dashboard)/settings<br/>📄 page.tsx"]:::csr
  leaf_route_app__dashboard__unauthorized_page["unauthorized · SSR<br/>🔗 /unauthorized<br/>📂 app/(dashboard)/unauthorized<br/>📄 page.tsx"]:::ssr
  leaf_route_app__dashboard__worship_page["worship · CSR<br/>🔗 /worship<br/>📂 app/(dashboard)/worship<br/>📄 page.tsx"]:::csr
  subgraph AUTH_T["🔐 /auth"]
    leaf_route_app_auth_login_page["login · SSR<br/>🔗 /auth/login<br/>📂 app/auth/login<br/>📄 page.tsx"]:::ssr
    file_component_components_login_form_tsx_LoginForm["📂 components<br/>📄 login-form.tsx"]:::pkg
    leaf_route_app_auth_password_reset_page["password-reset · SSR<br/>🔗 /auth/password-reset<br/>📂 app/auth/password-reset<br/>📄 page.tsx"]:::ssr
    file_component_components_blocks_auth_forgot_password_one_tsx_forgot_password_one["📂 components/blocks/auth<br/>📄 forgot-password-one.tsx"]:::pkg
    leaf_route_app_auth_signup_page["signup · SSR<br/>🔗 /auth/signup<br/>📂 app/auth/signup<br/>📄 page.tsx"]:::ssr
    file_component_components_signup_form_tsx_SignupForm["📂 components<br/>📄 signup-form.tsx"]:::pkg
    leaf_route_app_auth_verify_page["verify · SSR<br/>🔗 /auth/verify<br/>📂 app/auth/verify<br/>📄 page.tsx"]:::ssr
    file_component_components_verify_tsx_VerifyForm["📂 components<br/>📄 verify.tsx"]:::pkg
  end
  leaf_route_app_auth_login_page ~~~ leaf_route_app_auth_password_reset_page ~~~ leaf_route_app_auth_signup_page ~~~ leaf_route_app_auth_verify_page
  route_app_page["/ · CSR<br/>🔗 /"]:::csr
  file_component_app_page_tsx_page["📂 app<br/>📄 page.tsx"]:::pkg
  route_app_page --> file_component_app_page_tsx_page
  file_component_components_blocks_footer_footer_section_two_tsx_footer_section_two["📂 components/blocks/footer<br/>📄 footer-section-two.tsx"]:::pkg
  leaf_route_app_test_page["test · SSR<br/>🔗 /test<br/>📂 app/test<br/>📄 page.tsx"]:::ssr
  leaf_route_app__auth__forgot_password_page ~~~ leaf_route_app__auth__login_page ~~~ leaf_route_app__auth__reset_password_page ~~~ leaf_route_app__auth__signup_page ~~~ leaf_route_app__auth__two_factor_page ~~~ ADMIN_T ~~~ leaf_route_app__dashboard__bible_page ~~~ leaf_route_app__dashboard__booking_page ~~~ leaf_route_app__dashboard__calendar_page ~~~ leaf_route_app__dashboard__feed_page ~~~ leaf_route_app__dashboard__groups_page ~~~ leaf_route_app__dashboard__messages_page ~~~ leaf_route_app__dashboard__notifications_page ~~~ leaf_route_app__dashboard__overview_page ~~~ leaf_route_app__dashboard__prayer_page ~~~ leaf_route_app__dashboard__settings_page ~~~ leaf_route_app__dashboard__unauthorized_page ~~~ leaf_route_app__dashboard__worship_page ~~~ AUTH_T ~~~ leaf_route_app_test_page
  leaf_route_app__auth__forgot_password_page --> file_component_components_ui_button_tsx_Button
  leaf_route_app__auth__forgot_password_page --> file_component_components_ui_card_tsx_Card
  leaf_route_app__auth__forgot_password_page --> file_component_components_ui_input_tsx_Input
  leaf_route_app__auth__forgot_password_page --> file_component_components_ui_label_tsx_Label
  leaf_route_app__auth__login_page --> file_component_components_ui_button_tsx_Button
  leaf_route_app__auth__login_page --> file_component_components_ui_card_tsx_Card
  leaf_route_app__auth__login_page --> file_component_components_ui_input_tsx_Input
  leaf_route_app__auth__login_page --> file_component_components_ui_label_tsx_Label
  leaf_route_app__auth__reset_password_page --> file_component_components_ui_button_tsx_Button
  leaf_route_app__auth__reset_password_page --> file_component_components_ui_card_tsx_Card
  leaf_route_app__auth__reset_password_page --> file_component_components_ui_input_tsx_Input
  leaf_route_app__auth__reset_password_page --> file_component_components_ui_label_tsx_Label
  leaf_route_app__auth__signup_page --> file_component_components_ui_button_tsx_Button
  leaf_route_app__auth__signup_page --> file_component_components_ui_card_tsx_Card
  leaf_route_app__auth__signup_page --> file_component_components_ui_input_tsx_Input
  leaf_route_app__auth__signup_page --> file_component_components_ui_label_tsx_Label
  leaf_route_app__auth__two_factor_page --> file_component_components_ui_button_tsx_Button
  leaf_route_app__auth__two_factor_page --> file_component_components_ui_card_tsx_Card
  leaf_route_app__auth__two_factor_page --> file_component_components_ui_input_tsx_Input
  leaf_route_app__auth__two_factor_page --> file_component_components_ui_label_tsx_Label
  file_component_app__dashboard__admin_page_tsx_page --> file_component_components_dashboard_StatCard_tsx_StatCard
  file_component_app__dashboard__admin_page_tsx_page --> file_component_components_ui_card_tsx_Card
  leaf_route_app__dashboard__admin_reports_page --> file_component_components_ui_badge_tsx_Badge
  leaf_route_app__dashboard__admin_reports_page --> file_component_components_ui_button_tsx_Button
  leaf_route_app__dashboard__admin_reports_page --> file_component_components_ui_card_tsx_Card
  leaf_route_app__dashboard__admin_reports_page --> file_component_components_ui_table_tsx_Table
  leaf_route_app__dashboard__admin_users_page --> file_component_components_ui_badge_tsx_Badge
  leaf_route_app__dashboard__admin_users_page --> file_component_components_ui_card_tsx_Card
  leaf_route_app__dashboard__admin_users_page --> file_component_components_ui_select_tsx_Select
  leaf_route_app__dashboard__admin_users_page --> file_component_components_ui_table_tsx_Table
  leaf_route_app__dashboard__bible_page --> file_component_components_dashboard_StatCard_tsx_StatCard
  leaf_route_app__dashboard__bible_page --> file_component_components_ui_card_tsx_Card
  leaf_route_app__dashboard__booking_page --> file_component_components_ui_card_tsx_Card
  leaf_route_app__dashboard__calendar_page --> file_component_components_ui_calendar_tsx_Calendar
  leaf_route_app__dashboard__calendar_page --> file_component_components_ui_card_tsx_Card
  leaf_route_app__dashboard__feed_page --> file_component_components_ui_badge_tsx_Badge
  leaf_route_app__dashboard__feed_page --> file_component_components_ui_button_tsx_Button
  leaf_route_app__dashboard__feed_page --> file_component_components_ui_card_tsx_Card
  leaf_route_app__dashboard__feed_page --> file_component_components_ui_dialog_tsx_Dialog
  leaf_route_app__dashboard__feed_page --> file_component_components_ui_input_tsx_Input
  leaf_route_app__dashboard__feed_page --> file_component_components_ui_label_tsx_Label
  leaf_route_app__dashboard__feed_page --> file_component_components_ui_select_tsx_Select
  leaf_route_app__dashboard__feed_page --> file_component_components_ui_textarea_tsx_Textarea
  leaf_route_app__dashboard__groups_page --> file_component_components_ui_button_tsx_Button
  leaf_route_app__dashboard__groups_page --> file_component_components_ui_card_tsx_Card
  leaf_route_app__dashboard__messages_page --> file_component_components_ui_button_tsx_Button
  leaf_route_app__dashboard__messages_page --> file_component_components_ui_card_tsx_Card
  leaf_route_app__dashboard__notifications_page --> file_component_components_ui_card_tsx_Card
  leaf_route_app__dashboard__overview_page --> file_component_components_dashboard_StatCard_tsx_StatCard
  leaf_route_app__dashboard__overview_page --> file_component_components_ui_badge_tsx_Badge
  leaf_route_app__dashboard__overview_page --> file_component_components_ui_button_tsx_Button
  leaf_route_app__dashboard__overview_page --> file_component_components_ui_card_tsx_Card
  leaf_route_app__dashboard__prayer_page --> file_component_components_dashboard_StatCard_tsx_StatCard
  leaf_route_app__dashboard__prayer_page --> file_component_components_ui_card_tsx_Card
  leaf_route_app__dashboard__settings_page --> file_component_components_ui_card_tsx_Card
  leaf_route_app__dashboard__unauthorized_page --> file_component_components_ui_button_tsx_Button
  leaf_route_app__dashboard__unauthorized_page --> file_component_components_ui_card_tsx_Card
  leaf_route_app__dashboard__worship_page --> file_component_components_ui_card_tsx_Card
  leaf_route_app_auth_login_page --> file_component_components_login_form_tsx_LoginForm
  leaf_route_app_auth_password_reset_page --> file_component_components_blocks_auth_forgot_password_one_tsx_forgot_password_one
  leaf_route_app_auth_signup_page --> file_component_components_signup_form_tsx_SignupForm
  leaf_route_app_auth_verify_page --> file_component_components_verify_tsx_VerifyForm
  file_component_app_page_tsx_page --> file_component_components_blocks_footer_footer_section_two_tsx_footer_section_two
  file_component_app_page_tsx_page --> file_component_components_ui_badge_tsx_Badge
  file_component_app_page_tsx_page --> file_component_components_ui_button_tsx_Button
  file_component_app_page_tsx_page --> file_component_components_ui_card_tsx_Card
```
