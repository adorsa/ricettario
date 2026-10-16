import { Service, signal } from '@angular/core';

const english = {
  'app.title': 'Recipe Book',
  'app.logout': 'Logout',
  'app.loginAndSignup': 'Log in / Sign up',
  'language.label': 'Language',
  'auth.loginTitle': 'Log into your recipe book',
  'auth.signupTitle': 'Create a new account',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.pleaseWait': 'Please wait...',
  'auth.login': 'Log in',
  'auth.signup': 'Sign up',
  'auth.noAccount': "You don't have an account? Register",
  'auth.hasAccount': 'You already have an account? Log in',
  'auth.loginSuccess': 'Successfully logged in!',
  'auth.signupSuccess': 'Account created. Check your email.',
  'auth.error': 'Authentication failed. Please check your details and try again.',
  'recipes.title': 'Recipes',
  'recipes.new': 'New recipe',
  'recipes.loading': 'Loading recipe list...',
  'recipes.empty': 'There are no recipes yet. Click "New recipe" above to get started.',
  'recipes.baseServings': 'Base servings: {{count}}',
  'recipes.delete': 'Delete recipe',
  'recipes.deleteConfirm': 'Are you sure you want to delete this recipe?',
  'recipes.deleteError': 'There was an error while deleting the recipe.',
  'detail.back': 'Back to list',
  'detail.edit': 'Edit',
  'detail.public': 'Public recipe',
  'detail.startWorkMode': 'Enter immersive work mode',
  'detail.servings': 'Servings:',
  'detail.base': '(Base: {{count}})',
  'detail.ingredients': 'Ingredients',
  'detail.procedure': 'Procedure',
  'editor.editTitle': 'Edit recipe',
  'editor.newTitle': 'New recipe',
  'editor.export': 'Export to file',
  'editor.import': 'Import from file',
  'editor.cancel': 'Cancel',
  'editor.recipeTitle': 'Recipe title',
  'editor.titlePlaceholder': 'e.g. Tomato and basil pasta',
  'editor.baseServings': 'Base servings',
  'editor.publicDescription': 'Make this recipe public to authenticated users. Only you can edit it.',
  'editor.ingredients': 'Ingredients',
  'editor.ingredientName': 'Ingredient name',
  'editor.quantity': 'Qty (e.g. 200)',
  'editor.unit': 'Unit (e.g. g, ml)',
  'editor.addIngredient': 'Add ingredient',
  'editor.remove': 'Remove',
  'editor.procedureSteps': 'Procedure steps',
  'editor.stepNumber': 'Step #{{number}}',
  'editor.delete': 'Delete',
  'editor.stepId': 'Step ID',
  'editor.stepIdPlaceholder': 'e.g. sauce_prep',
  'editor.dependencies': 'Dependencies (comma-separated)',
  'editor.dependenciesPlaceholder': 'e.g. previous_step_id, baking:rem<=10',
  'editor.instructions': 'Text instructions',
  'editor.instructionsPlaceholder': 'Type an explanation of this step. Use [t:15:Label] to set a timer or [i:ing_id] to reference an ingredient.',
  'editor.addStep': 'Add new step',
  'editor.saving': 'Saving...',
  'editor.update': 'Update',
  'editor.save': 'Save',
  'editor.saveError': 'There was an error saving this recipe.',
  'editor.exportNeedsTitle': 'Enter a recipe title before exporting.',
  'editor.invalidImport': 'The imported JSON file is not in a valid format for this application.',
  'editor.importSuccess': "The recipe was imported but has not been saved. Review it and click 'Save' to add it to your recipe book.",
  'editor.readError': 'Error reading the file. Please make sure it is a valid JSON file in the correct format.',
  'work.workingOn': 'Working on',
  'work.exit': 'Exit',
  'work.activeStep': 'Active step',
  'work.timersVisible': 'Active timers are visible in the panel below.',
  'work.allSet': "You're all set!",
  'work.congratulations': 'Congratulations on completing another recipe! Enjoy your meal!',
  'work.backToRecipe': 'Back to recipe',
  'work.putOnHold': 'Put on hold',
  'work.completeStep': 'Complete step',
  'work.pause0': "Time for a short break! Your timers will let you know when it's time to get back to work.",
  'work.pause1': 'All done for now! You could tidy up the kitchen while you wait.',
  'work.pause2': 'Good job! Take a deep breath and relax until the timers call you back.',
  'work.pause3': 'Take a break while the yeast, stove, oven, or something else works its magic.',
  'timer.status': 'Status',
  'timer.running': 'Running',
  'timer.pause': 'Pause',
  'timer.resume': 'Resume',
  'timer.complete': 'Complete',
  'timer.remove': 'Remove',
  'timer.ongoing': 'Ongoing',
  'timer.actions': 'actions',
  'timer.defaultLabel': 'Timer',
  'timer.onHold': 'On hold',
  'parser.missingIngredient': '[missing ingredient]',
  'parser.quantityOf': 'of'
} as const;

