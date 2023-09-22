
import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { Other } from '../../model/file.model';
import { Organization, OrganizationService } from '../../services/organization.service';
import { FieldsService, Field } from '../../services/fields.service';
import { EscoCompetenceService } from '../../services/esco-competence.service';
import { ActivatedRoute } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { User, UserService } from '../../services/user.service';
import { FormBuilder, Validators } from '@angular/forms';
import { AngularFireStorage } from '@angular/fire/storage';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { finalize } from 'rxjs/operators';
import * as bok from '@ucgis/find-in-bok-dataviz-tools';

import { BokService } from '../../services/bok.service';
import { LoginComponent } from '../login/login.component';
import { OtherService } from '../../services/other.service';
import { PDFDocument } from 'pdf-lib';

import * as pdfjs from 'pdfjs-dist/es5/build/pdf';
import { pdfjsworker } from 'pdfjs-dist/es5/build/pdf.worker.entry';

@Component({
  selector: 'app-newannotation',
  templateUrl: './newannotation.component.html',
  styleUrls: ['./newannotation.component.scss']
})
export class NewannotationComponent implements OnInit {

  _id: string;
  mode: string;
  title: string;

  model = new Other('', '', '', '', '', 'Other', 'Other', false, '', '', '', [], 3, null, null, '');

  userOrgs: Organization[] = [];
  saveOrg: Organization;
  currentUser: User;

  userDivisions: string[] = [];
  saveDiv = '';

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

  hasConcepts = true;

  observer: MutationObserver;
  lastBoKTitle = 'UCGIS';

  searchInputField = '';
  currentConcept = 'UCGIS';

  isShowingSkillsTip = false;
  uploadPercent1 = null;

  associatedSkillsToDelete = 0;

  @ViewChild('textInfo') textInfo: ElementRef;

  isAnonymous = true;
  type = -1;

