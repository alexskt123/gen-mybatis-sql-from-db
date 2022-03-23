const fs = require('fs');
const config = require('../../config');
const XLSX = require('xlsx');
const distinct = require('distinct');
const { getSelectStatement, getInsertStatement, getUpdateStatement } = require('../sql');
const { pascalCase } = require('change-case');
const OracleDialect = require('../OracleDialect');

const getFilesFromPath = (filePath, fileExt) => {
  try {
    const filenames = fs.readdirSync(filePath);
    const csvFiles = filenames.filter((x) => x.replace(fileExt) !== x);
    return csvFiles;
  } catch (_e) {
    return [];
  }
};

const processXlsxFiles = () => {
  const xlsxFiles = getFilesFromPath(config.inputPath, '.xlsx');
  const acceptXLSXSheetNames = config.acceptXLSXSheetNames;

  const acceptXLSXSheetNamesCount = acceptXLSXSheetNames.reduce((a, c) => {
    return { ...a, [c]: 0 };
  }, {});
  const acceptXLSXSheetContent = acceptXLSXSheetNames.reduce((a, c) => {
    return { ...a, [c]: null };
  }, {});

  xlsxFiles.forEach((file) => {
    const excelFile = XLSX.readFile(file);
    acceptXLSXSheetNames.forEach((x) => {
      const sheet = excelFile.Sheets[x];
      if (sheet) {
        acceptXLSXSheetNamesCount[x] = acceptXLSXSheetNamesCount[x] + 1;

        var content = XLSX.utils.sheet_to_json(sheet);
        acceptXLSXSheetContent[x] = content;
      }
    });
  });

  // Check if the accepting sheet more than 1 sheet or not, if yes, throw error
  if (Object.keys(acceptXLSXSheetNamesCount).some((x) => acceptXLSXSheetNamesCount[x] > 1)) {
    throw `More than one sheet!`;
  }

  return acceptXLSXSheetContent;
};

const writeFile = (tableName, fileContent, mode, path) => {
  const fileName = `${mode}${pascalCase(tableName)}.sql`;
  fs.writeFileSync(`${path}${fileName}`, fileContent);
};

const refreshOutputDir = () => {
  if (fs.existsSync(config.outputPath.base)) {
    fs.rmdirSync(config.outputPath.base, { recursive: true });
  }
  fs.mkdirSync(config.outputPath.base);
};

const outputSQLFiles = (xlsxContent) => {
  const sqlOutputPath = config.outputPath.sql;
  if (fs.existsSync(sqlOutputPath)) {
    fs.rmdirSync(sqlOutputPath, { recursive: true });
  }
  fs.mkdirSync(sqlOutputPath);

  const dataDict = xlsxContent['Data Dict'];
  const distinctTableList = distinct(dataDict.map((x) => x['Table Name'])).filter((x) => x && x !== '');

  distinctTableList.forEach((table) => {
    const selectComment = OracleDialect.generateHeaderComment(OracleDialect.headers("SELECT", `select-${table}`));
    const selectStatement = getSelectStatement(table, dataDict);
    const executableSelectSql = OracleDialect.mybatisToOracleSql(selectStatement);
    const insertComment = OracleDialect.generateHeaderComment(OracleDialect.headers("INSERT", `insert-${table}`));
    const insertStatement = getInsertStatement(table, dataDict);
    const executableInsertSql = OracleDialect.mybatisToOracleSql(insertStatement);
    const updateComment = OracleDialect.generateHeaderComment(OracleDialect.headers("UPDATE", `update-${table}`));
    const updateStatement = getUpdateStatement(table, dataDict);
    const executableUpdateSql = OracleDialect.mybatisToOracleSql(updateStatement);


    // Select SQL files
    writeFile(table, `${selectStatement}`, 'Select', sqlOutputPath);

    // Insert SQL files
    writeFile(table, `${insertStatement}`, 'Insert', sqlOutputPath);

    // Update SQL files
    writeFile(table, `${updateStatement}`, 'Update', sqlOutputPath);

    // Executable Select SQL files
    writeFile(table, `${selectComment}${executableSelectSql}`, 'eSelect', sqlOutputPath);

    // Executable Insert SQL files
    writeFile(table, `${insertComment}${executableInsertSql}`, 'eInsert', sqlOutputPath);

    // Executable Update SQL files
    writeFile(table, `${updateComment}${executableUpdateSql}`, 'eUpdate', sqlOutputPath);
  });
};

module.exports = {
  processXlsxFiles,
  getFilesFromPath,
  outputSQLFiles,
  refreshOutputDir,
};
