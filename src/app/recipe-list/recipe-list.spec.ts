import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { Supabase } from '../supabase';
import { RecipeList } from './recipe-list';

describe('RecipeList', () => {
  let component: RecipeList;
  let fixture: ComponentFixture<RecipeList>;
  let authenticated: ReturnType<typeof signal<boolean>>;
  let getRecipes: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    authenticated = signal(false);
    getRecipes = vi.fn().mockResolvedValue([]);

    await TestBed.configureTestingModule({
      imports: [RecipeList],
      providers: [
        provideRouter([]),
        {
          provide: Supabase,
          useValue: {
            isAuthenticated: authenticated,
            currentUser: signal(null),
            getRecipes
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should direct unauthenticated users to login and reload recipes after authentication changes', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('a[routerLink="/auth"]')).not.toBeNull();
    expect(getRecipes).not.toHaveBeenCalled();

    authenticated.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(getRecipes).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.textContent).toContain('There are no recipes yet');

    authenticated.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('a[routerLink="/auth"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('There are no recipes yet');
  });
});
