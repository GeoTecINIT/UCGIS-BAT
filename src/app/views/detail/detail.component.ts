import {Component, OnInit, ViewChild} from '@angular/core';
import { Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { AngularFireAuth } from '@angular/fire/auth';
import { UserService, User } from '../../services/user.service';
import { AngularFireStorage } from '@angular/fire/storage';
import {BokService} from '../../services/bok.service';
import {OtherService} from '../../services/other.service';
import {Other} from '../../model/file.model';
import {PDFDocument} from 'pdf-lib';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements OnInit {

  statistics = [];
  isAnonymous = null;

  selectedFile: Other;
  currentUser: User = new User();

    isReady = false;

  @ViewChild('dangerModal') public dangerModal: ModalDirective;
  constructor(
    private otherService: OtherService,
    private userService: UserService,
    private route: ActivatedRoute,
    public afAuth: AngularFireAuth,
  ) {
    this.afAuth.auth.onAuthStateChanged(user => {
      if (user) {
        this.isAnonymous = user.isAnonymous;
        this.userService.getUserById(user.uid).subscribe(userDB => {
          this.currentUser = new User(userDB);
        });
      } else {
        this.isAnonymous = true;
      }
    });
  }

  ngOnInit() {
    this.getFileId();
  }
  getFileId(): void {
    const _id = this.route.snapshot.paramMap.get('name');
     this.otherService
      .getOtherById(_id)
      .subscribe(profile => {
        this.selectedFile = profile;
      });
  }

  getInfoFromBok(code: any ) {
    let cleanCode = code.split(']')[0];
      cleanCode = cleanCode.split('[')[1];

    const info = 'https://gistbok-topics.ucgis.org/' + cleanCode;
    return info;
  }

  removeFile(id: string) {
      this.otherService.removeOther(id);
  }

  async downloadFile(url: string, selectedFile: Other) {
      const existingPdfBytes = await fetch(url).then(res => res.arrayBuffer());
      // Load a PDFDocument from the existing PDF bytes
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const currentMetadata = pdfDoc.getSubject();
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

}
