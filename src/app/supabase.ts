import { Injectable, signal, computed, Service } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../environments/environment.development';
import { Recipe } from './recipe.model';

@Service()
export class Supabase {
  private supabase: SupabaseClient;
  
  private currentUserSignal = signal<User | null>(null);

  currentUser = computed(() => this.currentUserSignal());
  isAuthenticated = computed(() => this.currentUserSignal() !== null);

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

    const sessionKey = `sb-${new URL(environment.supabaseUrl).hostname.split('.')[0]}-auth-token`;
    const localSession = localStorage.getItem(sessionKey);
    
    if (localSession) {
      try {
        const parsed = JSON.parse(localSession);
        if (parsed && parsed.user) {
          this.currentUserSignal.set(parsed.user);
        }
      } catch (e) {
        console.error("Errore nel parsing della sessione locale:", e);
      }
    }

    this.supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        this.currentUserSignal.set(data.session.user);
      } else {
        this.currentUserSignal.set(null);
      }
    });

    this.supabase.auth.onAuthStateChange((event, session) => {
      console.log(`Supabase Auth Event: ${event}`);
      this.currentUserSignal.set(session?.user ?? null);
    });
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  async createRecipe(recipe: Omit<Recipe, 'id' | 'user_id' | 'created_at'>) {
    const user = this.currentUserSignal();
    if (!user) throw new Error('Utente non autenticato');

    const { data, error } = await this.supabase
      .from('recipes')
      .insert([{ ...recipe, user_id: user.id }])
      .select();

    if (error) throw error;
    return data;
  }

  async getRecipes(): Promise<Recipe[]> {
    const user = this.currentUserSignal();
    if (!user) throw new Error('Utente non autenticato');

    const { data, error } = await this.supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Recipe[];
  }

  async getRecipeById(id: string): Promise<Recipe> {
    const { data, error } = await this.supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Recipe;
  }

  async updateRecipe(id: string, updates: Partial<Omit<Recipe, 'id' | 'user_id' | 'created_at'>>) {
    const { data, error } = await this.supabase
      .from('recipes')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data;
  }

  async deleteRecipe(id: string) {
    const { error } = await this.supabase
      .from('recipes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
