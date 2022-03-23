class Headers {
  headers = new Map(); // Map store header key and value

  /**
   * Set Function Type
   * @param value the value of function type
   * @returns updated header (mutable)
   */
  funcType = (value) => this.customHeader('Function Type', value);

  /**
   * Set Function Name
   * @param value the value of function type
   * @returns Headers updated header (mutable)
   */
  funcName = (value) => this.customHeader('Function Name', value);

  /**
   * Set custom header
   * @param key key of header
   * @param value value of header
   * @returns Headers updated header (mutable)
   */
  customHeader = (key, value) => {
    this.headers.set(key, value);
    return this;
  };
}

class OracleDialect {
  /**
   * Get a Headers class which contains the meta data for the script and marked in the comments.
   * The funcType and funcName is the mandatory fields
   * @param funcType the function type [Insert, Update, Select, Delete]
   * @param funcName the function name of the sql
   * @returns {Headers}
   */
  headers = (funcType, funcName) => new Headers().funcType(funcType).funcName(funcName);

  /**
   * Generate comment for sql based on the function type and function name
   * (Will further modify for future extract meta data from the comment)
   * @param headers the headers to be applied to the script
   * @returns comments the comments generated
   */
  generateHeaderComment = (headers) => {
    const headersComment = [...headers.headers].map((key, _) => `-- ${key[0]}: ${key[1]}`).join('\n');

    return `
    -- ------------------------------------
    ${headersComment}
    -- 
    -- ------------------------------------
    `
      .replace(/(\n) +/g, '$1') //trim space
      .substr(1)  // skip the first new line
      ;
  };

  /**
   * convert a mybatis sql template to oracle executable script
   * @param statement the mybatis sql template to be replace
   * @returns executableSql the executable oracle script
   */
  mybatisToOracleSql = (statement) => {
    // remove comments if exists
    const stmt = statement.split('\n').map(s =>
      (!s.trim().startsWith('--')) ? s : '',
    ).join(' ');

    const findPlaceHolders = (stmt) => {
      const reg = new RegExp(/#{([^}]+)}/g);
      const arr = [];
      let m;
      do {
        m = reg.exec(stmt);
        if (m) {
          arr.push(m[1]);
        }
      } while (m);
      return [...new Set(arr)];
    };
    const placeHolders = findPlaceHolders(stmt);
    const variables = placeHolders.map(it => `define ${it} = ?`).join('\n'); // create defined variable code block
    const replaceVariable = [statement].concat(placeHolders) // concat to perform effect like foldLeft
      .reduce((statement, next) => statement.replaceAll(`#{${next}}`, `&${next}`)); // replacing mybatis sql to oracle sql
    return `${variables}\n${replaceVariable}`; // join result
  };
}

module.exports = new OracleDialect();


