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
    public bokService: BokService,
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
    setTimeout(() => {
          this.isReady = true;
      }, 3000);
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
    const concept = {url : '', name: ''};
    let cleanCode = code.split(']')[0];
      cleanCode = cleanCode.split('[')[1];

    const info = this.bokService.getConceptInfoByCode(cleanCode);
      concept.url = info.permalink;
      concept.name = info.name;
    return concept;
  }
  removeFile(id: string) {
      this.otherService.removeOther(id);
  }
}
