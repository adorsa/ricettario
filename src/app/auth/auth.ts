import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Supabase } from './../supabase';
import { I18n } from '../i18n/i18n';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.html',
  styleUrls: ['./auth.css']
})
export class Auth {
  private supabaseService = inject(Supabase);
  public i18n = inject(I18n);

  email = '';
  password = '';

  isLoginMode = signal(true);
  isLoading = signal(false);
  errorMessage = signal(false);
  successMessage = signal<'auth.loginSuccess' | 'auth.signupSuccess' | null>(null);

  toggleMode() {
    this.isLoginMode.update(mode => !mode);
    this.errorMessage.set(false);
    this.successMessage.set(null);
  }

  async onSubmit() {
    if (!this.email || !this.password) return;

    this.isLoading.set(true);
    this.errorMessage.set(false);
    this.successMessage.set(null);

    try {
      if (this.isLoginMode()) {
        await this.supabaseService.signIn(this.email, this.password);
        this.successMessage.set('auth.loginSuccess');
      } else {
        await this.supabaseService.signUp(this.email, this.password);
        this.successMessage.set('auth.signupSuccess');
        this.password = '';
      }
    } catch (error: any) {
      this.errorMessage.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }
}
