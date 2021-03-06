const { processXlsxFiles, outputSQLFiles, refreshOutputDir } = require('./lib/file');
const log = require('./lib/logger');

try {
  const xlsxContent = processXlsxFiles();

  refreshOutputDir();
  outputSQLFiles(xlsxContent);

  log.info("Success!");
} catch (e) {
  log.error(e);
}
