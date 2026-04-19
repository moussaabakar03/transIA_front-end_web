import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListeTrajetCompent } from './liste-trajet-compent';

describe('ListeTrajetCompent', () => {
  let component: ListeTrajetCompent;
  let fixture: ComponentFixture<ListeTrajetCompent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ListeTrajetCompent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListeTrajetCompent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
