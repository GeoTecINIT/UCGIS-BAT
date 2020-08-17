import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Other } from '../model/file.model';
import * as firebase from 'firebase';

const collection = 'Other';

@Injectable({
  providedIn: 'root'
})

export class OtherService {
  private db: AngularFirestore;
  constructor(db: AngularFirestore) {
    this.db = db;
  }

  subscribeToOther(): Observable<Other[]> {
    return this.db.collection<Other>(collection).valueChanges();
  }

  addNewOther(newFile: Other) {
    const id = this.db.createId();
    newFile._id = id;
    const timestamp = firebase.firestore.FieldValue.serverTimestamp();
    newFile.updatedAt = timestamp;
    newFile.createdAt = timestamp;
    this.db
      .collection(collection)
      .doc(id)
      .set(newFile);
  }

  removeOther(otherId) {
    this.db
      .collection(collection)
      .doc(otherId)
      .delete();
  }

  getOtherById(annotationId: string): Observable<Other> {
    return this.db
      .collection(collection)
      .doc<Other>(annotationId)
      .valueChanges();
  }

  updateOther(annotationId: string, updatedAnnotation: Other) {
    const timestamp = firebase.firestore.FieldValue.serverTimestamp();
    updatedAnnotation.updatedAt = timestamp;
    this.db
      .collection(collection)
      .doc<Other>(annotationId)
      .update(updatedAnnotation);
  }
}
