import { platformBrowser } from '@angular/platform-browser';
import { AppModule } from './app/app-module';
import '@iconify/iconify';

platformBrowser().bootstrapModule(AppModule, {
  
})
  .catch(err => console.error(err));
