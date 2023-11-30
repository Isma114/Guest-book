let express = require("express");
let app = express();
let port = 8000;

//Skapa en HTTP-server som lyssnar på den angivna porten
let httpServer = app.listen(port, function () {
  console.log(`Webbserver körs på port ${port}`); 
});

app.use(express.urlencoded({ extended: true })); /* middleware för att tolka URL-kodade data */
app.use(express.static("filer")); /* statisk mapp för att serva filer, tex style, bilder */



let fs = require("fs"); /*  Importera filsystemmodulen */


//rotvägen ("/") för att returnera login.html när någon besöker webbplatsen
app.get("/", function(req, res){

  res.sendFile(__dirname + "/login.html");
});

//Variabel för att hålla reda på användarens inloggningsstatus.
let isLogged = false;


// Post-förfrågan hanteras för att kontrollera inloggning
app.post("/checklogin", function(req, res){

  //Läs inloggningsuppgifter från login.json-filen
  const users = JSON.parse(fs.readFileSync("login.json").toString());
  console.log(users);
  let loginMessage =""; /* Variabeln hanterar error meddelande */

  // går igenom användare för att kontrollera inloggning
  for(i in users){
      if (users[i].user ==req.body.user && users[i].pass == req.body.pass){
        //Om inloggningen är lyckad, sätt in isLogged till true och omdirigera till guestbook
        isLogged = true;
        res.redirect("/guestbook");
        return;
      }
  }

  //Om inloggningen är misslyckad, skicka felmeddelande och skicka login.html.
  let result = fs.readFileSync("login.html").toString();
  loginMessage = "LOG IN FAILED! PLEASE TRY AGAIN!<br>";
  result = result.replace('<div id="loginMessage"></div>', `<div id="loginMessage">${loginMessage}</div>`);
  res.send(result);
  
});

//Sökväg för att visa gästbokssidan
app.get("/guestbook", function (req, res) {
  //Kontrollera om användaren är inloggad, annars omdirigera till login.html
  if(!isLogged){  /* Man får inte åtkomst om man inte är gör inloggning */               
    res.redirect("/");
    return;
  }
  //Läs in användare från users.json
  let users = fs.readFileSync("./users.json").toString();

  //Parsa JSON-sträng till Javascript array och spara den till variabeln inputArray
  let inputArray = JSON.parse(users);
  inputArray.reverse(); /* Vända arrayen så att senast input ska vara först i listan */
  //
  let formContent = fs.readFileSync('./guest.html').toString();

  //Skapa och formatera datum på det aktuella datumet och tiden
  let currentDate = new Date();
  let formattedDate = currentDate.toLocaleString();

  //Skapa HTML baserat på använderinformation för varje post och skicka
  let output = formContent.replace('<!-- INSERT_DYNAMIC_CONTENT_HERE -->', inputArray.map((input) => `
    <hr>
    <p> Posted on: ${input.postedDate}</p>
    <li>
      Name: ${input.name} <br>
      Telefon: ${input.phone} <br>
      E-post: ${input.email} <br>
      Kommentar: ${input.comment}
    </li>
  `).join(''));

  
  res.send(output); /* Skicka HTML som svar */
});

// Post-förfrågan för att lägga till inlägg till gästboken
app.post('/skicka', function (req, res) {
  // Hämta inläggsdata från formuläret
  const name = req.body.name;
  const phone = req.body.phone;
  const email = req.body.email;
  const comment = req.body.comment;
  
  //skapa ett tidsstämpel för när inlägget görs
  const postedDate = new Date().toLocaleString();

  //Läser befintliga användardata från "users.json"-filen 
  const users = fs.readFileSync('./users.json').toString();
  const inputArray = JSON.parse(users);

  //Lägg till den nya inlägget i arrayen
  inputArray.push({
    name,
    phone,
    email,
    comment,
    postedDate,
  });
  //Skriv över den uppdaterade arrayen i users.json filen
  fs.writeFileSync('./users.json', JSON.stringify(inputArray));

  // Omdirigera till gästboken
  res.redirect("/guestbook");
});

// Hantera Post-förfrågan för att logga ut användaren och sedan omridigera till login.html
app.post("/logout", function(req, res){

  res.redirect("/");
});



