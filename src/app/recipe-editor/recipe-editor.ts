import { Component, inject, signal, output, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Supabase } from '../supabase';
import { IngredientsMap } from '../recipe.model';

@Component({
  selector: 'app-recipe-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recipe-editor.html',
  styleUrl: './recipe-editor.css'
})
export class RecipeEditorComponent {
  private supabaseService = inject(Supabase);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Stati della modalità
  isEditMode = signal<boolean>(false);
  recipeId: string | null = null;

  // Stato del form
  title = '';
  servingsBase = 4;
  ingredients: IngredientsMap = {};
  steps: string[] = [''];

  // Campi temporanei ingrediente
  newIngName = '';
  newIngQty: number | null = null;
  newIngUnit = '';

  isLoading = signal(false);
  private ingredientCounter = 1;

  async ngOnInit() {
    this.recipeId = this.route.snapshot.paramMap.get('id');
    
    if (this.recipeId) {
      this.isEditMode.set(true);
      this.isLoading.set(true);
      try {
        const recipe = await this.supabaseService.getRecipeById(this.recipeId);
        if (recipe) {
          this.title = recipe.title;
          this.servingsBase = recipe.servings_base;
          this.ingredients = recipe.ingredients;
          this.steps = recipe.steps;

          const keys = Object.keys(recipe.ingredients);
          if (keys.length > 0) {
            const maxId = Math.max(...keys.map(k => parseInt(k.replace('ing_', ''), 10)));
            this.ingredientCounter = maxId + 1;
          }
        }
      } catch (err) {
        console.error('Errore nel caricamento della ricetta da modificare:', err);
        this.router.navigate(['/recipes']);
      } finally {
        this.isLoading.set(false);
      }
    }
  }
  onSaveSuccess = output<void>();
  onCancel = output<void>();

  addIngredient() {
    if (!this.newIngName || !this.newIngQty) return;

    const ingId = `ing_${this.ingredientCounter++}`;
    this.ingredients[ingId] = {
      name: this.newIngName,
      qty: this.newIngQty,
      unit: this.newIngUnit
    };

    this.newIngName = '';
    this.newIngQty = null;
    this.newIngUnit = '';
  }

  removeIngredient(id: string) {
    delete this.ingredients[id];
  }

  addStepField() {
    this.steps.push('');
  }

  removeStepField(index: number) {
    this.steps.splice(index, 1);
  }

  cancel() {
    if (this.isEditMode()) {
      this.router.navigate(['/recipes', this.recipeId]);
    } else {
      this.router.navigate(['/recipes']);
    }
  }

  async saveRecipe() {
    if (!this.title || this.objectKeys(this.ingredients).length === 0) return;

    this.isLoading.set(true);
    try {
      const cleanSteps = this.steps.filter(step => step.trim() !== '');

      const recipeData = {
        title: this.title,
        servings_base: this.servingsBase,
        ingredients: this.ingredients,
        steps: cleanSteps
      };

      if (this.isEditMode() && this.recipeId) {
        await this.supabaseService.updateRecipe(this.recipeId, recipeData);
        this.router.navigate(['/recipes', this.recipeId]);
      } else {
        await this.supabaseService.createRecipe(recipeData);
        this.router.navigate(['/recipes']);
      }
    } catch (err) {
      console.error('Errore durante il salvataggio:', err);
      alert('Si è verificato un errore durante il salvataggio.');
    } finally {
      this.isLoading.set(false);
    }
  }

  objectKeys(obj: any): string[] {
    return Object.keys(obj);
  }
}
