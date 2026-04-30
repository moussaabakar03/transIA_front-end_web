import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AjoutReservationComponent } from './ajout-reservation-component';

describe('AjoutReservationComponent', () => {
  let component: AjoutReservationComponent;
  let fixture: ComponentFixture<AjoutReservationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AjoutReservationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AjoutReservationComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
