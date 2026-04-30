import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListeReservationComponent } from './liste-reservation-component/liste-reservation-component';
import { AjoutReservationComponent } from './ajout-reservation-component/ajout-reservation-component';
import { AuthGuard } from '../../coeur/garde-auth/auth.guard';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'liste' },
  { path: 'liste', component: ListeReservationComponent, canActivate: [AuthGuard] },
  { path: 'ajout', component: AjoutReservationComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: 'liste' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReservationRoutingModule { }
