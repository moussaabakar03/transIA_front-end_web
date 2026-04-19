import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthComponent } from './pages/auth/auth-component/auth-component';
import { BaseComponents } from './mise-en-pages/base-components/base-components';
import { DashboardComponent } from './pages/dashboard-component/dashboard-component';
import { AuthGuard } from './coeur/garde-auth/auth.guard';

const routes: Routes = [
  { path: 'login', component: AuthComponent },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

  {
    path: '',
    component: BaseComponents,
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    children: [
      { path: 'dashboard', 
        component: DashboardComponent,
        data: { roles: ['ROLE_ADMIN', 'AGENT_ACCUEIL'] }
      },

      // Vehicule
      {
        path: 'vehicules',
        loadChildren: () =>
          import('./pages/transport/vehicule/vehicule-module').then(m => m.VehiculeModule)
      },

      {
        path: 'villes',
        loadChildren: () =>
          import('./pages/transport/ville/ville.module').then(m => m.VilleModule)
      },

      {
        path: 'trajets',
        loadChildren: () =>
          import('./pages/transport/trajet/trajet-module').then(m => m.TrajetModule)
      }

    ]
  },

  { path: '**', redirectTo: 'login' }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
