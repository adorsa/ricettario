import { Component, inject, signal, output } from '@angular/core';
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

  onSaveSuccess = output<void>();
  onCancel = output<void>();

  title = '';
  servingsBase = 4;
  ingredients: IngredientsMap = {};
  steps: string[] = [''];

  newIngName = '';
  newIngQty: number | null = null;
  newIngUnit = '';

  isLoading = signal(false);
  private ingredientCounter = 1;

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

  async saveRecipe() {
    if (!this.title || this.objectKeys(this.ingredients).length === 0) return;

    this.isLoading.set(true);
    try {
      const cleanSteps = this.steps.filter(step => step.trim() !== '');

      await this.supabaseService.createRecipe({
        title: this.title,
        servings_base: this.servingsBase,
        ingredients: this.ingredients,
        steps: cleanSteps as any
      });

      this.onSaveSuccess.emit();
    } catch (err) {
      console.error('Errore saving the recipe:', err);
      alert('There was an error saving this recipe.');
    } finally {
      this.isLoading.set(false);
    }
  }

  objectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  trackByIndex(index: number, obj: any): any {
    return index;
  }
}
