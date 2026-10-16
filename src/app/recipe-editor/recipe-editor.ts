import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Supabase } from '../supabase';
import { IngredientsMap, RecipeStep } from '../recipe.model';

interface EditableRecipeStep {
  id: string;
  text: string;
  tempDependencies: string;
}

@Component({
  selector: 'app-recipe-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recipe-editor.html'
})
export class RecipeEditor implements OnInit {
  private supabaseService = inject(Supabase);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isEditMode = signal<boolean>(false);
  recipeId: string | null = null;
  isLoading = signal(false);

  title = '';
  servingsBase = 4;
  ingredients: IngredientsMap = {};
  
  steps: EditableRecipeStep[] = [{ id: '', text: '', tempDependencies: '' }];

  newIngName = '';
  newIngQty: number | null = null;
  newIngUnit = '';

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
          
          this.steps = recipe.steps.map((step: RecipeStep) => ({
            id: step.id,
            text: step.text,
            tempDependencies: step.dependencies ? step.dependencies.join(', ') : ''
          }));

          const keys = Object.keys(recipe.ingredients);
          if (keys.length > 0) {
            const maxId = Math.max(...keys.map(k => parseInt(k.replace('ing_', ''), 10)));
            this.ingredientCounter = maxId + 1;
          }
        }
      } catch (err) {
        console.error('Error loading recipe:', err);
        this.router.navigate(['/recipes']);
      } finally {
        this.isLoading.set(false);
      }
    }
  }

  addIngredient() {
    if (!this.newIngName || this.newIngQty === null) return;

    const id = `ing_${this.ingredientCounter++}`;
    this.ingredients[id] = {
      name: this.newIngName,
      qty: this.newIngQty,
      unit: this.newIngUnit || ''
    };

    this.newIngName = '';
    this.newIngQty = null;
    this.newIngUnit = '';
  }

  removeIngredient(key: string) {
    delete this.ingredients[key];
  }

  addStepField() {
    this.steps.push({ id: '', text: '', tempDependencies: '' });
  }

  removeStepField(index: number) {
    if (this.steps.length > 1) {
      this.steps.splice(index, 1);
    }
  }

  cancel() {
    if (this.isEditMode() && this.recipeId) {
      this.router.navigate(['/recipes', this.recipeId]);
    } else {
      this.router.navigate(['/recipes']);
    }
  }

  async saveRecipe() {
    if (!this.title || this.objectKeys(this.ingredients).length === 0) return;

    this.isLoading.set(true);
    try {
      const cleanSteps: RecipeStep[] = this.steps
        .filter(s => s.id.trim() !== '' && s.text.trim() !== '')
        .map(s => {
          const depsArray = s.tempDependencies
            ? s.tempDependencies.split(',').map(d => d.trim()).filter(d => d !== '')
            : [];

          return {
            id: s.id.trim(),
            text: s.text,
            dependencies: depsArray
          };
        });

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
      console.error('Error during save:', err);
      alert('There was an error saving this recipe.');
    } finally {
      this.isLoading.set(false);
    }
  }

  objectKeys(obj: any) { 
    return Object.keys(obj); 
  }

  exportToJSON() {
    if (!this.title) {
      alert("Exporting requires the recipe title to be set. Type a recipe title and try again.");
      return;
    }

    const cleanSteps = this.steps
      .filter(s => s.id.trim() !== '' && s.text.trim() !== '')
      .map(s => ({
        id: s.id.trim(),
        text: s.text,
        dependencies: s.tempDependencies ? s.tempDependencies.split(',').map(d => d.trim()).filter(d => d !== '') : []
      }));

    const recipeData = {
      title: this.title,
      servings_base: this.servingsBase,
      ingredients: this.ingredients,
      steps: cleanSteps
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(recipeData, null, 2));
    const downloadAnchor = document.createElement('a');
    
    const fileName = `recipe-${this.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`;
    
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  onFileImported(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const jsonText = e.target?.result as string;
        const importedRecipe = JSON.parse(jsonText);

        if (!importedRecipe.title || !importedRecipe.ingredients || !importedRecipe.steps) {
          alert("The imported JSON file is not in a valid format for this application.");
          return;
        }

        this.title = importedRecipe.title;
        this.servingsBase = importedRecipe.servings_base || 4;
        this.ingredients = importedRecipe.ingredients;
        
        this.steps = importedRecipe.steps.map((step: any) => ({
          id: step.id,
          text: step.text,
          tempDependencies: step.dependencies ? step.dependencies.join(', ') : ''
        }));

        alert("Still not saved! The recipe imported correctly, check the data on this form and click 'Save' to keep it in your recipe book.");
      } catch (err) {
        console.error("Error reading the file:", err);
        alert("Error reading the file. Please ensure it is a valid JSON file in the correct format.");
      }
    };

    reader.readAsText(file);
  }
}
