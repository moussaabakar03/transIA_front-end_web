import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListeVehiculeComponent } from './liste-vehicule-component/liste-vehicule-component';
import { AjoutVehiculeComponent } from './ajout-vehicule-component/ajout-vehicule-component';
import { AuthGuard } from '../../../coeur/garde-auth/auth.guard';


const routes: Routes = [
  { path: 'liste', component: ListeVehiculeComponent, canActivate: [AuthGuard] },
  { path: 'ajout',   component: AjoutVehiculeComponent, canActivate: [AuthGuard] }
  // { path: 'sortie/:stockId',   component: StockSortieComponent, canActivate: [AuthGuard] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VehiculeRoutingModule {}
