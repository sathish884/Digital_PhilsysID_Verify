import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VerifyService {



  constructor(public http: HttpClient, private apiService: ApiService) { }

  idverify(body: any): Observable<any> {
    const headersRequest = new HttpHeaders({
      'content-type': 'application/json', Authorization: 'Bearer '
    });
    // let authURL ="https://api.apps-external.uat2.phylsys.gov.ph/PSA_VERIFY_SERVICE/verifyData"  // this.apiService.apiBaseUrl + 'verifyData';
    let authURL = "https://pdms-lb-1935476243.ap-southeast-1.elb.amazonaws.com/PSA_VERIFY_SERVICE/verifyData"
    return this.http.post<any>(authURL, body, { headers: headersRequest });
  }

}
