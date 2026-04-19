import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TrajetRoutingModule } from './trajet-routing-module';
import { ListeTrajetCompent } from './liste-trajet-compent/liste-trajet-compent';
import { AjoutTrajetComponent } from './ajout-trajet-component/ajout-trajet-component';

@NgModule({
  declarations: [
    ListeTrajetCompent,
    AjoutTrajetComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    TrajetRoutingModule
  ]
})
export class TrajetModule {}
