import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Supabase } from './../supabase';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.html',
  styleUrl: './auth.css'
})
export class Auth {
  private supabaseService = inject(Supabase);
  private router = inject(Router);

  email = '';
  password = '';

  isLoginMode = signal(true);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  toggleMode() {
    this.isLoginMode.update(mode => !mode);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  async onSubmit() {
    if (!this.email || !this.password) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      if (this.isLoginMode()) {
        await this.supabaseService.signIn(this.email, this.password);
        this.successMessage.set('Successfully logged in!');
        this.router.navigate(['/']);
      } else {
        await this.supabaseService.signUp(this.email, this.password);
        this.successMessage.set('Account created. Check your email.');
        this.password = '';
      }
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Authentication error');
    } finally {
      this.isLoading.set(false);
    }
  }
}
