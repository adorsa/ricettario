import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { TimerWidget } from './timer-widget/timer-widget';
import { Timer } from './timer';
import { Supabase } from './supabase';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, TimerWidget],
  templateUrl: './app.html'
})
export class App {
  public timerService = inject(Timer);
  public supabaseService = inject(Supabase); 

  async logout() {
    try {
      await this.supabaseService.signOut();
    } catch (err) {
      console.error('Error during logout:', err);
    }
  }
}
