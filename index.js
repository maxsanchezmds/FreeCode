const fs = require('fs');

function saveVariable(variables) {
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

module.exports = saveVariable;
