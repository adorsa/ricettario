import { TestBed } from '@angular/core/testing';
import { DomSanitizer, SecurityContext } from '@angular/platform-browser';
import { RecipeParser } from './recipe-parser';

describe('RecipeParser', () => {
  let service: RecipeParser;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RecipeParser);
    sanitizer = TestBed.inject(DomSanitizer);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should show an ingredient note in a tooltip without adding it to the tag text', () => {
    const html = sanitizer.sanitize(SecurityContext.HTML, service.parseStepText(
      'Add [i:ing_1]',
      { ing_1: { name: 'Cumin', qty: 1, unit: 'tsp', description: 'Toast <b>first</b>' } },
      1
    ))!;

    expect(html).toContain('>1tsp of Cumin');
    expect(html).toContain('class="ingredient-note-tooltip" role="tooltip">Toast &lt;b&gt;first&lt;/b&gt;</span>');
  });

  it('should not add a note indicator when the ingredient description is empty', () => {
    const html = sanitizer.sanitize(SecurityContext.HTML, service.parseStepText(
      'Add [i:ing_1]',
      { ing_1: { name: 'Cumin', qty: 1, unit: 'tsp', description: '  ' } },
      1
    ))!;

    expect(html).not.toContain('ingredient-note-indicator');
  });
});
