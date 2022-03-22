const getSelectStatement = (tableName, fieldList) => {
  const curTableFieldList = fieldList.filter((x) => x['Table Name'] === tableName).map((x) => x['Field Name']);

  const selectFields = curTableFieldList.reduce((acc, cur, idx) => {
    const curStatement = idx === 0 ? cur : `, ${cur}`;
    return `${acc}${curStatement}`;
  }, '');

  const whereFields = curTableFieldList.reduce((acc, cur, idx) => {
    const whereStatement = `${cur} = #{${cur}}`;
    const curStatement = idx === 0 ? whereStatement : ` AND ${whereStatement}`;
    return `${acc}${curStatement}`;
  }, '');

  return `SELECT ${selectFields} FROM ${tableName} WHERE ${whereFields}`;
};

const getInsertStatement = (tableName, fieldList) => {
  const curTableFieldList = fieldList.filter((x) => x['Table Name'] === tableName).map((x) => x['Field Name']);

  const insertFields = curTableFieldList.reduce((acc, cur, idx) => {
    const curStatement = idx === 0 ? cur : `,${cur}`;
    return `${acc}${curStatement}`;
  }, '');

  const valueFields = curTableFieldList.reduce((acc, cur, idx) => {
    const valueStatement = `#{${cur}}`;
    const curStatement = idx === 0 ? valueStatement : `,${valueStatement}`;
    return `${acc}${curStatement}`;
  }, '');

  return `INSERT INTO ${tableName} (${insertFields}) VALUES (${valueFields})`;
};

const getUpdateStatement = (tableName, fieldList) => {
  const curTableFieldList = fieldList.filter((x) => x['Table Name'] === tableName).map((x) => x['Field Name']);

  const updateFields = curTableFieldList.reduce((acc, cur, idx) => {
    const updateStatement = `${cur} = #{${cur}}`;
    const curStatement = idx === 0 ? updateStatement : `,${updateStatement}`;
    return `${acc}${curStatement}`;
  }, '');

  return `UPDATE ${tableName} SET ${updateFields} WHERE id = #{id}`;
};

module.exports = {
  getSelectStatement,
  getInsertStatement,
  getUpdateStatement,
};
