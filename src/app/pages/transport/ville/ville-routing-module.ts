import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListeVilleComponent } from './liste-ville-component/liste-ville-component';
import { AjoutVilleComponent } from './ajout-ville-component/ajout-ville-component';
import { AuthGuard } from '../../../coeur/garde-auth/auth.guard';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'liste' },
  { path: 'liste', component: ListeVilleComponent, canActivate: [AuthGuard] },
  { path: 'ajout', component: AjoutVilleComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: 'liste' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VilleRoutingModule { }
