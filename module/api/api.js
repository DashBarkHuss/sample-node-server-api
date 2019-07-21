const mysql = require('mysql');
const md5 = require('md5');

class database {
  constructor() {}
  // create mysql connection
  static create() {
    let message = "Creating MySQL connection...";
    this.connection = mysql.createConnection({
      host: process.env.HOST,
      user: process.env.DBUSER,
      password: process.env.PASSWORD,
      database: process.env.DATABASE
    })
    this.connection.connect();
    console.log(message + 'Ok.');
  }
  // execute a mysql query
  static exec(command) {
    let Q = 'select email_address from user';
    this.connection.query(Q, (error, results, fields) => {
      if (error)
        throw error;
      let result = result[0];
      console.log('email = ' + result.email_address);
    });
  }
}

function action_register_user ( request, payload ) {
  return new Promise ( (resolve, reject ) => {
    if (!request || !request.headers || !payload)
      reject("Error: missing request or payload");
    let q = 'select email_address from user';
        q += ` where email_address = '${payload.email_address}' limit 1`;
        console.log(q);
    //check if user already exists in database
    database.connection.query(q, (error, results) => {
      if (error)
        throw(error);
      let result = results[0];
      if (results &&
        results.length != 0 &&
        result.email == payload.email)
        resolve(`{"success":false}`);
      else {
        // Encrypt password with md5
        let password_md5 = md5(payload.password);
        let fields = "(`email_address`, `password_md5`)";
        let values = `VALUES('${payload.email_address}',`;
        values += `'${password_md5}')`;
        console.log("Insert into user " + fields + " " + values);
        // create new user in database
        database.connection.query("Insert into user " + fields + " " + values, 
        (error, results)=>{
          if (error)
            throw(error);
            resolve(`{"success": true}`);
        });
      }
    });
  }).catch((error)=> { console.log(error)});
}

function identify(a,b){
  return API.parts[0] == 'api' &&
    API.parts[1] == a &&
    API.parts[2] == b;
}

function respond ( response, content ) {
  console.log("responding = ", [ content ]);
  const jsontype = "{ 'content-Type': 'application/json' }";
  response.writeHead(200, jsontype);
  response.end(content, 'utf-8');
}

function json( chunks ) {
  return JSON.parse( Buffer.concat ( chunks ).toString() );
}

class API {
  constructor() {}
  static exec(request, response) {
    console.log("API.exec(), parts = ", API.parts);
    if (request.method = 'POST') {
      request.url[0] === '/'? request.url = request.url.substring(1, request.url.length) : null;
      request.parts = request.url.split('/');
      request.chunks = []; 
    }
    // Start reading post data chunks
    request.on('data', segment => {
      if (segment.length > 1e6) // 413 = "request entity too large" 
      response.writeHead(413, {'Content-Type': 'text/plain'}).end();
      else
        request.chunks.push(segment);
    });
    request.on('end', ()=> {
      API.parts = request.parts;
      if (identify("user", "register"))
        action_register_user(request, json(request.chunks ) )
        .then( content => respond(response, content) );
    })
  }
  static catchAPIrequest(v){ //why v?, when is this called
    v[0] == '/'? v= v.substring(1, v.length) : null; 
    if (v.constructor === String)
      if(v.split('/')[0] == 'api'){
        API.parts = v.split('/');
        return true;
      }
    return false;
  }
}

API.parts = null;

module.exports = { API, database };