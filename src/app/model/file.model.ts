import { Field } from '../services/fields.service';
import { Language } from '../services/language.service';

export class Other extends Object {
  constructor(
    public _id: string,
    public url: string,
    public userId: string,
    public orgId: string,
    public orgName: string,
    public collection: string,
    public collectionDisplay: string,
    public isPublic: boolean = false,
    public name: string,
    public title: string,
    public description: string,
    public concepts: any[],
    public type: number,
    public updatedAt: any,
    public createdAt: any
  ) {
    super();
  }
}

