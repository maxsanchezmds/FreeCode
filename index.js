const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * Runs a Python function with given arguments
 * @param {string} pythonFilePath - Full path to the Python script
 * @param {string} functionName - Name of the function to call
 * @param {Array} args - Arguments to pass to the function
 * @returns {Promise} Promise resolving to the function's return value
 */

const variablesFilePath = path.join(__dirname, 'variables.json');



function runPythonFunction(pythonFilePath, functionName, args = []) {
  return new Promise((resolve, reject) => {
    // Construct the Python script to import the module and call the function
    const pythonCode = `
import sys
import json

# Add the directory of the script to Python path
sys.path.append('${path.dirname(pythonFilePath)}')

# Import the module dynamically
module_name = '${path.basename(pythonFilePath, '.py')}'
module = __import__(module_name)

# Get the function
func = getattr(module, '${functionName}')

# Convert arguments to Python types
python_args = ${JSON.stringify(args)}

# Call the function and print the result
try:
    result = func(*python_args)
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({'error': str(e)}), file=sys.stderr)
`;

    // Spawn a Python process
    const python = spawn('python3', ['-c', pythonCode]);

    let output = '';
    let errorOutput = '';

    // Collect stdout
    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    // Collect stderr
    python.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    // Handle process close
    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script failed with code ${code}. Error: ${errorOutput}`));
        return;
      }

      try {
        // Parse the JSON output
        const result = JSON.parse(output.trim());
        
        // Check if the result is an error object
        if (result && result.error) {
          reject(new Error(result.error));
        } else {
          resolve(result);
        }
      } catch (parseError) {
        reject(new Error(`Failed to parse Python output: ${output}`));
      }
    });

    // Handle spawn errors
    python.on('error', (err) => {
      reject(new Error(`Failed to spawn Python process: ${err.message}`));
    });
  });
}


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


module.exports = { saveVar, deleteVar, seeAllVars, getVar, runPythonFunction };
