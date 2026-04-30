import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AjoutReservationComponent } from './ajout-reservation-component/ajout-reservation-component';
import { ReservationRoutingModule } from './reservation-routing-module';
import { ListeReservationComponent } from './liste-reservation-component/liste-reservation-component';

@NgModule({
  declarations: [
    ListeReservationComponent,
    AjoutReservationComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReservationRoutingModule
  ]
})
export class ReservationModule { }
