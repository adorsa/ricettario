// src/app/routes.ts
import { Routes } from '@angular/router';
import { RecipeList } from './recipe-list/recipe-list';
import { RecipeDetail } from './recipe-detail/recipe-detail';
import { RecipeEditor } from './recipe-editor/recipe-editor';
import { RecipeWorkMode } from './recipe-work-mode/recipe-work-mode';
import { Auth } from './auth/auth';

export const routes: Routes = [
  { path: '', redirectTo: 'recipes', pathMatch: 'full' },
  { path: 'auth', component: Auth },
  { path: 'recipes', component: RecipeList },
  { path: 'recipes/new', component: RecipeEditor },
  { path: 'recipes/:id', component: RecipeDetail },
  { path: 'recipes/:id/edit', component: RecipeEditor },
  { path: 'recipes/:id/work', component: RecipeWorkMode },
  { path: '**', redirectTo: 'recipes' }
];
