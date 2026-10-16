import { Routes } from '@angular/router';
import { RecipeDetail } from './recipe-detail/recipe-detail';
import { Auth } from './auth/auth';
import { RecipeList } from './recipe-list/recipe-list';
import { RecipeEditor } from './recipe-editor/recipe-editor';

export const routes: Routes = [
  { path: 'auth', component: Auth },
  { path: 'recipes', component: RecipeList },
  { path: 'recipes/new', component: RecipeEditor },
  { path: 'recipes/:id', component: RecipeDetail },
  { path: 'recipes/:id/edit', component: RecipeEditor },
  { path: '', redirectTo: '/recipes', pathMatch: 'full' },
  { path: '**', redirectTo: '/recipes' }
];
