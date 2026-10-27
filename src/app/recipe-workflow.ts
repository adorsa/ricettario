import { Service, inject, signal, computed } from '@angular/core';
import { RecipeStep, StepWorkflowStatus } from './recipe.model';
import { Timer } from './timer';
import { ActiveRecipe } from './active-recipe';

const STORAGE_PREFIX = 'ricettario-workflow:';

interface WorkflowSnapshot {
  userId: string;
  recipeId: string;
  completedStepIds: string[];
}

@Service()
export class RecipeWorkflow {
  private timer = inject(Timer);
  private activeRecipe = inject(ActiveRecipe);
  private activeUserId: string | null = null;
  private activeRecipeId: string | null = null;

  completedStepIds = signal<string[]>([]);
  
  stepStatuses = computed(() => {
    const recipe = this.activeRecipe.recipe();
    if (!recipe) return {};

    const completed = this.completedStepIds();
    const activeSuspends = this.timer.activeTimers();
    const statuses: { [stepId: string]: StepWorkflowStatus } = {};

    for (const step of recipe.steps) {
      if (completed.includes(step.id)) {
        statuses[step.id] = 'COMPLETED';
        continue;
      }

      const isSuspended = activeSuspends.some(timer => timer.stepId === step.id);
      if (isSuspended) {
        statuses[step.id] = 'PENDING';
        continue;
      }

      const isUnlocked = this.checkDependencies(step, completed);
      statuses[step.id] = isUnlocked ? 'READY' : 'LOCKED';
    }

    return statuses;
  });

  availableSteps = computed(() => {
    const recipe = this.activeRecipe.recipe();
    if (!recipe) return [];
    const statuses = this.stepStatuses();
    return recipe.steps.filter(step => statuses[step.id] === 'READY');
  });

  currentWorkflowStep = computed<RecipeStep | null>(() => {
    const available = this.availableSteps();
    return available.length > 0 ? available[0] : null;
  });

  isIdleTime = computed(() => {
    const recipe = this.activeRecipe.recipe();
    if (!recipe) return false;

    const statuses = this.stepStatuses();
    const totalSteps = recipe.steps.length;
    
    const completedCount = recipe.steps.filter(s => statuses[s.id] === 'COMPLETED').length;
    const pendingCount = recipe.steps.filter(s => statuses[s.id] === 'PENDING').length;

    return completedCount < totalSteps && this.availableSteps().length === 0 && pendingCount > 0;
  });

  constructor() {
    this.timer.onItemCompleted.subscribe(({ stepId }) => {
      this.markStepAsCompleted(stepId);
    });
  }

  startWorkflow(recipeId: string, userId: string) {
    this.activeRecipeId = recipeId;
    this.activeUserId = userId;
    this.completedStepIds.set([]);
    this.persistWorkflow();
  }

  restoreWorkflow(userId: string): string | null {
    const snapshot = this.readSnapshot(userId);
    if (!snapshot) {
      if (this.activeUserId && this.activeUserId !== userId) {
        this.activeUserId = null;
        this.activeRecipeId = null;
        this.completedStepIds.set([]);
      }
      return null;
    }

    this.activeUserId = snapshot.userId;
    this.activeRecipeId = snapshot.recipeId;
    this.completedStepIds.set(snapshot.completedStepIds);
    return snapshot.recipeId;
  }

  ensureWorkflow(recipeId: string, userId: string, validStepIds: string[]) {
    if (this.activeUserId !== userId || this.activeRecipeId !== recipeId) {
      const snapshot = this.readSnapshot(userId);
      if (snapshot?.recipeId === recipeId) {
        this.activeUserId = userId;
        this.activeRecipeId = recipeId;
        this.completedStepIds.set(snapshot.completedStepIds);
      } else {
        this.startWorkflow(recipeId, userId);
      }
    }

    const validIds = new Set(validStepIds);
    this.completedStepIds.update(ids => ids.filter(id => validIds.has(id)));
    if (validStepIds.length > 0 && validStepIds.every(id => this.completedStepIds().includes(id))) {
      this.clearWorkflow();
      return;
    }

    this.persistWorkflow();
    this.timer.checkExpiredTimersForSteps(validStepIds);
  }

  clearWorkflow() {
    if (this.activeUserId) {
      try {
        localStorage.removeItem(this.getStorageKey(this.activeUserId));
      } catch {
        // Storage can be unavailable in private browsing or restricted contexts.
      }
    }
    this.activeUserId = null;
    this.activeRecipeId = null;
  }

  markStepAsCompleted(stepId: string) {
    this.timer.removeTimersForStep(stepId);
    this.completedStepIds.update(ids => {
      if (!ids.includes(stepId)) {
        return [...ids, stepId];
      }
      return ids;
    });

    const recipe = this.activeRecipe.recipe();
    const completed = this.completedStepIds();
    if (recipe?.steps.length && recipe.steps.every(step => completed.includes(step.id))) {
      this.clearWorkflow();
    } else {
      this.persistWorkflow();
    }
  }

  private checkDependencies(step: RecipeStep, completedIds: string[]): boolean {
    if (!step.dependencies || step.dependencies.length === 0) return true;

    return step.dependencies.every(dep => {
      if (dep.includes(':rem<=')) {
        const [targetStepId, condition] = dep.split(':rem<=');
        const thresholdMinutes = parseInt(condition, 10);
        
        const minutesLeft = this.timer.getTimeRemainingMinutes(targetStepId);
        
        if (minutesLeft >= 0 && minutesLeft <= thresholdMinutes) {
          return true;
        }
        return false;
      }

      return completedIds.includes(dep);
    });
  }

  private getStorageKey(userId: string): string {
    return `${STORAGE_PREFIX}${userId}`;
  }

  private readSnapshot(userId: string): WorkflowSnapshot | null {
    try {
      const serialized = localStorage.getItem(this.getStorageKey(userId));
      if (!serialized) return null;

      const snapshot = JSON.parse(serialized) as Partial<WorkflowSnapshot>;
      if (
        snapshot.userId !== userId ||
        typeof snapshot.recipeId !== 'string' ||
        !Array.isArray(snapshot.completedStepIds) ||
        !snapshot.completedStepIds.every(id => typeof id === 'string')
      ) {
        localStorage.removeItem(this.getStorageKey(userId));
        return null;
      }

      return snapshot as WorkflowSnapshot;
    } catch {
      try {
        localStorage.removeItem(this.getStorageKey(userId));
      } catch {
        // Storage can be unavailable in private browsing or restricted contexts.
      }
      return null;
    }
  }

  private persistWorkflow() {
    if (!this.activeUserId || !this.activeRecipeId) return;

    const snapshot: WorkflowSnapshot = {
      userId: this.activeUserId,
      recipeId: this.activeRecipeId,
      completedStepIds: this.completedStepIds()
    };

    try {
      localStorage.setItem(this.getStorageKey(this.activeUserId), JSON.stringify(snapshot));
    } catch {
      // Storage can be unavailable in private browsing or restricted contexts.
    }
  }
}