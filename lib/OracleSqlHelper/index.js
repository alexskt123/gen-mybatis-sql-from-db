class OracleSqlHelper {
  gen = (funType, funName) => {
    return`
-- ------------------------------------
-- Function Type: ${funType}
-- Function Name: ${funName} 
-- 
-- ------------------------------------
`.substr(1);
  };

  reverse = (statement) => {
    const stmt = statement.split("\n").map(s=>{
      if(!s.trim().startsWith("--")){
        return s;
      } else{
        return "";
      }
    }).join(" ");

    const process = (stmt) => {
      const reg = new RegExp(/#{([^}]+)}/g);
      const arr = [];
      let m;
      do{
        m = reg.exec(stmt);
        if(m){
          arr.push(m[1]);
        }
      }while (m);
      return [...new Set(arr)];
    };
    const result = process(stmt);
    const variables = result.map(it=>`define ${it} = ?`).join("\n");
    const replaceVariable = [statement].concat(result).reduce((statement,next)=>
      statement.replaceAll(`#{${next}}`, `&${next}`)
    );
    return `${variables}\n${replaceVariable}`;
  };
}

module.exports = new OracleSqlHelper();


