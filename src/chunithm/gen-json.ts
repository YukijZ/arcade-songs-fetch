import fs from 'node:fs';
import Sequelize from 'sequelize';
import log4js from 'log4js';
import genJson from '@/_core/gen-json';
import { sequelize } from '@@/db/chunithm/models';

const logger = log4js.getLogger('chunithm/gen-json');
logger.level = log4js.levels.INFO;

const DIST_PATH = 'dist/chunithm';

const categories = [
  { category: 'POPS & ANIME' },
  { category: 'niconico' },
  { category: '東方Project' },
  { category: 'VARIETY' },
  { category: 'イロドリミドリ' },
  { category: 'ゲキマイ' },
  { category: 'ORIGINAL' },
  //! add further category here !//
];
const versions = [
  { releaseDate: '2015-07-16', version: 'CHUNITHM', abbr: 'CHUNITHM' },
  { releaseDate: '2016-02-04', version: 'CHUNITHM PLUS', abbr: 'CHUNITHM+' },
  { releaseDate: '2016-08-25', version: 'AIR', abbr: 'AIR' },
  { releaseDate: '2017-02-09', version: 'AIR PLUS', abbr: 'AIR+' },
  { releaseDate: '2017-08-24', version: 'STAR', abbr: 'STAR' },
  { releaseDate: '2018-03-08', version: 'STAR PLUS', abbr: 'STAR+' },
  { releaseDate: '2018-10-25', version: 'AMAZON', abbr: 'AMAZON' },
  { releaseDate: '2019-04-11', version: 'AMAZON PLUS', abbr: 'AMAZON+' },
  { releaseDate: '2019-10-24', version: 'CRYSTAL', abbr: 'CRYSTAL' },
  { releaseDate: '2020-07-16', version: 'CRYSTAL PLUS', abbr: 'CRYSTAL+' },
  { releaseDate: '2021-01-21', version: 'PARADISE', abbr: 'PARADISE' },
  { releaseDate: '2021-05-13', version: 'PARADISE LOST', abbr: 'PARADISE+' },
  { releaseDate: '2021-11-04', version: 'CHUNITHM NEW', abbr: 'NEW' },
  { releaseDate: '2022-04-14', version: 'CHUNITHM NEW PLUS', abbr: 'NEW+' },
  { releaseDate: '2022-10-13', version: 'SUN', abbr: 'SUN' },
  { releaseDate: '2023-05-11', version: 'SUN PLUS', abbr: 'SUN+' },
  { releaseDate: '2023-12-14', version: 'LUMINOUS', abbr: 'LUMINOUS' },
  { releaseDate: '2024-06-20', version: 'LUMINOUS PLUS', abbr: 'LUMINOUS+' },
  { releaseDate: '2024-12-12', version: 'VERSE', abbr: 'VERSE' },
  { releaseDate: '2025-07-16', version: 'X-VERSE', abbr: 'VERSE+' },
  //! add further mapping here !//
];
const types = [
  { type: 'std', name: 'STANDARD', abbr: 'STD' },
  { type: 'we', name: 'WORLD\'S END', abbr: 'WE' },
];
const difficulties = [
  { difficulty: 'basic', name: 'BASIC', color: 'lime' },
  { difficulty: 'advanced', name: 'ADVANCED', color: 'orange' },
  { difficulty: 'expert', name: 'EXPERT', color: 'red' },
  { difficulty: 'master', name: 'MASTER', color: 'darkorchid' },
  { difficulty: 'ultima', name: 'ULTIMA', color: 'black' },
];
const regions = [
  { region: 'jp', name: '日本版' },
  { region: 'intl', name: '海外版 (International ver.)' },
];

function getLevelValueOf(sheet: Record<string, any>) {
  if (sheet.level === null) return null;
  if (sheet.level.includes('☆')) return 100 + [...sheet.level].length;
  return Number(sheet.level.replace('+', '.5'));
}
function getInternalLevelValueOf(sheet: Record<string, any>) {
  if (sheet.internalLevel != null) return Number(sheet.internalLevel);
  if (sheet.level.includes('☆')) return 0;
  if (sheet.level != null) return Number(sheet.level.replace('+', '.5'));
  return null;
}
function getIsSpecialOf(sheet: Record<string, any>) {
  return sheet.type === 'we';
}

export default async function run() {
  logger.info('Loading songs and sheets from database ...');

  const songRecords = await sequelize.query(/* sql */ `
    SELECT
      *
    FROM "Songs"
      NATURAL LEFT JOIN "SongOrders"
      LEFT JOIN "SongExtras" USING ("songId")
      -- must not use NATURAL LEFT JOIN "SongExtras" here because we're overriding the "releaseDate" column
    ORDER BY "isNew", "SongExtras"."releaseDate", "sortOrder"
      -- must specify the "releaseDate" in "SongExtras" otherwise "Songs"."releaseDate" will be used
  `, {
    type: Sequelize.QueryTypes.SELECT,
    nest: true,
  });

  const sheetRecords = await sequelize.query(/* sql */ `
    SELECT
      *,
      "JpSheets"."songId" IS NOT NULL AS "regions.jp",
      "IntlSheets"."songId" IS NOT NULL AS "regions.intl"
    FROM "Sheets"
      NATURAL LEFT JOIN "SheetExtras"
      NATURAL LEFT JOIN "SheetInternalLevels"
      NATURAL LEFT JOIN "JpSheets"
      NATURAL LEFT JOIN "IntlSheets"
  `, {
    type: Sequelize.QueryTypes.SELECT,
    nest: true,
  });

  /*
    Levels lower than 10 have a known internal level relationship.
    Source: [レーティング・OVER POWER - チュウニズム攻略Wiki | Gamerch](https://gamerch.com/chunithm/entry/489232)
  */
  for (const sheetRecord of sheetRecords as Record<string, any>[]) {
    const levelValue = getLevelValueOf(sheetRecord);
    if (levelValue !== null && levelValue >= 1 && levelValue < 10) {
      sheetRecord.internalLevel = levelValue.toFixed(1);
    }
  }

  const jsonText = await genJson({
    songRecords,
    sheetRecords,
    categories,
    versions,
    types,
    difficulties,
    regions,
    getLevelValueOf,
    getInternalLevelValueOf,
    getIsSpecialOf,
  });

  logger.info(`Writing output into ${DIST_PATH}/data.json ...`);
  fs.mkdirSync(DIST_PATH, { recursive: true });
  fs.writeFileSync(`${DIST_PATH}/data.json`, jsonText);

  logger.info('Done!');
}

if (require.main === module) run();
