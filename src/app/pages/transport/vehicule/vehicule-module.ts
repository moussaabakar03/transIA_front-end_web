import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { VehiculeRoutingModule } from './vehicule-routing-module';
import { AjoutVehiculeComponent } from './ajout-vehicule-component/ajout-vehicule-component';
import { ListeVehiculeComponent } from './liste-vehicule-component/liste-vehicule-component';

@NgModule({
  declarations: [
    AjoutVehiculeComponent,
    ListeVehiculeComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    VehiculeRoutingModule
  ]
})
export class VehiculeModule {}
