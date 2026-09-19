import { useEffect, useState } from "react";
import i18n from "@/i18n/client";
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, normalizeLocale, type Locale } from "@/i18n/config";

export const CONSENT_TRANSLATIONS = {
  en: {
    bannerTitle: "Cookie Preferences",
    gpcHonored: "GPC honored",
    usOptOut: "US · opt-out",
    descriptionBase: "We use cookies to improve your experience, analyze site traffic, and personalize content.",
    descriptionStrict: " You can choose which cookies to allow — non-essential cookies stay off until you consent.",
    descriptionUs: " You can manage preferences or opt out of sale/share at any time.",
    descriptionNotice: " Manage your preferences below.",
    descriptionGpc: "Global Privacy Control detected — marketing cookies are off by default.",
    cookiePolicy: "Cookie Policy",
    privacyPolicy: "Privacy Policy",
    customize: "Customize",
    rejectAll: "Reject all",
    rejectNonEssential: "Reject non-essential",
    acceptAll: "Accept all",
    customizeTitle: "Customize Cookies",
    customizeDesc: "Choose which cookies you allow. Necessary cookies are always on.",
    customizeDescStrict: " Non-essential cookies remain blocked until you consent.",
    customizeDescUs: " You can opt out of sale/share at any time.",
    gpcNotice: "Global Privacy Control honored — your browser signaled “Do Not Sell/Share”. Marketing is off by default; you can still turn it on below.",
    alwaysActive: "Always active",
    doNotSellLink: "Do Not Sell or Share — learn more",
    cancel: "Cancel",
    savePreferences: "Save preferences",
    managePreferences: "Manage cookie preferences",
    manageCookies: "Manage Cookies",
    necessaryLabel: "Strictly Necessary",
    necessaryDesc: "Required for login, security, and core site function. Cannot be disabled.",
    functionalLabel: "Functional / Preferences",
    functionalDesc: "Remembers language, theme, and region preferences for a smoother experience.",
    analyticsLabel: "Analytics",
    analyticsDesc: "Helps us understand how the site is used via aggregated, pseudonymized metrics.",
    marketingLabel: "Marketing / Tracking",
    marketingDesc: "Used for personalized content and measuring campaign effectiveness across sites.",
  },
  es: {
    bannerTitle: "Preferencias de cookies",
    gpcHonored: "GPC aplicado",
    usOptOut: "EE. UU. · exclusión",
    descriptionBase: "Utilizamos cookies para mejorar su experiencia, analizar el tráfico del sitio y personalizar el contenido.",
    descriptionStrict: " Puede elegir qué cookies permitir; las no esenciales permanecen desactivadas hasta su consentimiento.",
    descriptionUs: " Puede gestionar sus preferencias o excluirse de la venta/intercambio en cualquier momento.",
    descriptionNotice: " Gestione sus preferencias a continuación.",
    descriptionGpc: "Global Privacy Control detectado: las cookies de marketing están desactivadas por defecto.",
    cookiePolicy: "Política de cookies",
    privacyPolicy: "Política de privacidad",
    customize: "Personalizar",
    rejectAll: "Rechazar todo",
    rejectNonEssential: "Rechazar no esenciales",
    acceptAll: "Aceptar todo",
    customizeTitle: "Personalizar cookies",
    customizeDesc: "Elija qué cookies permite. Las cookies necesarias siempre están activas.",
    customizeDescStrict: " Las cookies no esenciales permanecen bloqueadas hasta su consentimiento.",
    customizeDescUs: " Puede excluirse de la venta o intercambio en cualquier momento.",
    gpcNotice: "Global Privacy Control aplicado: su navegador indicó “No vender/compartir”. El marketing está desactivado por defecto; puede activarlo abajo.",
    alwaysActive: "Siempre activo",
    doNotSellLink: "No vender ni compartir — más información",
    cancel: "Cancelar",
    savePreferences: "Guardar preferencias",
    managePreferences: "Gestionar preferencias de cookies",
    manageCookies: "Gestionar cookies",
    necessaryLabel: "Estrictamente necesarias",
    necessaryDesc: "Obligatorias para inicio de sesión, seguridad y funciones básicas. No se pueden desactivar.",
    functionalLabel: "Funcionales / Preferencias",
    functionalDesc: "Recuerdan el idioma, el tema y las preferencias regionales para una mejor experiencia.",
    analyticsLabel: "Analíticas",
    analyticsDesc: "Nos ayudan a comprender cómo se utiliza el sitio mediante métricas agregadas y seudónimas.",
    marketingLabel: "Marketing / Seguimiento",
    marketingDesc: "Utilizadas para contenido personalizado y medir la eficacia de campañas en diversos sitios.",
  },
  fr: {
    bannerTitle: "Préférences de cookies",
    gpcHonored: "GPC respecté",
    usOptOut: "États-Unis · désactivation",
    descriptionBase: "Nous utilisons des cookies pour améliorer votre expérience, analyser le trafic du site et personnaliser le contenu.",
    descriptionStrict: " Vous pouvez choisir les cookies autorisés — les non essentiels restent désactivés sans votre consentement.",
    descriptionUs: " Vous pouvez gérer vos préférences ou vous désinscrire de la vente/partage à tout moment.",
    descriptionNotice: " Gérez vos préférences ci-dessous.",
    descriptionGpc: "Global Privacy Control détecté — les cookies de marketing sont désactivés par défaut.",
    cookiePolicy: "Politique de cookies",
    privacyPolicy: "Politique de confidentialité",
    customize: "Personnaliser",
    rejectAll: "Tout refuser",
    rejectNonEssential: "Refuser les non essentiels",
    acceptAll: "Tout accepter",
    customizeTitle: "Personnaliser les cookies",
    customizeDesc: "Choisissez les cookies que vous autorisez. Les cookies nécessaires sont toujours activés.",
    customizeDescStrict: " Les cookies non essentiels restent bloqués jusqu'à votre consentement.",
    customizeDescUs: " Vous pouvez vous opposer à la vente ou au partage à tout moment.",
    gpcNotice: "Global Privacy Control respecté — votre navigateur a signalé “Ne pas vendre/partager”. Le marketing est désactivé par défaut.",
    alwaysActive: "Toujours actif",
    doNotSellLink: "Ne pas vendre ni partager — en savoir plus",
    cancel: "Annuler",
    savePreferences: "Enregistrer les préférences",
    managePreferences: "Gérer les préférences de cookies",
    manageCookies: "Gérer les cookies",
    necessaryLabel: "Strictement nécessaires",
    necessaryDesc: "Requis pour la connexion, la sécurité et le fonctionnement de base. Ne peuvent pas être désactivés.",
    functionalLabel: "Fonctionnels / Préférences",
    functionalDesc: "Mémorisent la langue, le thème et les paramètres régionaux pour une navigation fluide.",
    analyticsLabel: "Analytiques",
    analyticsDesc: "Nous aident à comprendre comment le site est utilisé grâce à des mesures anonymisées.",
    marketingLabel: "Marketing / Suivi",
    marketingDesc: "Utilisés pour diffuser des contenus personnalisés et mesurer l'efficacité des campagnes.",
  },
  pt: {
    bannerTitle: "Preferências de cookies",
    gpcHonored: "GPC respeitado",
    usOptOut: "EUA · opção de exclusão",
    descriptionBase: "Utilizamos cookies para melhorar sua experiência, analisar o tráfego do site e personalizar o conteúdo.",
    descriptionStrict: " Você pode escolher quais cookies permitir — os não essenciais permanecem desativados até o seu consentimento.",
    descriptionUs: " Você pode gerenciar preferências ou optar por não vender/compartilhar a qualquer momento.",
    descriptionNotice: " Gerencie suas preferências abaixo.",
    descriptionGpc: "Global Privacy Control detectado — os cookies de marketing ficam desativados por padrão.",
    cookiePolicy: "Política de cookies",
    privacyPolicy: "Política de privacidade",
    customize: "Personalizar",
    rejectAll: "Rejeitar todos",
    rejectNonEssential: "Rejeitar não essenciais",
    acceptAll: "Aceitar todos",
    customizeTitle: "Personalizar cookies",
    customizeDesc: "Escolha quais cookies você permite. Os cookies necessários estão sempre ativados.",
    customizeDescStrict: " Os cookies não essenciais permanecem bloqueados até o seu consentimento.",
    customizeDescUs: " Você pode cancelar a venda ou compartilhamento a qualquer momento.",
    gpcNotice: "Global Privacy Control respeitado — seu navegador sinalizou “Não vender/compartilhar”. O marketing está desativado por padrão.",
    alwaysActive: "Sempre ativo",
    doNotSellLink: "Não vender ou compartilhar — saiba mais",
    cancel: "Cancelar",
    savePreferences: "Salvar preferências",
    managePreferences: "Gerenciar preferências de cookies",
    manageCookies: "Gerenciar cookies",
    necessaryLabel: "Estritamente necessários",
    necessaryDesc: "Obrigatórios para login, segurança e funções básicas do site. Não podem ser desativados.",
    functionalLabel: "Funcionais / Preferências",
    functionalDesc: "Lembram o idioma, tema e preferências regionais para uma melhor experiência.",
    analyticsLabel: "Analíticos",
    analyticsDesc: "Ajudam a entender como o site é utilizado por meio de métricas agregadas e pseudônimas.",
    marketingLabel: "Marketing / Rastreamento",
    marketingDesc: "Utilizados para conteúdo personalizado e mensuração de eficácia de campanhas.",
  },
} as const;

