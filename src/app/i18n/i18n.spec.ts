import { TestBed } from '@angular/core/testing';
import { I18n } from './i18n';

describe('I18n', () => {
  let service: I18n;

  beforeEach(() => {
    localStorage.removeItem('ricettario-language');
    TestBed.configureTestingModule({});
    service = TestBed.inject(I18n);
  });

  afterEach(() => {
    service.setLanguage('en');
  });

  it('switches translations and remembers the selected language', () => {
    expect(service.t('recipes.title')).toBe('Recipes');

    service.setLanguage('it');

    expect(service.t('recipes.title')).toBe('Ricette');
    expect(service.t('recipes.baseServings', { count: 4 })).toBe('Porzioni base: 4');
    expect(localStorage.getItem('ricettario-language')).toBe('it');
    expect(document.documentElement.lang).toBe('it');
  });
});
