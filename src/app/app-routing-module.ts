import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthComponent } from './pages/auth/auth-component/auth-component';
import { BaseComponents } from './mise-en-pages/base-components/base-components';
import { DashboardComponent } from './pages/dashboard-component/dashboard-component';
import { AuthGuard } from './coeur/garde-auth/auth.guard';
import { ListeVehiculeComponent } from './pages/transport/vehicule/liste-vehicule-component/liste-vehicule-component';

const routes: Routes = [

  { path: 'login', component: AuthComponent },
  // { path: 'vehicules', component: ListeVehiculeComponent },
  {
    path: '',
    component: BaseComponents,
    // canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      // Vehicule
      {
        path: 'vehicules',
        loadChildren: () =>
          import('./pages/transport/vehicule/vehicule-module').then(m => m.VehiculeModule)
      },

    ]
  },
  { path: '**', redirectTo: 'dashboard' }


  // { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  // { path: 'login', component: AuthComponent },
  // { path: 'dashboard', component: BaseComponents },

  // {
  //   path: '',
  //   component: BaseComponents,
  //   canActivate: [AuthGuard],
  //   children: [
  //     // Dashboard
  //     {
  //       path: 'dashboard',
  //       component: DashboardComponent,
  //       data: { roles: ['ADMIN', 'GERANT', 'USER', 'SELLER', 'MANAGER'] }
  //     },

  //     // // Users
  //     // { path: 'roles', component: RoleComponent, data: { roles: ['GERANT'] } },
  //     // { path: 'roles/nouveau', component: FormRoleComponent, data: { roles: ['GERANT'] } },
  //   ]
  // }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
