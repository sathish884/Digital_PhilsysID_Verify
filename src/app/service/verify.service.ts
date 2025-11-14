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
     let authURL = "https://tsp-tspas-lb-819739355.ap-southeast-1.elb.amazonaws.com/PSA_VERIFY_SERVICE/verifyData"
    //  let authURL = "http://219.91.197.246:8000/digital-philsys-id-verify/verifyData"
  //  let authURL = "http://219.91.197.246:8000/PSA_VERIFY_SERVICE/verifyData"
    return this.http.post<any>(authURL, body, { headers: headersRequest });
  }

}
