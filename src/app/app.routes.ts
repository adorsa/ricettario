import { Routes } from '@angular/router';
import { RecipeDetail } from './recipe-detail/recipe-detail';
import { Auth } from './auth/auth';
import { RecipeListComponent } from './recipe-list/recipe-list';
import { RecipeEditorComponent } from './recipe-editor/recipe-editor';

export const routes: Routes = [
  { path: 'auth', component: Auth },
  { path: 'recipes', component: RecipeListComponent },
  { path: 'recipes/new', component: RecipeEditorComponent },
  { path: 'recipes/:id', component: RecipeDetail },
  { path: '', redirectTo: '/recipes', pathMatch: 'full' },
  { path: '**', redirectTo: '/recipes' }
];
