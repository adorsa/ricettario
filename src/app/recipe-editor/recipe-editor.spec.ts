import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Supabase } from '../supabase';
import { RecipeEditor } from './recipe-editor';

describe('RecipeEditor', () => {
  let component: RecipeEditor;
  let fixture: ComponentFixture<RecipeEditor>;
  const recipe = {
    id: 'recipe-1',
    user_id: 'user-1',
    title: 'Imported recipe',
    servings_base: 2,
    is_public: false,
    ingredients: {
      ingredientA: { name: 'Flour', qty: 100, unit: 'g' },
      ingredientB: { name: 'Water', qty: 50, unit: 'ml' }
    },
    steps: []
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeEditor],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'recipe-1' } } }
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
        {
          provide: Supabase,
          useValue: {
            currentUser: () => ({ id: 'user-1' }),
            getRecipeById: vi.fn().mockResolvedValue(recipe),
            updateRecipe: vi.fn(),
            createRecipe: vi.fn()
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeEditor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should generate a valid ingredient id when editing a recipe with legacy ingredient ids', () => {
    component.newIngName = 'Salt';
    component.newIngQty = 1;
    component.newIngUnit = 'g';

    component.addIngredient();

    expect(Object.keys(component.ingredients)).toEqual(['ingredientA', 'ingredientB', 'ing_1']);
    expect(component.ingredients['ingredientA'].name).toBe('Flour');
  });
});
