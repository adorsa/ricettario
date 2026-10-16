import { TestBed } from '@angular/core/testing';
import { RecipeWorkflow } from './recipe-workflow';

describe('RecipeWorkflow', () => {
  let service: RecipeWorkflow;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RecipeWorkflow);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
