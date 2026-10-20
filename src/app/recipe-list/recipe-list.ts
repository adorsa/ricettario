import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Supabase } from './../supabase';
import { Router, RouterLink } from '@angular/router';
import { Recipe } from '../recipe.model';
import { I18n } from '../i18n/i18n';

@Component({
  selector: 'app-recipe-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './recipe-list.html',
  styleUrl: './recipe-list.css'
})
export class RecipeList {
  private supabaseService = inject(Supabase);
  private router = inject(Router);
  public i18n = inject(I18n);

  isAuthenticated = this.supabaseService.isAuthenticated;
  recipesSignal = signal<any[]>([]);
  isLoading = signal(true);
  private recipeLoadRequestId = 0;

  constructor() {
    effect(() => {
      const authenticated = this.isAuthenticated();
      const requestId = ++this.recipeLoadRequestId;

      if (!authenticated) {
        this.recipesSignal.set([]);
        this.isLoading.set(false);
        return;
      }

      this.recipesSignal.set([]);
      void this.loadRecipes(requestId);
    });
  }

  onCreateNew() {
    this.router.navigate(['/recipes/new']);
  }

  onSelectRecipe(recipe: Recipe) {
  this.router.navigate(['/recipes', recipe.id]);
  }

  isRecipeOwner(recipe: Recipe) {
    const user = this.supabaseService.currentUser();
    return !!user && recipe.user_id === user.id;
  }

  async loadRecipes(requestId = ++this.recipeLoadRequestId) {
    this.isLoading.set(true);
    try {
      const data = await this.supabaseService.getRecipes();
      if (requestId === this.recipeLoadRequestId && this.isAuthenticated()) {
        this.recipesSignal.set(data || []);
      }
    } catch (err) {
      if (requestId === this.recipeLoadRequestId) {
        console.error('Error loading recipes:', err);
      }
    } finally {
      if (requestId === this.recipeLoadRequestId) {
        this.isLoading.set(false);
      }
    }
  }

  async deleteRecipe(event: MouseEvent, recipe: Recipe) {
    event.stopPropagation();

    if (!this.isRecipeOwner(recipe)) return;

    if (confirm(this.i18n.t('recipes.deleteConfirm'))) {
      try {
        await this.supabaseService.deleteRecipe(recipe.id!);
        // Remove the deleted recipe from the local list.
        this.recipesSignal.update(recipes => recipes.filter(r => r.id !== recipe.id));
      } catch (err) {
        console.error(this.i18n.t('recipes.deleteError'), err);
      }
    }
  }
}
