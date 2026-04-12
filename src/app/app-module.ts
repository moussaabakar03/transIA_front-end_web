import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { AuthComponent } from './pages/auth/auth-component/auth-component';
import { ErrorComponent } from './pages/auth/error-component/error-component';
import { SessionExpiredComponent } from './pages/auth/session-expired-component/session-expired-component';
import { FormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './coeur/intercepteurs/auth-interceptor';
import { BaseComponents } from './mise-en-pages/base-components/base-components';
import { SidebarComponent } from './mise-en-pages/base-components/sidebar-component/sidebar-component';
import { HeaderComponent } from './mise-en-pages/base-components/header-component/header-component';
import { FooterComponent } from './mise-en-pages/base-components/footer-component/footer-component';
import { DashboardComponent } from './pages/dashboard-component/dashboard-component';

@NgModule({
  declarations: [
    App,
    AuthComponent,
    ErrorComponent,
    SessionExpiredComponent,
    BaseComponents,
    SidebarComponent,
    HeaderComponent,
    FooterComponent,
    DashboardComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideClientHydration(withEventReplay()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [App]
})
export class AppModule { }
