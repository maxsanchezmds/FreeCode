const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const variablesFilePath = path.join(__dirname, 'variables.json');

function getPythonCommand() {
  if (process.platform === 'win32') {
    try {
      const result = spawn('python', ['--version']);
      return 'python';
    } catch (e) {
      return 'py';
    }
  }
  return 'python3';
}

/**
 * Runs any Python function from any file with provided arguments
 * @param {string} pythonFilePath - Path to the Python file (relative or absolute)
 * @param {string} functionName - Name of the function to execute
 * @param {Array} args - Arguments to pass to the function (optional)
 * @returns {Promise} Promise resolving to the function's return value
 */
async function runPythonFunction(pythonFilePath, functionName, args = []) {
  const absolutePath = path.isAbsolute(pythonFilePath) 
    ? pythonFilePath 
    : path.resolve(process.cwd(), pythonFilePath);
    
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(absolutePath)) {
      reject(new Error(`Python file not found: ${absolutePath}`));
      return;
    }

    const scriptDir = path.dirname(absolutePath);
    const moduleName = path.basename(absolutePath, '.py');

    // The Python code now uses a special marker to separate printed output from the return value
    const pythonCode = `
import sys
import json
import os
from importlib import util, machinery

# Prepare paths for module import
script_dir = r'${scriptDir.replace(/\\/g, '\\\\')}'
script_path = r'${absolutePath.replace(/\\/g, '\\\\')}'

if script_dir not in sys.path:
    sys.path.insert(0, script_dir)

try:
    loader = machinery.SourceFileLoader('${moduleName}', script_path)
    spec = util.spec_from_loader(loader.name, loader)
    module = util.module_from_spec(spec)
    loader.exec_module(module)
except Exception as e:
    print(json.dumps({'error': f'Failed to import {script_path}: {str(e)}'}), file=sys.stderr)
    sys.exit(1)

if not hasattr(module, '${functionName}'):
    print(json.dumps({'error': f'Function {functionName} not found in {script_path}'}), file=sys.stderr)
    sys.exit(1)

try:
    # Store the original stdout
    original_stdout = sys.stdout
    
    # Create a string buffer for our actual result
    from io import StringIO
    result_output = StringIO()
    
    try:
        # Execute function with original stdout for any print statements
        func = getattr(module, '${functionName}')
        result = func(*${JSON.stringify(args)})
        
        # Switch to our result buffer and output the actual return value
        sys.stdout = result_output
        print(json.dumps(result))
        
    finally:
        # Restore original stdout
        sys.stdout = original_stdout
    
    # Get the actual result (last line of output)
    print(result_output.getvalue().strip())
    
except Exception as e:
    print(json.dumps({'error': f'Error executing {functionName}: {str(e)}'}), file=sys.stderr)
    sys.exit(1)
`;

    const pythonCmd = getPythonCommand();
    const python = spawn(pythonCmd, ['-c', pythonCode], {
      cwd: scriptDir
    });

    let output = '';
    let errorOutput = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script failed with code ${code}. Error: ${errorOutput || 'No error message provided'}`));
        return;
      }

      try {
        // Get the last line of output, which should contain our result
        const lastLine = output.trim().split('\n').pop();
        
        // Parse the last line as our result
        const parsedOutput = JSON.parse(lastLine);
        
        if (parsedOutput && typeof parsedOutput === 'object' && parsedOutput.error) {
          reject(new Error(parsedOutput.error));
        } else {
          resolve(parsedOutput);
        }
      } catch (parseError) {
        reject(new Error(`Failed to parse Python output: ${output}`));
      }
    });

    python.on('error', (err) => {
      if (err.code === 'ENOENT') {
        reject(new Error(`Python (${pythonCmd}) is not installed or not in PATH. Please install Python and try again.`));
      } else {
        reject(new Error(`Failed to spawn Python process: ${err.message}`));
      }
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
