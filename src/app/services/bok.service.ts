import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface BoKConcept {
  permalink?: String;
  descrption?: String;
  name?: String;
  code?: String;
}

@Injectable({
  providedIn: 'root'
})
export class BokService {
  public concepts: any[];
  public relations: any[];
  public allRelation: Observable<any>;
  public allConcepts: Observable<any>;
  BOK_PERMALINK_PREFIX = 'https://bok.eo4geo.eu/';
  private URL_BASE = 'https://findinbok.firebaseio.com/';

  constructor(db: AngularFireDatabase, private http: HttpClient) {

    this.http.get(this.URL_BASE + '.json')
      .subscribe(data => {
        this.concepts = this.parseConcepts(data['current']['concepts']);
        this.relations = data['current']['relations'];
      });
/*
    db.list('current/concepts').valueChanges().subscribe(res => {
      this.concepts = this.parseConcepts(res);
    });
    db.list('current/relations').valueChanges().subscribe(res => {
      this.relations = res;
    });*/
  }

  parseConcepts(dbRes) {
    let concepts = [];
    if (dbRes && dbRes.length > 0) {
      dbRes.forEach(concept => {
        const c = {
          code: concept.code,
          name: concept.name,
          description: concept.description,
          permalink: this.BOK_PERMALINK_PREFIX + concept.code
        };
        concepts.push(c);
      });
    }
    return concepts;
  }

  getConceptInfoByCode(code) {
    const arrayRes = this.concepts.filter(
      it =>
        it.code.toLowerCase() === code.toLowerCase()
    );
    if (arrayRes.length > 0) {
      return arrayRes[0];
    } else {
      return {
        code: '',
        name: '',
        description: '',
        permalink: this.BOK_PERMALINK_PREFIX
      };
    }
  }

  getConcepts () {
    return this.concepts;
  }
  getRelations () {
    return this.relations;
  }
  getRelationsPrent( res, concepts ) {
    const relations = [];
    concepts.forEach( con => {
      const c = {
        code: con.code,
        name: con.name,
        description: con.description,
        children: [],
        parent: []
      };
      relations.push(c);
    });
    res.forEach( rel => {
     if ( rel.name === 'is subconcept of') {
        relations[rel.target].children.push( relations[rel.source]);
        relations[rel.source].parent = relations[rel.target];
      }
    });
    return relations;
  }

}