  messageUploadFile = 'Upload a file to see annotated bok concepts';

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
    this.afAuth.auth.onAuthStateChanged(user => {
      if (user) {
        this.userService.getUserById(user.uid).subscribe(userDB => {
          this.currentUser = new User(userDB);
          this.isAnonymous = false;
          if (this.currentUser.organizations && this.currentUser.organizations.length > 0) {
            this.currentUser.organizations.forEach(orgId => {
              this.organizationService.getOrganizationById(orgId).subscribe(org => {
                if (org) {
                  this.userOrgs.push(org);
                  this.saveOrg = this.userOrgs[0];
                  this.loadDivisions();
                }
              });
            });
          }
        });
      }
    });
  }

  ngOnInit() {
    bok.visualizeBOKData('https://ucgis-bok-default-rtdb.firebaseio.com/', 'current');
    this.observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if ((<any>mutation.target).children[1].innerText !== this.lastBoKTitle) {
          this.lastBoKTitle = (<any>mutation.target).children[1].innerText;
          this.hasResults = false;
        }
      });
    });
    const config = { attributes: true, childList: true, characterData: true };
    this.observer.observe(this.textInfo.nativeElement, config);
    this.getMode();
  }

  getMode(): void {
    this.mode = this.route.snapshot.paramMap.get('mode');
    if (this.mode === 'duplicate' || this.mode === 'copy') {
      if (this.mode === 'copy') {
        this.title = 'Edit BoK Annotate';
      } else {
        this.title = 'Duplicate BoK Match';
      }
      this.getOtherById();
      this.fillForm();
    } else {
      this.title = 'BoK Annotation Tool';
    }
  }

  getOtherById(): void {
    this._id = this.route.snapshot.paramMap.get('name');
    this.otherService
      .getOtherById(this._id)
      .subscribe(abt => {
        this.model = abt;
      });
  }

  fillForm(): void {
    this.otherService
      .getOtherById(this._id)
      .subscribe(abt => (this.model = abt));
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
    this.navigateToConcept('UCGIS');
  }

  cleanTip() {
    this.isShowingSkillsTip = false;
  }

  addBokKnowledge() {
    this.associatedSkillsToDelete = 0;
    const concept = this.textInfo.nativeElement.getElementsByTagName('h4')[0]
      .textContent;
    if (!this.model.concepts.includes(concept)) {
      const codeConcept = concept.split(']')[0];
      if (this.model.concepts.indexOf(concept) === -1) {
        this.model.concepts.push(concept);
        this.associatedSkillsToDelete++;
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

  loadDivisions() {
    this.userDivisions = this.saveOrg.divisions ? this.saveOrg.divisions : [];
    this.saveDiv = this.model ? this.model.division ? this.model.division : '' : '';
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
    pdfjs.GlobalWorkerOptions.workerSrc = pdfjsworker;
    const filePath = 'other/custom-' + encodeURI(file.name);
    const task = this.storage.upload(filePath, file);
    this.errorFile1 = false;
    this.uploadPercent1 = task.percentageChanges();
    task.snapshotChanges().pipe(
      finalize(() => {
        this.messageUploadFile = 'Loading annotations';
        // take storage reference to download file
        const ref = this.storage.ref(filePath);
        ref.getDownloadURL().subscribe(url => {
          // get pdf document from url
          // pdfjs.getDocument(url).then(pdfDoc_ => {
          const loadingTask = pdfjs.getDocument(url);
          loadingTask.promise.then(pdfDoc_ => {
            const pdfDoc = pdfDoc_;
            // get metadata from pdf document
            pdfDoc.getMetadata().then(metadataObject => {
              this.meta1 = metadataObject;
              if (this.meta1.info['Title']) {
                this.model.title = this.meta1.info['Title'];
                this.model.name = this.meta1.info['Title'];
              } else if (this.model.title === '') {
                this.model.title = file.name;
                this.model.name = file.name;
              } else {
                this.model.name = this.model.title;
              }
              if (this.model.concepts.length > 0) {
                this.model.concepts = this.model.concepts.concat(this.getBokConceptsFromMeta(this.meta1));
              } else {
                this.model.concepts = this.getBokConceptsFromMeta(this.meta1);
              }
              this.model.url = url;
            }).catch(function (err) {
              console.log('Error getting meta data');
              console.log(err);
            });
            if (this.model.concepts.length === 0) {
              this.hasConcepts = false;
            }
          }).catch(function (err) {
            console.log('Error getting PDF from url');
            console.log(err);
          });
        });

      })
    )
      .subscribe();
    this.messageUploadFile = 'Upload a file to see annotated bok concepts';
  }


  removeConcepts(name: any, array: any[]) {
    array.forEach((item, index) => {
      if (item === name) {
        this.model.concepts.splice(index, 1);
        this.model.concepts = [...this.model.concepts];
      }
    });
    this.associatedSkillsToDelete = this.model.concepts.length;
  }

  saveAnnotation() {
    this.model.name = this.model.title;
    this.model.userId = this.currentUser._id;
    this.model.orgName = this.saveOrg.name;
    this.model.division = this.saveDiv;
    this.model.orgId = this.saveOrg._id;
    if (this.mode === 'copy') {
      this.otherService.updateOther(this._id, this.model);
    } else {
      this.otherService.addNewOther(this.model);
    }
  }

  openModal() {
    this.modalRef = this.modalService.show(LoginComponent, { class: 'modal-lg' });
  }

  getBokConceptsFromMeta(meta) {
    const concepts = [];
    // concepts are in Subject metadata
    if (meta && meta.info && meta.info.Subject) {
      const rdf = meta.info.Subject.split(' ');
      rdf.forEach(rdfEl => {
        const rel = rdfEl.split(':');
        // if it's a eo4geo concept save the code
        if (rel[0] === 'ucgis') {
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

  async downloadFile() {
    const existingPdfBytes = await fetch(this.model.url).then(res => res.arrayBuffer());
    // Load a PDFDocument from the existing PDF bytes
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const currentMetadata = pdfDoc.getSubject();
    if (currentMetadata !== undefined) {
      const type = this.readType(currentMetadata);
      const metadata = this.getSubjectMetadata(this.model);
      pdfDoc.setSubject(metadata);
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const urlToDownload = window.URL.createObjectURL(blob);
      let link = document.createElement('a');
      link.download = this.model.title;
      link.href = urlToDownload;
      link.click();
    } else {
      const metadata = this.getSubjectMetadata(this.model);
      pdfDoc.setSubject(metadata);
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const urlToDownload = window.URL.createObjectURL(blob);
      let link = document.createElement('a');
      link.download = this.model.title;
      link.href = urlToDownload;
      link.click();
    }
  }

  getSubjectMetadata(selectedFile: Other) {

    let subject = '@prefix dc: <http://purl.org/dc/terms/> . @prefix ucgis: <https://gistbok-topics.ucgis.org/> . ';
    subject = subject + '<> dc:title "' + selectedFile.title + '"';
    selectedFile.concepts.forEach(know => {
      const bokCode = know.split(']', 1)[0].split('[', 2)[1];
      if (bokCode) {
        subject = subject + '; dc:relation ucgis:' + bokCode;
      }
    });
    subject = subject + ' .';
    return subject;
  }

  readType(currentMetadata: any) {
    let type = '';
    if (currentMetadata.length > 0) {
      const rdf = currentMetadata.split(' . ');

      rdf.forEach(rdfEl => {
        const rel = rdfEl.split(';');
        if (rel.length > 1) {
          const dctype = rdfEl.split(':');
          dctype.forEach(ty => {
            if (ty.indexOf('type') > -1) {
              type = ty.split('"').length > 1 ? ty.split('"')[1] : '';
            }
          });
        }
      });
    }
    return type;
  }

}
