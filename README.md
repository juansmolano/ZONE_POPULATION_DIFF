# ZONE_POPULATION_DIFF

Before use do an
``` npm i ```

## Update input File:
1. rename excel filet to input.xlsx
2. replace the file in this project
3. run ``` node ZonePopulationFileImporter.js ```

## Run diff checker:
``` node server.js ```

## Changing Distribution Center
change or remove filter at ZonePopulationDA.js

```
static getPopulations$() {
    return defer(() => getCollection('ZonePopulation')).pipe(
      map(collection => collection.find({
        "distributionCenterId": "8bc6243d-e062-4c52-a55a-04f41560125c" //TODO: esto solo es CEDI MEDELLIN.  eliminar para leer todos los CEDIS
      }).sort({ code: 1 })),
      mergeMap(cursor => mongoDbInstance.extractAllFromMongoCursor$(cursor))
    )
  }
  ```