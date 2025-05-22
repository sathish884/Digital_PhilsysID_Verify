import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { AppRoutingModule } from './app-routing.module';
import { AuthenticateComponent } from './authenticate/authenticate.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';

@NgModule({
    declarations: [AuthenticateComponent, AppComponent],
    imports: [
        BrowserModule,
        AppRoutingModule,
        FormsModule, ReactiveFormsModule,
        RouterModule,
        HttpClientModule,
        BsDatepickerModule.forRoot(),
        BrowserAnimationsModule
    ],

    providers: [DatePipe],

    bootstrap: [AppComponent]
})
export class AppModule {
}
