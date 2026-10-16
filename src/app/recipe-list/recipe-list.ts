import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Supabase } from './../supabase';
import { Router } from '@angular/router';
import { Recipe } from '../recipe.model';

@Component({
  selector: 'app-recipe-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recipe-list.html',
  styleUrl: './recipe-list.css'
})
export class RecipeList implements OnInit {
  private supabaseService = inject(Supabase);
  private router = inject(Router);

  recipesSignal = signal<any[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.loadRecipes();
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

  async loadRecipes() {
    this.isLoading.set(true);
    try {
      const data = await this.supabaseService.getRecipes();
      this.recipesSignal.set(data || []);
    } catch (err) {
      console.error('Error loading recipes:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteRecipe(event: MouseEvent, id: string) {
    event.stopPropagation();
    
    if (confirm('Are you sure you want to delete this recipe?')) {
      try {
        await this.supabaseService.deleteRecipe(id);
        // Remove the deleted recipe from the local list.
        this.recipesSignal.update(recipes => recipes.filter(r => r.id !== id));
      } catch (err) {
        console.error('There was an error while deleting the recipe:', err);
      }
    }
  }
}
