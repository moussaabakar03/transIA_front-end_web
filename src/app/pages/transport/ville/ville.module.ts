import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ListeVilleComponent } from './liste-ville-component/liste-ville-component';
import { VilleRoutingModule } from './ville-routing-module';
import { AjoutVilleComponent } from './ajout-ville-component/ajout-ville-component';

@NgModule({
  declarations: [
    ListeVilleComponent,
    AjoutVilleComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    VilleRoutingModule
  ]
})
export class VilleModule { }
