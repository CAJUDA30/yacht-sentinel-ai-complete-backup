import React, { createContext, useContext, useState, useEffect } from 'react';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string, fallback?: string) => string;
  supportedLanguages: { code: string; name: string; nativeName: string }[];
}

const translations = {
  en: {
    'settings.title': 'Settings',
    'settings.general': 'General',
    'settings.modules': 'Modules',
    'settings.inventory': 'Inventory',
    'settings.security': 'Security',
    'settings.system': 'System',
    'settings.status': 'Status',
    'settings.save': 'Save All Settings',
    'settings.discard': 'Discard Changes',
    'general.profile': 'User Profile',
    'general.theme': 'Theme & Appearance',
    'general.notifications': 'Global Notifications',
    'general.system': 'System Preferences',
    'general.currency': 'Currency',
    'currency.label': 'Default Currency',
    'currency.description': 'Used throughout the application',
    'language.label': 'Language',
    'language.description': 'Application language',
    'save.success': 'Settings saved successfully',
    'save.failed': 'Failed to save settings',
    'changes.pending': 'You have unsaved changes',
    'superadmin.logs': 'AI System Logs',
    'superadmin.consensus': 'LLM Consensus',
    'superadmin.title': 'Advanced System Management'
  },
  fr: {
    'settings.title': 'Paramètres',
    'settings.general': 'Général',
    'settings.modules': 'Modules',
    'settings.inventory': 'Inventaire',
    'settings.security': 'Sécurité',
    'settings.system': 'Système',
    'settings.status': 'Statut',
    'settings.save': 'Enregistrer tous les paramètres',
    'settings.discard': 'Annuler les modifications',
    'general.profile': 'Profil utilisateur',
    'general.theme': 'Thème et apparence',
    'general.notifications': 'Notifications globales',
    'general.system': 'Préférences système',
    'general.currency': 'Devise',
    'currency.label': 'Devise par défaut',
    'currency.description': 'Utilisée dans toute l\'application',
    'language.label': 'Langue',
    'language.description': 'Langue de l\'application',
    'save.success': 'Paramètres sauvegardés avec succès',
    'save.failed': 'Échec de la sauvegarde des paramètres',
    'changes.pending': 'Vous avez des modifications non sauvegardées',
    'superadmin.logs': 'Journaux du système IA',
    'superadmin.consensus': 'Consensus LLM',
    'superadmin.title': 'Gestion avancée du système'
  },
  es: {
    'settings.title': 'Configuración',
    'settings.general': 'General',
    'settings.modules': 'Módulos',
    'settings.inventory': 'Inventario',
    'settings.security': 'Seguridad',
    'settings.system': 'Sistema',
    'settings.status': 'Estado',
    'settings.save': 'Guardar toda la configuración',
    'settings.discard': 'Descartar cambios',
    'general.profile': 'Perfil de usuario',
    'general.theme': 'Tema y apariencia',
    'general.notifications': 'Notificaciones globales',
    'general.system': 'Preferencias del sistema',
    'general.currency': 'Moneda',
    'currency.label': 'Moneda predeterminada',
    'currency.description': 'Utilizada en toda la aplicación',
    'language.label': 'Idioma',
    'language.description': 'Idioma de la aplicación',
    'save.success': 'Configuración guardada exitosamente',
    'save.failed': 'Error al guardar la configuración',
    'changes.pending': 'Tienes cambios sin guardar',
    'superadmin.logs': 'Registros del sistema IA',
    'superadmin.consensus': 'Consenso LLM',
    'superadmin.title': 'Gestión avanzada del sistema'
  },
  de: {
    'settings.title': 'Einstellungen',
    'settings.general': 'Allgemein',
    'settings.modules': 'Module',
    'settings.inventory': 'Inventar',
    'settings.security': 'Sicherheit',
    'settings.system': 'System',
    'settings.status': 'Status',
    'settings.save': 'Alle Einstellungen speichern',
    'settings.discard': 'Änderungen verwerfen',
    'general.profile': 'Benutzerprofil',
    'general.theme': 'Design und Erscheinungsbild',
    'general.notifications': 'Globale Benachrichtigungen',
    'general.system': 'Systemeinstellungen',
    'general.currency': 'Währung',
    'currency.label': 'Standardwährung',
    'currency.description': 'In der gesamten Anwendung verwendet',
    'language.label': 'Sprache',
    'language.description': 'Anwendungssprache',
    'save.success': 'Einstellungen erfolgreich gespeichert',
    'save.failed': 'Fehler beim Speichern der Einstellungen',
    'changes.pending': 'Sie haben ungespeicherte Änderungen',
    'superadmin.logs': 'KI-System-Protokolle',
    'superadmin.consensus': 'LLM-Konsens',
    'superadmin.title': 'Erweiterte Systemverwaltung'
  },
  it: {
    'settings.title': 'Impostazioni',
    'settings.general': 'Generale',
    'settings.modules': 'Moduli',
    'settings.inventory': 'Inventario',
    'settings.security': 'Sicurezza',
    'settings.system': 'Sistema',
    'settings.status': 'Stato',
    'settings.save': 'Salva tutte le impostazioni',
    'settings.discard': 'Scarta modifiche',
    'general.profile': 'Profilo utente',
    'general.theme': 'Tema e aspetto',
    'general.notifications': 'Notifiche globali',
    'general.system': 'Preferenze di sistema',
    'general.currency': 'Valuta',
    'currency.label': 'Valuta predefinita',
    'currency.description': 'Utilizzata in tutta l\'applicazione',
    'language.label': 'Lingua',
    'language.description': 'Lingua dell\'applicazione',
    'save.success': 'Impostazioni salvate con successo',
    'save.failed': 'Errore nel salvare le impostazioni',
    'changes.pending': 'Hai modifiche non salvate',
    'superadmin.logs': 'Log del sistema IA',
    'superadmin.consensus': 'Consenso LLM',
    'superadmin.title': 'Gestione avanzata del sistema'
  }
};

const supportedLanguages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' }
];

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string>(() => {
    const savedLanguage = localStorage.getItem('appLanguage');
    if (savedLanguage && supportedLanguages.some(lang => lang.code === savedLanguage)) {
      return savedLanguage;
    }
    // Auto-detect browser language
    const browserLang = navigator.language.split('-')[0];
    return supportedLanguages.some(lang => lang.code === browserLang) ? browserLang : 'en';
  });

  const setLanguage = (lang: string) => {
    if (supportedLanguages.some(l => l.code === lang)) {
      setLanguageState(lang);
      localStorage.setItem('appLanguage', lang);
      // Set HTML lang attribute
      document.documentElement.lang = lang;
      // Broadcast language change
      window.dispatchEvent(new CustomEvent('languageChange', { 
        detail: { language: lang } 
      }));
    }
  };

  const t = (key: string, fallback?: string): string => {
    const langTranslations = translations[language as keyof typeof translations] || translations.en;
    return langTranslations[key as keyof typeof langTranslations] || fallback || key;
  };

  // Listen for language changes from other contexts
  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      const newLanguage = event.detail.language;
      if (newLanguage !== language && supportedLanguages.some(l => l.code === newLanguage)) {
        setLanguageState(newLanguage);
        localStorage.setItem('appLanguage', newLanguage);
        document.documentElement.lang = newLanguage;
      }
    };

    window.addEventListener('languageChange', handleLanguageChange as EventListener);
    return () => window.removeEventListener('languageChange', handleLanguageChange as EventListener);
  }, [language]);

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      t,
      supportedLanguages
    }}>
      {children}
    </LanguageContext.Provider>
  );
};