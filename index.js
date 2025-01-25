const fs = require('fs');

function saveVariable(variable) {
  const variableName = Object.keys(variable)[0];
  const variableValue = variable[variableName];

  let jsonData = {};
  
  try {
    const existingData = fs.readFileSync('variables.json', 'utf8');
    if (existingData.trim()) {
      jsonData = JSON.parse(existingData);
    }
  } catch (readErr) {
    // Ignore file not found error
    if (readErr.code !== 'ENOENT') {
      console.error('Error reading file:', readErr);
      return;
    }
  }

  jsonData[variableName] = variableValue;

  fs.writeFileSync('variables.json', JSON.stringify(jsonData, null, 2), 'utf8');
  console.log(`Variable '${variableName}' saved successfully`);
}

module.exports = saveVariable;