export type ConsentTranslationKey = keyof (typeof CONSENT_TRANSLATIONS)["en"];

function getClientLocale(): Locale {
  if (typeof document !== "undefined") {
    const cookieMatch = document.cookie.match(
      new RegExp(`(?:^|; )${LOCALE_COOKIE_NAME}=([^;]*)`)
    );
    if (cookieMatch?.[1]) {
      return normalizeLocale(cookieMatch[1]);
    }
    const htmlLang = document.documentElement.lang;
    if (htmlLang) {
      return normalizeLocale(htmlLang);
    }
  }
  if (i18n.isInitialized && i18n.language) {
    return normalizeLocale(i18n.language);
  }
  return DEFAULT_LOCALE;
}

export function useConsentTranslation() {
  const [locale, setLocale] = useState<Locale>(getClientLocale);

  useEffect(() => {
    const handleUpdate = () => {
      setLocale(getClientLocale());
    };

    if (i18n.isInitialized) {
      i18n.on("languageChanged", handleUpdate);
    }

    // Also observe html lang attribute changes for next-intl route transitions
    const observer = new MutationObserver(() => {
      handleUpdate();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang"],
    });

    return () => {
      if (i18n.isInitialized) {
        i18n.off("languageChanged", handleUpdate);
      }
      observer.disconnect();
    };
  }, []);

  const t = (key: ConsentTranslationKey): string => {
    return CONSENT_TRANSLATIONS[locale]?.[key] ?? CONSENT_TRANSLATIONS.en[key];
  };

  return { t, locale };
}
