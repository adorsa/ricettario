import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { RecipeWorkflow } from './../recipe-workflow';
import { RecipeParser } from './../recipe-parser';
import { Timer } from './../timer';
import { ActiveRecipe } from './../active-recipe';
import { RecipeStep } from './../recipe.model';
import { I18n } from './../i18n/i18n';
import { StepTimer } from '../timer.model';

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
  public activeRecipe = inject(ActiveRecipe);
  public i18n = inject(I18n);

  private pausePhraseKeys = ['work.pause0', 'work.pause1', 'work.pause2', 'work.pause3'] as const;

  idleMessageKey = signal<(typeof this.pausePhraseKeys)[number]>(this.pausePhraseKeys[0]);

  currentStep = computed<RecipeStep | null>(() => {
    const step = this.workflow.currentWorkflowStep();
    return step ? step : null;
  });

  currentStepHasTimer = computed<boolean>(() => {
    const step = this.currentStep();
    if(!step) return false;
    return /\[t:(\d+):([^\]]+)\]/.test(step!.text);
  });

  currentStepTimers = computed<StepTimer[] | undefined>(() => {
    const step = this.currentStep();
    if(!step) return;
    const timerRegexMultiple = /\[t:(\d+):([^\]]+)\]/g;

    return [...step.text.matchAll(timerRegexMultiple)]
      .map((match) => { 
        return { minutes: parseInt(match[1], 10), label: match[2].trim() } as StepTimer; 
      });
  });

  parsedStepHtml = computed(() => {
    const step = this.currentStep();
    const recipe = this.activeRecipe.recipe();
    if (!step || !recipe) return '';
    return this.parser.parseStepText(step.text, recipe.ingredients, this.activeRecipe.multiplier());
  });

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      try {
        const recipeData = await this.activeRecipe.loadRecipe(id);
        if (recipeData) {
          this.workflow.initWorkflow();
          this.rotateIdleMessage();
        }
      } catch (err) {
        console.error('Unable to load the recipe workflow:', err);
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
      
      this.timer.startCountdown(step.id, {minutes: minutes, label: label});
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
        this.timer.startCountdown(step.id, {minutes: minutes, label: label});
        this.rotateIdleMessage();
      }
    }
  }

  startAllTimers() {
    if(!this.currentStepTimers()) return;
    this.currentStepTimers()!.forEach(timer => {
      if(this.currentStep()) this.timer.startCountdown(this.currentStep()!.id, timer);
    });
  }

  rotateIdleMessage() {
    const randomIndex = Math.floor(Math.random() * this.pausePhraseKeys.length);
    this.idleMessageKey.set(this.pausePhraseKeys[randomIndex]);
  }

  exitWorkMode() {
    const recipe = this.activeRecipe.recipe();
    if (recipe && recipe.id) {
      this.router.navigate(['/recipes', recipe.id]);
    } else {
      this.router.navigate(['/recipes']);
    }
  }
}