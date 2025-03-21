/**
 * Language Utility for Tierd
 * 
 * This utility provides localized strings for the application.
 * It supports multiple languages and provides fallbacks to English.
 */

// Define available languages
export type AvailableLanguage = 'en' | 'fr' | 'de' | 'es' | 'ja';

// User-facing strings organized by category
interface TranslationStrings {
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    close: string;
    submit: string;
  };
  auth: {
    signIn: string;
    signOut: string;
    signUp: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    forgotPassword: string;
    profileLink: string;
    authRequired: string;
  };
  discussions: {
    createThread: string;
    replyToThread: string;
    addComment: string;
    discussionTitle: string;
    discussionContent: string;
    selectCategory: string;
    tagProducts: string;
    upvote: string;
    downvote: string;
    reportInappropriate: string;
    threadCreated: string;
    commentAdded: string;
  };
  products: {
    search: string;
    filter: string;
    sort: string;
    price: string;
    ratings: string;
    category: string;
    related: string;
    shopNow: string;
    specifications: string;
    reviews: string;
    discussions: string;
  };
}

// English strings (default)
const en: TranslationStrings = {
  common: {
    loading: 'Loading...',
    error: 'An error occurred',
    success: 'Success!',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    submit: 'Submit',
  },
  auth: {
    signIn: 'Sign In',
    signOut: 'Sign Out',
    signUp: 'Sign Up',
    emailPlaceholder: 'Email address',
    passwordPlaceholder: 'Password',
    forgotPassword: 'Forgot password?',
    profileLink: 'Profile',
    authRequired: 'Authentication required',
  },
  discussions: {
    createThread: 'Create Discussion',
    replyToThread: 'Reply to Discussion',
    addComment: 'Add Comment',
    discussionTitle: 'Discussion Title',
    discussionContent: 'Share your thoughts...',
    selectCategory: 'Select a category',
    tagProducts: 'Tag Products',
    upvote: 'Upvote',
    downvote: 'Downvote',
    reportInappropriate: 'Report',
    threadCreated: 'Discussion created successfully',
    commentAdded: 'Comment added successfully',
  },
  products: {
    search: 'Search products...',
    filter: 'Filter',
    sort: 'Sort',
    price: 'Price',
    ratings: 'Ratings',
    category: 'Category',
    related: 'Related Products',
    shopNow: 'Shop Now',
    specifications: 'Specifications',
    reviews: 'Reviews',
    discussions: 'Discussions',
  },
};

// French strings
const fr: TranslationStrings = {
  common: {
    loading: 'Chargement...',
    error: 'Une erreur est survenue',
    success: 'Succès!',
    cancel: 'Annuler',
    save: 'Enregistrer',
    delete: 'Supprimer',
    edit: 'Modifier',
    close: 'Fermer',
    submit: 'Soumettre',
  },
  auth: {
    signIn: 'Connexion',
    signOut: 'Déconnexion',
    signUp: 'Inscription',
    emailPlaceholder: 'Adresse e-mail',
    passwordPlaceholder: 'Mot de passe',
    forgotPassword: 'Mot de passe oublié?',
    profileLink: 'Profil',
    authRequired: 'Authentification requise',
  },
  discussions: {
    createThread: 'Créer une discussion',
    replyToThread: 'Répondre à la discussion',
    addComment: 'Ajouter un commentaire',
    discussionTitle: 'Titre de la discussion',
    discussionContent: 'Partagez vos pensées...',
    selectCategory: 'Sélectionnez une catégorie',
    tagProducts: 'Étiqueter des produits',
    upvote: 'Vote positif',
    downvote: 'Vote négatif',
    reportInappropriate: 'Signaler',
    threadCreated: 'Discussion créée avec succès',
    commentAdded: 'Commentaire ajouté avec succès',
  },
  products: {
    search: 'Rechercher des produits...',
    filter: 'Filtrer',
    sort: 'Trier',
    price: 'Prix',
    ratings: 'Évaluations',
    category: 'Catégorie',
    related: 'Produits associés',
    shopNow: 'Acheter',
    specifications: 'Spécifications',
    reviews: 'Avis',
    discussions: 'Discussions',
  },
};

