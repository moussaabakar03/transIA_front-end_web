import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListeTrajetCompent } from './liste-trajet-compent/liste-trajet-compent';
import { AuthGuard } from '../../../coeur/garde-auth/auth.guard';
import { AjoutTrajetComponent } from './ajout-trajet-component/ajout-trajet-component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'liste' },
  { path: 'liste', component: ListeTrajetCompent, canActivate: [AuthGuard] },
  { path: 'ajout', component: AjoutTrajetComponent, canActivate: [AuthGuard], data: { roles: ['ADMIN', 'AGENT_ACCUEIL'] } },
  { path: '**', redirectTo: 'liste' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TrajetRoutingModule {}
