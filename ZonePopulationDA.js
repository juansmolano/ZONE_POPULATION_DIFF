"use strict";

const MongoDB = require('./MongoDB').MongoDB;
let mongoDbInstance = new MongoDB({ url: "mongodb://localhost:27017", dbName: "logistic-operator-config" });
let getCollection = (name) => { };
const { of, Observable, defer, from } = require("rxjs");
const { mergeMap, map, reduce, } = require("rxjs/operators");

const { CustomError } = require("@nebulae/backend-node-tools").error;

const CollectionName = 'Course';

class CourseDA {

  /**
   * @returns {Observable}
   */
  static start$() {
    return mongoDbInstance.start$().pipe(
      mergeMap(() => Observable.create(observer => {
        getCollection = (name) => {
          return new Promise(function (resolve, reject) {
            resolve(mongoDbInstance.db.collection(name));
          });
        };    
        observer.next(`${this.name} started`);
        observer.complete();
      }))
    )
  }

  /**
   * @returns {Observable}
   */
  static getZones$() {
    const query = {};
    return defer(() => getCollection('LogisticOperator')).pipe(
      mergeMap(collection => collection.findOne(query)),
      map(({ zones }) => zones),
      mergeMap(zones => from(zones)),
      reduce((acc, zone) => {
        let { zoneId, name, code } = zone;
        name = name.trim();
        code = code.trim();
        acc[zoneId] = { zoneId, name, code };
        return acc;
      }, {})
    );
  }

  /**
  * @returns {Observable}
  */
  static getPopulations$() {
    return defer(() => getCollection('ZonePopulation')).pipe(
      map(collection => collection.find({
        "distributionCenterId": "8bc6243d-e062-4c52-a55a-04f41560125c" //TODO: esto solo es CEDI MEDELLIN.  eliminar para leer todos los CEDIS
      }).sort({ code: 1 })),
      mergeMap(cursor => mongoDbInstance.extractAllFromMongoCursor$(cursor))
    )
  }

  /**
   * @returns {Observable}
   */
  static getGeneratorMap$() {
    return defer(() => getCollection('Generator')).pipe(
      map(collection => collection.find({})),
      mergeMap(cursor => mongoDbInstance.extractAllFromMongoCursor$(cursor)),
      reduce((acc, generator) => {
        let { _id, name } = generator;
        name = name.trim();
        acc[_id] = name;
        return acc;
      }, {})

    );
  }

  /**
 * @returns {Observable}
 */
  static getGeneratorMap_name_id$() {
    return defer(() => getCollection('Generator')).pipe(
      map(collection => collection.find({})),
      mergeMap(cursor => mongoDbInstance.extractAllFromMongoCursor$(cursor)),
      reduce((acc, generator) => {
        let { _id, name } = generator;
        name = name.trim();
        acc[name] = _id;
        return acc;
      }, {})
    )
  }

  /**
   * @returns {Observable}
   */
  static getCEDIsMap_name_id$() {
    return defer(() => getCollection('DistributionCenter')).pipe(
      map(collection => collection.find({})),
      mergeMap(cursor => mongoDbInstance.extractAllFromMongoCursor$(cursor)),
      reduce((acc, dc) => {
        const { _id, generalInfo } = dc;
        generalInfo.name = generalInfo.name.trim();
        //acc[_id] = generalInfo.name;
        acc[generalInfo.name] = _id;
        return acc;
      }, {})
    )
  }

  /**
  * @returns {Observable}
  */
  static getCEDIsMap_id_name$() {
    return defer(() => getCollection('DistributionCenter')).pipe(
      map(collection => collection.find({})),
      mergeMap(cursor => mongoDbInstance.extractAllFromMongoCursor$(cursor)),
      reduce((acc, dc) => {
        const { _id, generalInfo } = dc;
        generalInfo.name = generalInfo.name.trim();
        acc[_id] = generalInfo.name;
        //acc[generalInfo.name] = _id;
        return acc;
      }, {})
    )
  }


}
/**
 * @returns {CourseDA}
 */
module.exports = CourseDA;
