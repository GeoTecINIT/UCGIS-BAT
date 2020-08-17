
import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { Other} from '../../model/file.model';
import { Organization, OrganizationService } from '../../services/organization.service';
import { FieldsService, Field } from '../../services/fields.service';
import { EscoCompetenceService } from '../../services/esco-competence.service';
import { ActivatedRoute } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { User, UserService } from '../../services/user.service';
import { FormBuilder, Validators } from '@angular/forms';
import { AngularFireStorage } from '@angular/fire/storage';
import { BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import { finalize } from 'rxjs/operators';
import * as bok from '@eo4geo/bok-dataviz';
import * as jsPDF from 'jspdf';

// import * as fs from 'fs';
// import * as parsePdf from 'parse-pdf';

// const fs = require('fs');
// const parsePdf = require('parse-pdf');

// import * as jspdf from 'parse-pdf';

import * as pdfjs from 'pdfjs-dist';
import { BokService } from '../../services/bok.service';
import {LoginComponent} from '../login/login.component';
import { OtherService} from '../../services/other.service';

@Component({
  selector: 'app-newannotation',
  templateUrl: './newannotation.component.html',
  styleUrls: ['./newannotation.component.scss']
})
export class NewannotationComponent implements OnInit {

  _id: string;
  mode: string;
  title: string;
  allConcepts = [];

  model = new Other('', '', '', '' , '', 'Other', 'Other', true, '', '', '', [], 3, null, null);

  userOrgs: Organization[] = [];
  saveOrg: Organization;
  currentUser: User;

  file1 = null;
  errorFile1 = false;
  filteredResources1 = [];
  filteredResources2 = [];

  modalRef: BsModalRef;

  selectedNodes = [];
  hasResults = false;
  limitSearchFrom = 0;
  limitSearchTo = 10;

  meta1 = null;

  closeResult = '';

  observer: MutationObserver;
  lastBoKTitle = 'GIST';

  searchInputField = '';
  currentConcept = 'GIST';

  isShowingSkillsTip = false;
  uploadPercent1 = null;

  associatedSkillsToDelete = 0;

  @ViewChild('textBoK') textBoK: ElementRef;

  isAnonymous = true;
  type = -1;


  formGroup = this.fb.group({
    file: [null, Validators.required]
  });

  public LIMIT_PER_PAGE = 6;
  public paginationLimitFrom1 = 0;
  public paginationLimitFrom2 = 0;
  public paginationLimitTo1 = this.LIMIT_PER_PAGE;
  public paginationLimitTo2 = this.LIMIT_PER_PAGE;
  public currentPage1 = 0;
  public currentPage2 = 0;
  public collectionOT = 'Other';

  constructor(
    private organizationService: OrganizationService,
    private userService: UserService,
    public fieldsService: FieldsService,
    public escoService: EscoCompetenceService,
    private route: ActivatedRoute,
    private otherService: OtherService,
    private afAuth: AngularFireAuth,
    private fb: FormBuilder,
    // private cd: ChangeDetectorRef,
    private storage: AngularFireStorage,
    public bokService: BokService,
    private modalService: BsModalService
  ) {
    this.isAnonymous = false;
    this.afAuth.auth.onAuthStateChanged(user => {
      if (user) {
        this.userService.getUserById(user.uid).subscribe(userDB => {
          this.currentUser = new User(userDB);
          if (this.currentUser.organizations && this.currentUser.organizations.length > 0) {
            this.currentUser.organizations.forEach(orgId => {
              this.organizationService.getOrganizationById(orgId).subscribe(org => {
                if (org) {
                  this.userOrgs.push(org);
                  this.saveOrg = this.userOrgs[0];
                  this.isAnonymous = true;
                }
              });
            });
          }
        });
      }
    });
  }

  ngOnInit() {
    bok.visualizeBOKData('#bubbles', '#textBoK');
    this.getMode();
  }

  getMode(): void {
    this.mode = this.route.snapshot.paramMap.get('mode');
    if (this.mode === 'duplicate' || this.mode === 'copy') {
      if (this.mode === 'copy') {
        this.title = 'Copy BoK Match';
      } else {
        this.title = 'Duplicate BoK Match';

      }
    } else {
      this.title = 'Annotate with BoK Tool';
    }
  }

  searchInBok(text: string) {
    if (text === '' || text === ' ') {
      this.cleanResults();
    } else {
      this.selectedNodes = bok.searchInBoK(text);
      this.hasResults = true;
      this.currentConcept = '';
      this.cleanTip();
      this.limitSearchFrom = 0;
      this.limitSearchTo = 10;
    }
  }

  navigateToConcept(conceptName) {
    bok.browseToConcept(conceptName);
    this.currentConcept = conceptName;
    this.hasResults = false;
    this.cleanTip();
  }

  cleanResults() {
    this.searchInputField = '';
    bok.searchInBoK('');
    this.navigateToConcept('GIST');
  }

  cleanTip() {
    this.isShowingSkillsTip = false;
  }

  addBokKnowledge() {
    const concept = this.textBoK.nativeElement.getElementsByTagName('h4')[0]
      .textContent;
    if (!this.model.concepts.includes(concept)) {
      const codeConcept = concept.split(']')[0];
      if ( this.allConcepts.indexOf(concept) === -1) {
        this.allConcepts.push(concept);
        this.model.concepts.push(codeConcept + ']');
      }
    }
    this.isShowingSkillsTip = true;
  }

  incrementLimit() {
    this.limitSearchTo = this.limitSearchTo + 10;
    this.limitSearchFrom = this.limitSearchFrom + 10;
  }

  decrementLimit() {
    this.limitSearchTo = this.limitSearchTo - 10;
    this.limitSearchFrom = this.limitSearchFrom - 10;
  }

  onFileChange1(event) {
    this.filteredResources1 = [];
    const reader = new FileReader();
    if (event.target.files && event.target.files.length) {
      [this.file1] = event.target.files;
      this.uploadFile1(this.file1);
      reader.readAsDataURL(this.file1);
      reader.onload = () => {
        this.formGroup.patchValue({
          file: reader.result
        });
      };
    }
  }

  uploadFile1(file) {
    const filePath = 'other/custom-' + encodeURI(file.name);
    const task = this.storage.upload(filePath, file);
    this.errorFile1 = false;
    this.uploadPercent1 = task.percentageChanges();
    task.snapshotChanges().pipe(
      finalize(() => {
        // take storage reference to download file
        const ref = this.storage.ref(filePath);
        ref.getDownloadURL().subscribe(url => {
          // get pdf document from url
          pdfjs.getDocument(url).then(pdfDoc_ => {
            const pdfDoc = pdfDoc_;
            // get metadata from pdf document
            pdfDoc.getMetadata().then(metadataObject => {
              this.meta1 = metadataObject;
              this.model.title = this.meta1.info['Title'];
              this.model.concepts = this.getBokCodeConceptsFromMeta(this.meta1);
              this.allConcepts = this.getBokConceptsFromMeta(this.meta1);
              this.model.url = url;
              this.model.name = this.meta1.info['Title'];
              this.model.userId = this.currentUser._id;
              this.model.orgName = this.saveOrg.name;
              this.model.orgId = this.saveOrg._id;
            }).catch(function (err) {
              console.log('Error getting meta data');
              console.log(err);
            });
          }).catch(function (err) {
            console.log('Error getting PDF from url');
            console.log(err);
          });
        });
      })
    )
      .subscribe();
  }

  /**
   * TO DO
   * @param name
   * @param array
   */
  removeConcepts(name: any, array: any[]) {

  }

  saveAnnotation() {
    this.otherService.addNewOther(this.model);
  }

  openModal() {
    this.modalRef = this.modalService.show(LoginComponent, {class: 'modal-lg'});
  }

  getBokConceptsFromMeta(meta) {
    const concepts = [];
    // concepts are in Subject metadata
    if (meta && meta.info && meta.info.Subject) {
      const rdf = meta.info.Subject.split(' ');
      rdf.forEach(rdfEl => {
        const rel = rdfEl.split(':');
        // if it's a eo4geo concept save the code
        if (rel[0] === 'eo4geo') {
          if (rel[1] !== '') {
            if (rel[1].endsWith(';')) {
              const code = rel[1].slice(0, -1);
              const nameConcept = this.bokService.getConceptInfoByCode(code);
              concepts.push('[' + code + '] ' + nameConcept.name);
            } else {
              const code = rel[1];
              const nameConcept = this.bokService.getConceptInfoByCode(code);
              concepts.push('[' + code + '] ' + nameConcept.name);
            }
          }
        }
      });
    }
    return concepts;
  }

  getBokCodeConceptsFromMeta(meta) {
    const concepts = [];
    // concepts are in Subject metadata
    if (meta && meta.info && meta.info.Subject) {
      const rdf = meta.info.Subject.split(' ');
      rdf.forEach(rdfEl => {
        const rel = rdfEl.split(':');
        // if it's a eo4geo concept save the code
        if (rel[0] === 'eo4geo') {
          if (rel[1] !== '') {
            if (rel[1].endsWith(';')) {
              concepts.push('[' + rel[1].slice(0, -1) + ']');
            } else {
              concepts.push('[' + rel[1] + ']');
            }
          }
        }
      });
    }
    return concepts;
  }
}
