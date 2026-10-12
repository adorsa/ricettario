import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Supabase } from '../supabase';
import { Recipe } from '../recipe.model';
import { RecipeParser } from '../recipe-parser';
import { Timer } from '../timer';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recipe-detail.html',
  styleUrl: './recipe-detail.css'
})
export class RecipeDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private supabaseService = inject(Supabase);
  private parserService = inject(RecipeParser);
  private timerService = inject(Timer);

  recipe = signal<Recipe | null>(null);
  baseServings = computed(() => this.recipe()?.servings_base ?? 4);
  currentServings = signal(4);
  multiplier = computed(() => this.currentServings() / this.baseServings());

  parsedSteps = computed(() => {
    const currentRecipe = this.recipe();
    if (!currentRecipe) return [];
    return currentRecipe.steps.map(step => 
      this.parserService.parseStep(step, currentRecipe.ingredients, this.multiplier())
    );
  });

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      try {
        const data = await this.supabaseService.getRecipeById(id);
        if (data) {
          this.recipe.set(data as Recipe);
          this.currentServings.set(data.servings_base);
        }
      } catch (err) {
        console.error('Errore nel caricamento della ricetta:', err);
        this.router.navigate(['/recipes']);
      }
    }
  }

  updateServings(value: number) {
    if (value && value > 0) this.currentServings.set(value);
  }

  goBack() {
    this.router.navigate(['/recipes']);
  }
  
  goToEdit() {
  const currentRecipe = this.recipe();
  if (currentRecipe) {
    this.router.navigate(['/recipes', currentRecipe.id, 'edit']);
  }
}

  handleStepClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    
    const timerBtn = target.closest('.timer-btn') as HTMLElement;
    
    if (timerBtn) {
      event.preventDefault();
      event.stopPropagation();

      const minutesStr = timerBtn.getAttribute('data-minutes');
      
      const fullText = timerBtn.innerText || '';
      const label = fullText.replace('⏱️', '').trim();

      if (minutesStr) {
        const minutes = parseInt(minutesStr, 10);
        console.log(`Timer started: ${minutes} minuts for "${label}"`);
        
        this.timerService.startNewTimer(minutes, label);
      }
    }
  }

  objectValues(obj: any) {
    return Object.keys(obj).map(key => ({ key, value: obj[key] }));
  }
}