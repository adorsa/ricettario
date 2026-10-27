import { Component, effect, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink } from '@angular/router';
import { TimerWidget } from './timer-widget/timer-widget';
import { Timer } from './timer';
import { Supabase } from './supabase';
import { I18n } from './i18n/i18n';
import { RecipeWorkflow } from './recipe-workflow';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, TimerWidget],
  templateUrl: './app.html'
})
export class App {
  public timerService = inject(Timer);
  public supabaseService = inject(Supabase); 
  public i18n = inject(I18n);
  private router = inject(Router);
  private workflow = inject(RecipeWorkflow);

  private resumeWorkflowEffect = effect(() => {
    if (!this.supabaseService.authReady()) return;

    const user = this.supabaseService.currentUser();
    if (!user) return;

    const recipeId = this.workflow.restoreWorkflow(user.id);
    if (recipeId) {
      const workUrl = `/recipes/${recipeId}/work`;
      if (this.router.url !== workUrl) {
        void this.router.navigate(['/recipes', recipeId, 'work']);
      }
    } else if (this.router.url === '/auth' || this.router.url.includes('/work')) {
      void this.router.navigate(['/recipes']);
    }
  });

  async logout() {
    try {
      await this.supabaseService.signOut();
    } catch (err) {
      console.error('Error during logout:', err);
    }
  }
}
