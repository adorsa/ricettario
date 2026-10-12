import { TestBed } from '@angular/core/testing';
import { RecipeParser } from './recipe-parser';

describe('RecipeParser', () => {
  let service: RecipeParser;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RecipeParser);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
