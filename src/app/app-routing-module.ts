import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthComponent } from './pages/auth/auth-component/auth-component';
import { BaseComponents } from './mise-en-pages/base-components/base-components';
import { DashboardComponent } from './pages/dashboard-component/dashboard-component';
import { AuthGuard } from './coeur/garde-auth/auth.guard';
import { ListeUtilisateurComponent } from './pages/utilisateur/liste-utilisateur-component/liste-utilisateur-component';

const routes: Routes = [
  { path: 'login', component: AuthComponent },

  {
    path: '',
    component: BaseComponents,
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    children: [
      { 
        path: '', 
        pathMatch: 'full', 
        redirectTo: 'dashboard' 
      },
      
      { 
        path: 'dashboard', 
        component: DashboardComponent,
        data: { roles: ['ROLE_ADMIN', 'AGENT_ACCUEIL'] }
      },

      // Vehicule
      {
        path: 'vehicules',
        loadChildren: () =>
          import('./pages/transport/vehicule/vehicule-module').then(m => m.VehiculeModule),
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard]
      },

      {
        path: 'villes',
        loadChildren: () =>
          import('./pages/transport/ville/ville.module').then(m => m.VilleModule),
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard]
      },

      {
        path: 'trajets',
        loadChildren: () =>
          import('./pages/transport/trajet/trajet-module').then(m => m.TrajetModule),
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard]
      },

      {
        path: 'reservations',
        loadChildren: () =>
          import('./pages/reservation/reservation.module').then(m => m.ReservationModule),
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard]
      },
      {
        path: 'utilisateurs',
        component: ListeUtilisateurComponent,
        canActivate: [AuthGuard],
        data: { roles: ['ROLE_ADMIN', 'AGENT_ACCUEIL'] }
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
