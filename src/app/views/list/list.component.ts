import { Component, OnInit, OnDestroy, Input, ViewChild } from '@angular/core';
import { NgForOf } from '@angular/common';
import { Observable, Subscription } from 'rxjs';
import { FormControl } from '@angular/forms';
import { Other } from '../../model/file.model';
import { ModalDirective, ModalOptions } from 'ngx-bootstrap/modal';
import { AngularFireAuth } from '@angular/fire/auth';
import { User, UserService } from '../../services/user.service';
import { OrganizationService } from '../../services/organization.service';
import { OtherService } from '../../services/other.service';
import { ActivatedRoute } from '@angular/router';
import { AngularFireStorage } from '@angular/fire/storage';
import {HttpHeaders, HttpClient} from '@angular/common/http';
import {PDFDocument} from 'pdf-lib';
import { download } from 'downloadjs';
import {finalize} from 'rxjs/operators';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit {
  annotations: Other[];
  advancedSearch = false;
  filteredAnnotations: any[];
  searchText: string;
  knowledgeFilter: Boolean = true;
  isAnonymous = null;
  currentUser: User = new User();
  pdfFile = PDFDocument;
  @ViewChild('dangerModal') public dangerModal: ModalDirective;
  @ViewChild('releaseNotesModal') public releaseNotesModal: any;


  constructor(
    private userService: UserService,
    public organizationService: OrganizationService,
    private otherService: OtherService,
    private route: ActivatedRoute,
    private storage: AngularFireStorage,
    private http: HttpClient,
    public afAuth: AngularFireAuth) {
    this.afAuth.auth.onAuthStateChanged(user => {
      if (user) {
        this.isAnonymous = user.isAnonymous;
        this.userService.getUserById(user.uid).subscribe(userDB => {
          this.currentUser = new User(userDB);
          this.otherService
            .subscribeToOther()
            .subscribe(matches => {
              this.annotations = [];
              matches.forEach(ma => {
                if (ma.userId === this.currentUser._id ) {
                  this.annotations.push(ma);
                }
              });
              // Sort by date
              this.annotations.sort((a, b) => (a.updatedAt > b.updatedAt) ? 1 : -1);
              this.filteredAnnotations = this.annotations;
            });
        });
      } else {
        this.isAnonymous = true;
      }
    });
  }

  ngOnInit() {
       if (this.route.snapshot.url[0].path === 'release-notes') {
        const config: ModalOptions = { backdrop: true, keyboard: true };
        this.releaseNotesModal.basicModal.config = config;
        this.releaseNotesModal.basicModal.show({});
      }
  }

  removeFile(id: string) {
    this.otherService.removeOther(id);
  }

  filter() {
    const search = this.searchText.toLowerCase();
    this.filteredAnnotations = [];
    this.filteredAnnotations = this.annotations.filter(
      it =>
        it.title.toLowerCase().includes(search) ||
        it.description.toLowerCase().includes(search) ||
        it.orgName.toLowerCase().includes(search) ||
        it.division.toLowerCase().includes(search)
    );
  }

  async downloadFile(url: string, selectedFile: Other) {
    const existingPdfBytes = await fetch(url).then(res => res.arrayBuffer());
    // Load a PDFDocument from the existing PDF bytes
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const metadata = this.getSubjectMetadata(selectedFile);
    pdfDoc.setSubject(metadata);
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const urlToDownload = window.URL.createObjectURL(blob);
    let link = document.createElement('a');
      link.download = selectedFile.title;
      link.href = urlToDownload;
      link.click();
  }


  getSubjectMetadata(selectedFile: Other) {

    let subject = '@prefix dc: <http://purl.org/dc/terms/> . @prefix eo4geo: <http://bok.eo4geo.eu/> . ';
      subject = subject + '<> dc:title "' + selectedFile.title + '"';
    selectedFile.concepts.forEach(know => {
        const bokCode = know.split(']', 1)[0].split('[', 2)[1];
        if (bokCode) {
          subject = subject + '; dc:relation eo4geo:' + bokCode;
        }
      });
    subject = subject + ' .';
    return subject;
  }
}
