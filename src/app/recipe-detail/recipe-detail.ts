import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../supabase.service';
import { Recipe } from '../recipe.model';
import { RecipeParserService } from '../recipe-parser.service';
import { TimerService } from '../timer.service';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './recipe-detail.component.html',
  styleUrls: ['./recipe-detail.component.css']
})
export class RecipeDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private supabaseService = inject(SupabaseService);
  private parserService = inject(RecipeParserService);
  private timerService = inject(TimerService);

  recipe = signal<Recipe | null>(null);
  baseServings = computed(() => this.recipe()?.servings_base ?? 4);
  currentServings = signal(4);
  multiplier = computed(() => this.currentServings() / this.baseServings());

  parsedSteps = computed(() => {
    const currentRecipe = this.recipe();
    if (!currentRecipe) return [];
    return currentRecipe.steps.map(step => ({
      id: step.id,
      text: step.text,
      html: this.parserService.parseStepText(step.text, currentRecipe.ingredients, this.multiplier())
    }));
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
        console.error('Error loading recipe:', err);
        this.router.navigate(['/recipes']);
      }
    }
  }

  updateServings(value: number) {
    if (value && value > 0) {
      this.currentServings.set(value);
    }
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

  handleStepClick(event: MouseEvent, stepId: string, stepText: string) {
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
        this.timerService.startCountdown(stepId, minutes, label);
      }
    }
  }

  objectValues(obj: any) {
    return Object.keys(obj).map(key => ({ key, value: obj[key] }));
  }
}