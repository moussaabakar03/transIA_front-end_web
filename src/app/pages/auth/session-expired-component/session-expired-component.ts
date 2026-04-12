import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-session-expired-component',
  standalone: false,
  templateUrl: './session-expired-component.html',
  styleUrl: './session-expired-component.scss',
})
export class SessionExpiredComponent {
  constructor(private router: Router) {}

  ngOnInit(): void {
    let count = 5;
    const countElement = document.getElementById('redirectCount');

    const interval = setInterval(() => {
      count--;
      if (countElement) {
        countElement.textContent = count.toString();
      }

      if (count <= 0) {
        clearInterval(interval);
        this.router.navigate(['/login']);
      }
    }, 1000);
  }

}
