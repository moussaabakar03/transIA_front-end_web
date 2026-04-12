import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListeVehiculeComponent } from './liste-vehicule-component/liste-vehicule-component';
import { AjoutVehiculeComponent } from './ajout-vehicule-component/ajout-vehicule-component';


const routes: Routes = [
  { path: 'liste', component: ListeVehiculeComponent },
  { path: 'ajout',   component: AjoutVehiculeComponent }
  // { path: 'sortie/:stockId',   component: StockSortieComponent, canActivate: [AuthGuard] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VehiculeRoutingModule {}
