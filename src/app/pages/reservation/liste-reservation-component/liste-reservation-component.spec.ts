import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListeReservationComponent } from './liste-reservation-component';

describe('ListeReservationComponent', () => {
  let component: ListeReservationComponent;
  let fixture: ComponentFixture<ListeReservationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ListeReservationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListeReservationComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
