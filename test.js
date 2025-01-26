const { saveVar, deleteVar, getAllVars } = require('./index');

// Guardar variables
let numero20 = 10;
let numero30 = 20;
let numero198 = 30;

saveVar({ numero20, numero30, numero198 });

getAllVars()
