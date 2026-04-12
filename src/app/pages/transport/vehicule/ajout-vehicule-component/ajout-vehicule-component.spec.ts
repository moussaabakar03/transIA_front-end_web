import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AjoutVehiculeComponent } from './ajout-vehicule-component';

describe('AjoutVehiculeComponent', () => {
  let component: AjoutVehiculeComponent;
  let fixture: ComponentFixture<AjoutVehiculeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AjoutVehiculeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AjoutVehiculeComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
