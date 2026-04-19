import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AjoutTrajetComponent } from './ajout-trajet-component';

describe('AjoutTrajetComponent', () => {
  let component: AjoutTrajetComponent;
  let fixture: ComponentFixture<AjoutTrajetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AjoutTrajetComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AjoutTrajetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
