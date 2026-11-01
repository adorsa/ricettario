import { ApplicationConfig, ApplicationRef, inject, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';
import { filter, take } from 'rxjs';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: () => {
        const appRef = inject(ApplicationRef);
        
        return appRef.isStable.pipe(
          filter((stable) => stable === true),
          take(1)
        );
      }
    })
  ]
};
