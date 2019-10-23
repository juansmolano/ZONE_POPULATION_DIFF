const loadJsonFile = require('load-json-file');
const { forkJoin, of, from, defer } = require("rxjs");
const { map, mergeMap, reduce, tap, take } = require("rxjs/operators");
const ZonePopulationDA = require('./ZonePopulationDA');

const generatorIdNameMap = {

}


ZonePopulationDA.start$().pipe(
    take(1),
    mergeMap(() => forkJoin(
        generateMapFromDB$,
        generateMapFromFile$
    )),

    tap( ([dbMap, fileMap]) => {
        console.log('%%%%%%%%%%%%')
        console.log(dbMap['010007, MEDELLIN , 1, MEDELLIN, MARKETING'])
        console.log('%%%%%%%%%%%%')
        console.log(Object.keys(dbMap).join('\n'));
        console.log('%%%%%%%%%%%%')
        console.log('%%%%%%%%%%%%')
        console.log(Object.keys(fileMap).join('\n'));
        console.log('%%%%%%%%%%%%')
    }),

    tap( ([dbMap, fileMap]) => {
        const notFoundList = Object.keys(dbMap).filter(dbKey => !fileMap[dbKey]);
        console.log('\n\n\n','=== Data from DB but not found on File: ',notFoundList.length,' ===\nzoneCode, zoneName, popCode, popName, generatorName\n',notFoundList.join('\n'));
    }),
    tap( ([dbMap, fileMap]) => {
        const notFoundList = Object.keys(fileMap).filter(dbKey => !dbMap[dbKey]);
        console.log('\n\n\n','=== Data from FILE but not found on DB: ',notFoundList.length,' ===\nzoneCode, zoneName, popCode, popName, generatorName\n',notFoundList.join('\n'));
    })

).subscribe(
    evt => {
        //console.log(evt)
    },
    error => console.error(error),
    () => console.log('COMPLETED!!!'),
)


const generateMapFromDB$ = forkJoin(
    ZonePopulationDA.getZones$(),
    ZonePopulationDA.getGeneratorMap$(),
    ZonePopulationDA.getCEDIsMap_id_name$(),
).pipe(
    mergeMap(([zonesMap, generatorsMap, cedisMap, inputZonePopulationMap]) => ZonePopulationDA.getPopulations$().pipe(
        map(population => ({
            generatorId: population.generatorId.trim(),
            generatorName: generatorsMap[population.generatorId].trim(),
            zoneId: population.zoneId.trim(),
            zoneName: zonesMap[population.zoneId].name.trim(),
            zoneCode: zonesMap[population.zoneId].code.trim(),
            popId: population._id.trim(),
            popName: population.name.trim(),
            popCode:  isNaN(parseInt(population.code.trim())) ? population.code.trim() : parseInt(population.code.trim()),
            distributionCenterId: population.distributionCenterId.trim(),
            distributionCenterName: cedisMap[population.distributionCenterId].trim()
        })),
        reduce((acc, obj) => {
            acc[generateKey(obj)] = obj;
            return acc;
        }, {})
    ))
);

/**
 * imports the input.json file and parses to a ZonePulationMap
 * if you need to update the data, add a new input.xlsx file and the run 'node ZonePopulationFileImporter.js'
 */
const generateMapFromFile$ = forkJoin(
    ZonePopulationDA.getCEDIsMap_name_id$(),
    ZonePopulationDA.getGeneratorMap_name_id$(),
).pipe(
    mergeMap(([cediMap, generatorMap]) => defer(() => loadJsonFile('input.json')).pipe(
        mergeMap(rows => from(rows)),
        map(row => {
            row['Generador'] = ["PACIFIKA", "CARMEL", "LOGUIN"].includes(row['Generador'].trim()) ? "LINEA DIRECTA" : row['Generador'];
            const zoneCode = row['Codigo Zona'].trim();
            const zoneName = row['Nombre Zona'].trim();
            let popCode = row['Codigo Poblacion'].trim();
            const popName = row['Nombre Poblacion'].trim();
            const distributionCenterName = row['Cedi'].trim();
            const generatorName = row['Generador'].trim();

            popCode = isNaN(parseInt(popCode)) ? popCode : parseInt(popCode);

            return {
                generatorId: generatorMap[generatorName.trim()],
                generatorName,
                zoneId: undefined,
                zoneName,
                zoneCode,
                popId: undefined,
                popName,
                popCode,
                distributionCenterId: cediMap[distributionCenterName],
                distributionCenterName
            };
        }),
        reduce((acc, obj) => {
            acc[generateKey(obj)] = obj;
            return acc;
        }, {})
    ))
)


const generateKey = ({ generatorId, generatorName,zoneCode, zoneName, popCode, popName }) => {
    return [zoneCode, zoneName, popCode, popName, generatorName].join(", ")
};