type TranslationKey = keyof typeof english;

const italian: Record<TranslationKey, string> = {
  'app.title': 'Ricettario',
  'app.logout': 'Esci',
  'app.loginAndSignup': 'Accedi / Registrati',
  'language.label': 'Lingua',
  'auth.loginTitle': 'Accedi al tuo ricettario',
  'auth.signupTitle': 'Crea un nuovo account',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.pleaseWait': 'Attendere...',
  'auth.login': 'Accedi',
  'auth.signup': 'Registrati',
  'auth.noAccount': 'Non hai un account? Registrati',
  'auth.hasAccount': 'Hai già un account? Accedi',
  'auth.loginSuccess': 'Accesso effettuato!',
  'auth.signupSuccess': 'Account creato. Controlla la tua email.',
  'auth.error': 'Accesso non riuscito. Controlla i dati e riprova.',
  'recipes.title': 'Ricette',
  'recipes.new': 'Nuova ricetta',
  'recipes.loading': 'Caricamento delle ricette...',
  'recipes.empty': 'Non ci sono ancora ricette. Seleziona "Nuova ricetta" per iniziare.',
  'recipes.baseServings': 'Porzioni base: {{count}}',
  'recipes.delete': 'Elimina ricetta',
  'recipes.deleteConfirm': 'Vuoi davvero eliminare questa ricetta?',
  'recipes.deleteError': "Errore durante l'eliminazione della ricetta.",
  'detail.back': 'Torna all’elenco',
  'detail.edit': 'Modifica',
  'detail.public': 'Ricetta pubblica',
  'detail.startWorkMode': 'Avvia la modalità di lavoro',
  'detail.servings': 'Porzioni:',
  'detail.base': '(Base: {{count}})',
  'detail.ingredients': 'Ingredienti',
  'detail.procedure': 'Procedimento',
  'editor.editTitle': 'Modifica ricetta',
  'editor.newTitle': 'Nuova ricetta',
  'editor.export': 'Esporta su file',
  'editor.import': 'Importa da file',
  'editor.cancel': 'Annulla',
  'editor.recipeTitle': 'Titolo della ricetta',
  'editor.titlePlaceholder': 'es. Pasta al pomodoro e basilico',
  'editor.baseServings': 'Porzioni base',
  'editor.publicDescription': 'Rendi pubblica la ricetta per gli utenti autenticati. Solo tu puoi modificarla.',
  'editor.ingredients': 'Ingredienti',
  'editor.ingredientName': 'Nome ingrediente',
  'editor.quantity': 'Quantità (es. 200)',
  'editor.unit': 'Unità (es. g, ml)',
  'editor.addIngredient': 'Aggiungi ingrediente',
  'editor.remove': 'Rimuovi',
  'editor.procedureSteps': 'Passaggi del procedimento',
  'editor.stepNumber': 'Passaggio n. {{number}}',
  'editor.delete': 'Elimina',
  'editor.stepId': 'ID passaggio',
  'editor.stepIdPlaceholder': 'es. preparazione_salsa',
  'editor.dependencies': 'Dipendenze (separate da virgole)',
  'editor.dependenciesPlaceholder': 'es. id_passaggio_precedente, cottura:rem<=10',
  'editor.instructions': 'Istruzioni',
  'editor.instructionsPlaceholder': 'Descrivi il passaggio. Usa [t:15:Etichetta] per un timer o [i:ing_id] per indicare un ingrediente.',
  'editor.addStep': 'Aggiungi passaggio',
  'editor.saving': 'Salvataggio...',
  'editor.update': 'Aggiorna',
  'editor.save': 'Salva',
  'editor.saveError': 'Errore durante il salvataggio della ricetta.',
  'editor.exportNeedsTitle': 'Inserisci il titolo della ricetta prima di esportarla.',
  'editor.invalidImport': 'Il file JSON importato non è in un formato valido per questa applicazione.',
  'editor.importSuccess': 'La ricetta è stata importata ma non salvata. Controllala e seleziona "Salva" per aggiungerla al ricettario.',
  'editor.readError': 'Errore nella lettura del file. Verifica che sia un JSON valido nel formato corretto.',
  'work.workingOn': 'Ricetta in preparazione',
  'work.exit': 'Esci',
  'work.activeStep': 'Passaggio attivo',
  'work.timersVisible': 'I timer attivi sono visibili nel pannello qui sotto.',
  'work.allSet': 'Hai completato tutto!',
  'work.congratulations': 'Complimenti, hai completato un’altra ricetta! Buon appetito!',
  'work.backToRecipe': 'Torna alla ricetta',
  'work.putOnHold': 'Metti in attesa',
  'work.completeStep': 'Completa passaggio',
  'work.pause0': 'È il momento di una breve pausa! I timer ti avviseranno quando sarà ora di riprendere.',
  'work.pause1': 'Per ora hai finito! Nell’attesa puoi riordinare la cucina.',
  'work.pause2': 'Ottimo lavoro! Fai un respiro e rilassati finché i timer non ti richiamano.',
  'work.pause3': 'Fai una pausa mentre il lievito, i fornelli, il forno o qualcos’altro fanno la loro magia.',
  'timer.status': 'Stato',
  'timer.running': 'In corso',
  'timer.pause': 'Pausa',
  'timer.resume': 'Riprendi',
  'timer.complete': 'Completa',
  'timer.remove': 'Rimuovi',
  'timer.ongoing': 'In corso',
  'timer.actions': 'attività',
  'timer.defaultLabel': 'Timer',
  'timer.onHold': 'In attesa',
  'parser.missingIngredient': '[ingrediente mancante]',
  'parser.quantityOf': 'di'
};

export type Language = 'en' | 'it';

@Service()
export class I18n {
  readonly languages: ReadonlyArray<{ code: Language; label: string }> = [
    { code: 'en', label: 'English' },
    { code: 'it', label: 'Italiano' }
  ];
  readonly language = signal<Language>(this.readSavedLanguage());

  constructor() {
    this.updateDocumentLanguage(this.language());
  }

  setLanguage(language: Language) {
    this.language.set(language);
    this.updateDocumentLanguage(language);
    try {
      localStorage.setItem('ricettario-language', language);
    } catch {
      // Language switching still works when browser storage is unavailable.
    }
  }

  t(key: TranslationKey, params: Record<string, string | number> = {}): string {
    const template = this.language() === 'it' ? italian[key] : english[key];
    return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(params[name] ?? ''));
  }

  private readSavedLanguage(): Language {
    try {
      return localStorage.getItem('ricettario-language') === 'it' ? 'it' : 'en';
    } catch {
      return 'en';
    }
  }

  private updateDocumentLanguage(language: Language) {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.title = this.t('app.title');
    }
  }
}
