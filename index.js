const express = require('express');
const http = require ('http');
const fs = require('fs');
const path = require("path");
const morgan = require('morgan');
const bodyParser = require('body-parser');
const multer = require('multer');
const res = require('express/lib/response');

function folderCreator() { //Funzione che crea la cartella anno/mese/giorno in caso non esista e restituisce la stringa con il path
  const dayNames = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"
];
  const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
];
  let d = new Date();
  let year = d.getFullYear();
  let month = monthNames[d.getMonth()];
  let day = dayNames[d.getDay()];
  let dir = './uploads'

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  };


  dir = dir + '/' + year;

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  };

  dir = dir + '/' + month;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  };

  dir = dir + '/' + day + '_' + d.getDate();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  };

  return dir;
}

function newName() { //funzione che restituisce stringa in base alla data con formato YYMMDD_hh.mm

  let months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  let d = new Date();
  let year = d.getFullYear() - 2000;
  let month = months[d.getMonth()];
  let day = d.getDate();
  let hours = d.getHours();
  let minutes = d.getMinutes();

  let name = day + month + year + '_' + hours + '.' + minutes + '_';
  return name;

}



let fileStorageEngine = multer.diskStorage({ //funzione async di storage di multer in cui vanno indicati path di destinazione e nome file
  destination: (req, file, cb) => {
    cb(null, folderCreator());
  },
  filename: (req, file, cb) => {
    cb(null, newName() + file.originalname);
  },
})

let upload = multer({ 
  storage: fileStorageEngine,
  limits: {fileSize: 12 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
      cb(null, true);
    } else {
      req.fileValidationError = 'Only .png, .jpg and .jpeg format allowed!';
      return cb(null, false, new Error('Only .png, .jpg and .jpeg format allowed!!'));
    }
  }
});


let hostname = 'localhost';
let port = '4000';

let app = express();
app.use(morgan('dev'));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "upload.html"));
});

app.post('/upload', upload.single('image'), (req, res) => {
  if(req.fileValidationError) {
    res.statusCode = 500;
    return  res.sendFile(path.join(__dirname, "fileValidationError.html")); //CONTROLLA CHE I FILE SIANO IMMAGINI
}
  res.statusCode = 200;
  res.setHeader('Content-Type','text/plain');
  console.log(req.file);
  res.send('Single file upload successful\nFile path: ' + req.file.path);
});

app.post('/multirequest', upload.array('images', 12), (req, res) => {
  if(req.fileValidationError) {
    res.statusCode = 500;
    return  res.sendFile(path.join(__dirname, "fileValidationError.html")); //CONTROLLA CHE I FILE SIANO IMMAGINI
}
  res.statusCode = 200;
  res.setHeader('Content-Type','text/plain');
  console.log(req.files);
  let i = 0;
  let finalRes = 'Multiple files upload successful\nFiles path: ' + req.files[i].path + '\n';
  for (i = 1; i < 12; i++) {
    if (req.files[i] == null) break
    else  finalRes = finalRes + req.files[i].path + '\n';
  }
  res.send(finalRes);
});

app.use(function (err, req, res, next) {
  res.statusCode = 500;
  res.sendFile(path.join(__dirname, "fileSizeError.html"));
})

const server = http.createServer(app);

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}`);
});

