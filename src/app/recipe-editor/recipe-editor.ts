import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Supabase } from '../supabase';
import { IngredientsMap, RecipeStep } from '../recipe.model';
import { I18n } from '../i18n/i18n';

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
  public i18n = inject(I18n);

  isEditMode = signal<boolean>(false);
  recipeId: string | null = null;
  isLoading = signal(false);

  title = '';
  servingsBase = 4;
  isPublic = false;
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
          if (recipe.user_id !== this.supabaseService.currentUser()?.id) {
            this.router.navigate(['/recipes', recipe.id]);
            return;
          }

          this.title = recipe.title;
          this.servingsBase = recipe.servings_base;
          this.isPublic = recipe.is_public ?? false;
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
        is_public: this.isPublic,
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
      alert(this.i18n.t('editor.saveError'));
    } finally {
      this.isLoading.set(false);
    }
  }

  objectKeys(obj: any) { 
    return Object.keys(obj); 
  }

  exportToJSON() {
    if (!this.title) {
      alert(this.i18n.t('editor.exportNeedsTitle'));
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
      is_public: this.isPublic,
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
          alert(this.i18n.t('editor.invalidImport'));
          return;
        }

        this.title = importedRecipe.title;
        this.servingsBase = importedRecipe.servings_base || 4;
        this.isPublic = importedRecipe.is_public === true;
        this.ingredients = importedRecipe.ingredients;
        
        this.steps = importedRecipe.steps.map((step: any) => ({
          id: step.id,
          text: step.text,
          tempDependencies: step.dependencies ? step.dependencies.join(', ') : ''
        }));

        alert(this.i18n.t('editor.importSuccess'));
      } catch (err) {
        console.error("Error reading the file:", err);
        alert(this.i18n.t('editor.readError'));
      }
    };

    reader.readAsText(file);
  }
}
