const fs = require('fs');

function saveVar(variables) {
  let jsonData = {};

  // Leer el archivo existente
  try {
    const existingData = fs.readFileSync('variables.json', 'utf8');
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
    console.log(`Variable '${key}' saved successfully`);
  });

  // Guardar el archivo actualizado
  fs.writeFileSync('variables.json', JSON.stringify(jsonData, null, 2), 'utf8');
}

function deleteVar(variable) {
  let jsonData = {};

  // Leer el archivo existente
  try {
    const existingData = fs.readFileSync('variables.json', 'utf8');
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
  fs.writeFileSync('variables.json', JSON.stringify(jsonData, null, 2), 'utf8');
}

module.exports = { saveVar, deleteVar };
