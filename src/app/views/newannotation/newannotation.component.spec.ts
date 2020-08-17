import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewannotationComponent } from './newannotation.component';

describe('NewannotationComponent', () => {
  let component: NewannotationComponent;
  let fixture: ComponentFixture<NewannotationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewannotationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewannotationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
