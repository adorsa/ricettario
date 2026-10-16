import { computed, inject, signal, Service } from '@angular/core';
import { Recipe } from './recipe.model';
import { Supabase } from './supabase';

@Service()
export class ActiveRecipe {
  private supabase = inject(Supabase);
  private loadGeneration = 0;

  recipe = signal<Recipe | null>(null);
  servings = signal(4);
  multiplier = computed(() => {
    const recipe = this.recipe();
    return this.servings() / (recipe?.servings_base || 1);
  });

  async loadRecipe(id: string): Promise<Recipe | null> {
    const previousRecipe = this.recipe();
    const resetServings = previousRecipe?.id !== id || this.servings() === previousRecipe.servings_base;
    const generation = ++this.loadGeneration;

    if (previousRecipe?.id !== id) {
      this.recipe.set(null);
    }

    let recipe: Recipe;
    try {
      recipe = await this.supabase.getRecipeById(id);
    } catch (error) {
      if (generation !== this.loadGeneration) return null;
      throw error;
    }
    if (generation !== this.loadGeneration) return null;

    this.recipe.set(recipe);
    if (resetServings) {
      this.servings.set(recipe.servings_base);
    }
    return recipe;
  }

  setServings(value: number) {
    if (Number.isFinite(value) && value > 0) {
      this.servings.set(value);
    }
  }
}