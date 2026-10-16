import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLinkWithHref } from '@angular/router';
import { RecipeList } from './recipe-list/recipe-list';
import { Supabase } from './supabase';
import { TimerWidget } from './timer-widget/timer-widget';

@Component({
  imports: [RouterOutlet, TimerWidgetComponent, RouterLinkWithHref],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private supabaseService = inject(Supabase);
  private router = inject(Router);
  protected readonly title = signal('ricettario');

  newRecipe() {
    this.router.navigate(['/recipes/new']);
  }

  logout() {
    this.supabaseService.signOut();
  }
}
