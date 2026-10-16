import { Component, inject, signal, computed, OnInit } from '@angular/router';
import { Router, ActivatedRoute } from '@angular/router';
import { RecipeWorkflow } from './recipe-workflow';
import { RecipeParser } from './recipe-parser';
import { Timer } from './timer';
import { Supabase } from './supabase';
import { RecipeStep } from './recipe.model';

@Component({
  selector: 'app-recipe-work-mode',
  standalone: true,
  templateUrl: './recipe-work-mode.html',
  styleUrls: ['./recipe-work-mode.css']
})
export class RecipeWorkMode implements OnInit {
  public workflow = inject(RecipeWorkflow);
  private parser = inject(RecipeParser);
  private timer = inject(Timer);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private supabase = inject(Supabase);

  // Random messages for idle time
  private pausePhrases = [
    'Time for a small break! Timers will let you know when it\'s time to get back to work.',
    'All done for now! You might clean up the kitchen while you wait. 😊',
    'Good job! Now take a deep breath and relax until the timers call you back.',
    'Take a break while yeast, fire, oven or whatever else work their magic.'
  ];

  idleMessage = signal(this.pausePhrases[0]);

  currentStep = computed<RecipeStep | null>(() => {
    const step = this.workflow.currentWorkflowStep();
    return step ? step : null;
  });

  parsedStepHtml = computed(() => {
    const step = this.currentStep();
    const recipe = this.workflow.activeRecipe();
    if (!step || !recipe) return '';
    return this.parser.parseStepText(step.text, recipe.ingredients, 1);
  });

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      try {
        const recipeData = await this.supabase.getRecipeById(id);
        if (recipeData) {
          this.workflow.initWorkflow(recipeData);
          this.rotateIdleMessage();
        }
      } catch (err) {
        console.error('Impossibile caricare il flusso della ricetta:', err);
        this.router.navigate(['/recipes']);
      }
    }
  }

  completeStep() {
    const step = this.currentStep();
    if (!step) return;

    const timerRegex = /\[t:(\d+):([^\]]+)\]/;
    const match = step.text.match(timerRegex);

    if (match) {
      const minutes = parseInt(match[1], 10);
      const label = match[2].trim();
      
      this.timer.startCountdown(step.id, minutes, label);
      this.rotateIdleMessage();
    } else {
      this.workflow.markStepAsCompleted(step.id);
    }
  }

  putStepOnHold() {
    const step = this.currentStep();
    if (!step) return;

    const cleanLabel = step.text.length > 25 ? step.text.substring(0, 25) + '...' : step.text;
    
    this.timer.putOnHold(step.id, cleanLabel);
    this.rotateIdleMessage();
  }

  handleInlineTimerClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const timerBtn = target.closest('.timer-btn') as HTMLElement;
    const step = this.currentStep();

    if (timerBtn && step) {
      const minutesStr = timerBtn.getAttribute('data-minutes');
      const label = (timerBtn.innerText || '').replace('⏱️', '').trim();

      if (minutesStr) {
        const minutes = parseInt(minutesStr, 10);
        this.timer.startCountdown(step.id, minutes, label);
        this.rotateIdleMessage();
      }
    }
  }

  rotateIdleMessage() {
    const randomIndex = Math.floor(Math.random() * this.pausePhrases.length);
    this.idleMessage.set(this.pausePhrases[randomIndex]);
  }

  exitWorkMode() {
    const recipe = this.workflow.activeRecipe();
    if (recipe && recipe.id) {
      this.router.navigate(['/recipes', recipe.id]);
    } else {
      this.router.navigate(['/recipes']);
    }
  }
}