// German strings with fallback to English for missing translations
const de: TranslationStrings = {
  common: {
    loading: 'Laden...',
    error: 'Ein Fehler ist aufgetreten',
    success: 'Erfolg!',
    cancel: 'Abbrechen',
    save: 'Speichern',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    close: 'Schließen',
    submit: 'Absenden',
  },
  auth: {
    signIn: 'Anmelden',
    signOut: 'Abmelden',
    signUp: 'Registrieren',
    emailPlaceholder: 'E-Mail-Adresse',
    passwordPlaceholder: 'Passwort',
    forgotPassword: 'Passwort vergessen?',
    profileLink: 'Profil',
    authRequired: 'Authentifizierung erforderlich',
  },
  discussions: {
    createThread: 'Diskussion erstellen',
    replyToThread: 'Auf Diskussion antworten',
    addComment: 'Kommentar hinzufügen',
    discussionTitle: 'Diskussionstitel',
    discussionContent: 'Teilen Sie Ihre Gedanken...',
    selectCategory: 'Kategorie auswählen',
    tagProducts: 'Produkte markieren',
    upvote: 'Positiv bewerten',
    downvote: 'Negativ bewerten',
    reportInappropriate: 'Melden',
    threadCreated: 'Diskussion erfolgreich erstellt',
    commentAdded: 'Kommentar erfolgreich hinzugefügt',
  },
  products: {
    search: 'Produkte suchen...',
    filter: 'Filtern',
    sort: 'Sortieren',
    price: 'Preis',
    ratings: 'Bewertungen',
    category: 'Kategorie',
    related: 'Ähnliche Produkte',
    shopNow: 'Jetzt kaufen',
    specifications: 'Spezifikationen',
    reviews: 'Rezensionen',
    discussions: 'Diskussionen',
  },
};

// Available translations
const translations: Record<AvailableLanguage, TranslationStrings> = {
  en,
  fr,
  de,
  es: en, // Fallback to English for now
  ja: en, // Fallback to English for now
};

// Get the user's preferred language
export function getUserLanguage(): AvailableLanguage {
  if (typeof window === 'undefined') {
    return 'en'; // Default to English on server
  }
  
  // Check for stored language preference
  const storedLang = localStorage.getItem('language') as AvailableLanguage;
  if (storedLang && Object.keys(translations).includes(storedLang)) {
    return storedLang;
  }
  
  // Get from browser
  const browserLang = navigator.language.substring(0, 2) as AvailableLanguage;
  if (Object.keys(translations).includes(browserLang)) {
    return browserLang;
  }
  
  // Default to English
  return 'en';
}

// Set the user's preferred language
export function setUserLanguage(lang: AvailableLanguage): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('language', lang);
  }
}

// Get localized strings based on current language
export function useLanguage() {
  const language = getUserLanguage();
  const strings = translations[language] || translations.en;
  
  return {
    language,
    strings,
    setLanguage: setUserLanguage,
  };
}

// For direct access to strings without React hooks
export function getLocalizedStrings(language: AvailableLanguage = getUserLanguage()): TranslationStrings {
  return translations[language] || translations.en;
}

// For accessing nested properties safely
export function getLocalizedString(
  path: string, 
  language: AvailableLanguage = getUserLanguage()
): string {
  const strings = translations[language] || translations.en;
  const keys = path.split('.');
  
  // Navigate the nested object properties
  let result: any = strings;
  for (const key of keys) {
    if (result && result[key] !== undefined) {
      result = result[key];
    } else {
      // Fallback to English if translation missing
      result = en;
      for (const k of keys) {
        if (result && result[k] !== undefined) {
          result = result[k];
        } else {
          return path; // Return the path itself if no translation found
        }
      }
      break;
    }
  }
  
  return typeof result === 'string' ? result : path;
} 