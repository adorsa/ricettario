import { TestBed } from '@angular/core/testing';
import { ActiveRecipe } from './active-recipe';
import { Recipe } from './recipe.model';
import { Supabase } from './supabase';

describe('ActiveRecipe', () => {
  let service: ActiveRecipe;
  let getRecipeById: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getRecipeById = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: Supabase, useValue: { getRecipeById } }]
    });
    service = TestBed.inject(ActiveRecipe);
  });

  it('preserves custom servings when reloading the same recipe and resets them for another recipe', async () => {
    const recipe: Recipe = {
      id: 'recipe-1',
      title: 'Pasta',
      servings_base: 4,
      is_public: false,
      ingredients: {},
      steps: []
    };
    const anotherRecipe = { ...recipe, id: 'recipe-2', servings_base: 2 };
    getRecipeById.mockResolvedValueOnce(recipe).mockResolvedValueOnce(recipe).mockResolvedValueOnce(anotherRecipe);

    await service.loadRecipe('recipe-1');
    service.setServings(6);
    await service.loadRecipe('recipe-1');

    expect(service.servings()).toBe(6);
    expect(service.multiplier()).toBe(1.5);

    await service.loadRecipe('recipe-2');

    expect(service.recipe()?.id).toBe('recipe-2');
    expect(service.servings()).toBe(2);
  });
});