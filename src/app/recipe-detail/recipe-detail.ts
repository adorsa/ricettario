import { Component, computed, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActiveRecipe } from '../active-recipe';
import { RecipeParser } from '../recipe-parser';
import { Timer } from '../timer';
import { Supabase } from '../supabase';
import { I18n } from '../i18n/i18n';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './recipe-detail.html',
  styleUrls: ['./recipe-detail.css']
})
export class RecipeDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private activeRecipe = inject(ActiveRecipe);
  private parserService = inject(RecipeParser);
  private timerService = inject(Timer);
  private supabaseService = inject(Supabase);
  public i18n = inject(I18n);

  recipe = computed(() => this.activeRecipe.recipe());
  canEdit = computed(() => {
    const recipe = this.recipe();
    const user = this.supabaseService.currentUser();
    return !!user && recipe?.user_id === user.id;
  });
  baseServings = computed(() => this.recipe()?.servings_base ?? 4);
  currentServings = computed(() => this.activeRecipe.servings());
  multiplier = this.activeRecipe.multiplier;

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
        await this.activeRecipe.loadRecipe(id);
      } catch (err) {
        console.error('Error loading recipe:', err);
        this.router.navigate(['/recipes']);
      }
    }
  }

  updateServings(value: number) {
    if (value && value > 0) {
      this.activeRecipe.setServings(value);
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
        this.timerService.startCountdown(stepId, {minutes: minutes, label: label});
      }
    }
  }

  objectValues(obj: any) {
    return Object.keys(obj).map(key => ({ key, value: obj[key] }));
  }

  startWorkMode() {
    const currentRecipe = this.recipe();
    if (currentRecipe && currentRecipe.id) {
      this.router.navigate(['/recipes', currentRecipe.id, 'work']);
  }
}
}