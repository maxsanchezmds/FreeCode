const fs = require('fs');
const path = require('path');

const variablesFilePath = path.join(__dirname, 'variables.json');

function saveVar(variables) {
  let jsonData = {};

  // Leer el archivo existente
  try {
    const existingData = fs.readFileSync(variablesFilePath, 'utf8');
    if (existingData.trim()) {
      jsonData = JSON.parse(existingData);
    }
  } catch (readErr) {
    if (readErr.code !== 'ENOENT') {
      console.error('Error reading file:', readErr);
      return;
    }
  }

  // Agregar las nuevas variables al JSON
  Object.entries(variables).forEach(([key, value]) => {
    jsonData[key] = value;
  });

  // Guardar el archivo actualizado
  fs.writeFileSync(variablesFilePath, JSON.stringify(jsonData, null, 2), 'utf8');
}

function deleteVar(variable) {
  let jsonData = {};

  // Leer el archivo existente
  try {
    const existingData = fs.readFileSync(variablesFilePath, 'utf8');
    if (existingData.trim()) {
      jsonData = JSON.parse(existingData);
    }
  } catch (readErr) {
    if (readErr.code === 'ENOENT') {
      console.error('File not found. No variable to delete.');
      return;
    } else {
      console.error('Error reading file:', readErr);
      return;
    }
  }

  // Extraer el nombre de la variable (clave)
  const variableName = typeof variable === 'object' ? Object.keys(variable)[0] : variable;

  // Verificar si la variable existe y eliminarla
  if (variableName in jsonData) {
    delete jsonData[variableName];
    console.log(`Variable '${variableName}' deleted successfully`);
  } else {
    console.log(`Variable '${variableName}' does not exist`);
    return;
  }

  // Guardar el archivo actualizado
  fs.writeFileSync(variablesFilePath, JSON.stringify(jsonData, null, 2), 'utf8');
}

function seeAllVars() {
  try {
    const existingData = fs.readFileSync(variablesFilePath, 'utf8');
    if (existingData.trim()) {
      const jsonData = JSON.parse(existingData);
      console.log('All variables:', jsonData);
      return jsonData; // Devuelve el objeto con las variables
    } else {
      console.log('No variables defined.');
      return {};
    }
  } catch (readErr) {
    if (readErr.code === 'ENOENT') {
      console.log('No variables defined (file does not exist).');
      return {};
    } else {
      console.error('Error reading file:', readErr);
      return {};
    }
  }
}

function getVar(variableName) {
  try {
    const existingData = fs.readFileSync(variablesFilePath, 'utf8');
    if (existingData.trim()) {
      const jsonData = JSON.parse(existingData);

      // Verificar si la variable existe en el JSON
      if (variableName in jsonData) {
        return jsonData[variableName]; // Devuelve solo el valor
      } else {
        console.log(`Variable '${variableName}' does not exist.`);
        return null;
      }
    } else {
      console.log('No variables defined.');
      return null;
    }
  } catch (readErr) {
    if (readErr.code === 'ENOENT') {
      console.log('No variables defined (file does not exist).');
      return null;
    } else {
      console.error('Error reading file:', readErr);
      return null;
    }
  }
}


module.exports = { saveVar, deleteVar, seeAllVars, getVar };
