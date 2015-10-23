// =======================
// get the packages we need ============
// =======================
var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');

var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file
var User   = require('./app/models/user'); // get our mongoose model
    
// =======================
// configuration =========
// =======================
var port = process.env.PORT || 8080; // used to create, sign, and verify tokens
mongoose.connect(config.database); // connect to database
app.set('superSecret', config.secret); // secret variable
  
// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));

// =======================
// routes ================
// =======================
app.get('/register', function(req, res) {

  // create a sample user
  var nick = new User({ 
    //app_id: _id,
    email: 'email@gmail.com',
    name_surname: 'Ion Bulgaru', 
    password: 'qwert',
    admin: true,
    last_login: '0',
    token: '0'
  });
 
 function registerUser(user) {
  User.find({email: user.email}, function(err, users) {
    if (users.length) {
      res.json({success: false, message: 'email already exists', user: users});
    }
    else {
      // save the sample user
      res.json({success: true, message: 'successfully created user', user: user._id});
      nick.save(function(err) {
       if (err) throw err;

      });
    }
  })
 }
 registerUser(nick);
});

// basic route
app.get('/', function(req, res) {
    res.send('Hello! The API is at http://localhost:' + port + '/api');
});

// API ROUTES -------------------

// get an instance of the router for api routes
var apiRoutes = express.Router(); 

// route to authenticate a user (POST http://localhost:8080/api/authenticate)
apiRoutes.post('/login', function(req, res) {

  // find the user
  User.findOne({
    name_surname: req.body.name_surname
  }, function(err, user) {

    if (err) throw err;

    if (!user) {
      res.json({ success: false, message: 'Authentication failed. User not found.' });
    } else if (user) {

      // check if password matches
      if (user.password != req.body.password || user._id != req.body._id  || user.email != req.body.email) {
        res.json({ success: false, message: 'Authentication failed. Wrong email or password or app-id.' });
      }  else {

        // if user is found and password is right
        var timeStamp = new Date();
        var time = timeStamp.toLocaleTimeString();
        user.last_login = time;
        user.save(function(err) {
          if (err) throw err;
          console.log('timeStamp saved successfully');
          res.json({ success: true });
        });
//todo token to expire       // create a token
        var token = jwt.sign(user, app.get('superSecret'), {
          expiresInMinutes: 5 //1440 // expires in 24 hours
        });
        user.token = token;
        user.save(function(err) {
          if (err) throw err;
            console.log('Token added');
            res.json({success : true});
        });
//TODO: find a better solution
        user.token = 0;

        // return the information including token as JSON
        res.json({
          success: true,
          message: 'Enjoy your token!',
          token: token,
          timeStamp: time
        });
      }   
    }

  });
});

// last login route
app.get('/last_login', function(req, res) {
  
var list = [{"__v":0,"_id":{"$oid":"55f13d34258687e0bb9e4385"},"admin":true,"email":"emaple1@gmail.com","last_login":"11:25:24 AM","name_surname":"user1","password":"qwerty123"},
{"__v":0,"_id":{"$oid":"55ef49dd5d610eab18719deb"},"admin":true,"email":"emaple2@gmail.com","last_login":"12:25:24 AM","name_surname":"user2","password":"qwerty123"},
{"__v":0,"_id":{"$oid":"55f0173bb3322bf560724fd1"},"admin":true,"email":"emaple3@gmail.com","last_login":"10:25:24 AM","name_surname":"user3","password":"qwerty123"}];
 
 //function to display last_login by user 
 //TODO display only last login, not the whole object

 function searchByUserName(name_surname) {
    return list.filter(function(user) {
        return user.name_surname === name_surname;
    });
}
var a = searchByUserName('user1');
for (last_login in a ) {
  if (a.hasOwnProperty(last_login)) {
    console.log("last_login" + "=" + JSON.stringify(a[last_login]))
  }
}

//res.json({last_login_of_user: searchByUserName('user1').last_login});


var last_logins = list.map(function(user){
    return user.last_login;
});
res.json({success: true, last_logins: last_logins});
});

//  route middleware to verify a token
apiRoutes.use(function(req, res, next) {

  // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  // decode token
  if (token) {

    // verifies secret and checks exp
    jwt.verify(token, app.get('superSecret'), function(err, decoded) {      
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });    
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;    
        next();
      }
    });

  } else {

    // if there is no token
    // return an error
    return res.status(403).send({ 
        success: false, 
        message: 'No token provided.' 
    });
    
  }
});

// route to show a random message (GET http://localhost:8080/api/)
apiRoutes.get('/', function(req, res) {
  res.json({ message: 'Welcome to the coolest API on earth!' });
});

// route to return all users (GET http://localhost:8080/api/users)

  apiRoutes.get('/users', function(req, res) {
  User.find({}, function(err, users) {
    res.json(users);
  });
});   

  apiRoutes.get('/info', function(req, res) {

    User.find({token: req.headers['x-access-token'] }, function(err, users) {
    if (users.length) {
       res.json({success: true, message: 'info about user with specific token ', user: users});
    }
    else  {
      res.json({success: false, message: 'this token does not offer priviledges'});
    }});
  
  //res.json(users);

    });  

// apply the routes to our application with the prefix /api
app.use('/api', apiRoutes);

// we'll get to these in a second

// =======================
// start the server ======
// =======================
app.listen(port);
console.log('Magic happens at http://localhost:' + port);