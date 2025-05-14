import { Injectable } from '@angular/core';
import { environment } from '../../../environment/environment'

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  apiBaseUrl: string = "";

  constructor() {
    this.apiBaseUrl = environment.apiBaseURL
  }
}
