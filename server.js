var express = require('express');
var app = express();
var http = require('http').createServer(app);
var sio = require('socket.io')(http);
var cookie = require('cookie-parser');
var info = "";

app.use(express.static('node_modules'));
app.use(cookie());
app.get('/',function(req,res){
	res.sendFile(__dirname + "/" + "mainpage.html");
})

app.get('/login.html',function(req,res){
	res.sendFile(__dirname + "/" + "login.html");
})

app.get('/register.html',function(req,res){
	res.sendFile(__dirname+ "/" + "register.html");
})

app.get('/register',function(req,res){
	var username = req.query.username;
	var password = req.query.password;
	var mysql = require('mysql');
	var connection = mysql.createConnection({
		host : 'localhost',
		user : 'root',
		password : 'woquD$N(F@1',
		database : 'fse_pro1',
 	});

	if(req.query.password != req.query.password_confirmation){
		res.sendFile(__dirname+ "/" + "register.html");
		return;
	}
	connection.connect();

	sql = "select * from fse_pro1_users where username='" + req.query.username + "'";
	connection.query(sql,function(err,result){
		if(err){
			console.log(err.message);
			info = "error: database error";	
			res.send(info);
			return;	
		}
		if(result.length > 0){
			info = "sorry : the username has been used";
			res.send(info);		
			return;
		}
		else{
			sql = "insert into fse_pro1_users(username,password) values('"+ username + "','" +password + "')";
			console.log(sql);
			connection.query(sql,function(err,result){
				if(err){
					console.log(err.message);
					info = "error: database error";
					res.send(info);
					return;	
				}
				else{
					res.sendFile(__dirname+'/'+"afterRegister.html");
				}
			});
		}
	});
	
	
})

app.get('/login',function(req,res){
	var username = req.query.username;
	var password = req.query.password;
	var mysql = require('mysql');
	var connection = mysql.createConnection({
		host : 'localhost',
		user : 'root',
		password : 'woquD$N(F@1',
		database : 'fse_pro1',
 	});
	
	sql = "select password from fse_pro1_users where username = '" + username + "'";
	
	connection.query(sql,function(err,result){
		if(err){
			console.log(err.message);
			info = "error:database error";
			res.send(info);
			return;		
		}
		if(result.length == 0){
			res.setHeader('Content-Type','text/html');
			res.send("<p>username does not exist</p>");
			return;
		}
		if(password == result[0].password){
			res.cookie('userName',username);
			res.redirect('/chatroom');

		}	
		else{
			res.setHeader('Content-Type','text/html');
			res.send("<p>sorry, password is wrong</p>");
			return;
		}
	});
})

app.get('/chatroom',function(req,res){
	res.sendFile(__dirname + '/' + 'chatroom.html');
	
})
sio.on('connection',function(socket){
	console.log('a user connected');

	var bodyParser = require('body-parser');
	var urlencodedParser = bodyParser.urlencoded({ extended: false })
	app.post('/sendMessage',urlencodedParser,function(req,res){
		var info1 = req.body.myMessage;
		var userName = req.body.userName;
		//console.log(info1);
		res.setHeader('Centent-Type','text/javascript');
		var js = "<script> var p = document.createElement('p');";
		js = js + "var textNode = document.createTextNode('" + info1 + "');";
		js = js + "p.appendChild(textNode);";
		js = js + "var e = document.getElementById('chattingWindow');";
		js = js + "e.appendChild(p);</script>";
		res.send(js);

		var mysql = require('mysql');
		var connection = mysql.createConnection({
			host : 'localhost',
			user : 'root',
			password : 'woquD$N(F@1',
			database : 'fse_pro1',
	 	});
		sql = "insert into fse_pro1_message(username,date,content)" +" values('" + userName;
		sql = sql + "',now(),'" + info1 + "')";
		//console.log(sql);
		connection.query(sql,function(err,result){
			if(err){
				console.log(err.message);
				info = "error:database error";
				res.send(info);
				return;		
			}
			date = new Date();
			//console.log(date);
			var broadMessage = {"userName":userName,"time":date,"broadcastMessage":info1};
			sio.sockets.emit('broadcast_message',broadMessage);
		});
	})
})

http.listen(8081,function(){
	console.log("server running on 127.0.0.1:8081");
}) 
