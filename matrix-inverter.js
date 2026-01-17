// Matrix Inverter using RREF Algorithm

let matrixSize = 3;

// Initialize matrix input on page load
window.onload = function() {
    createMatrixInput();
};

// Update layout based on matrix size
function updateLayout() {
    const mainContent = document.querySelector('.main-content');
    if (matrixSize >= 7) {
        mainContent.classList.add('vertical-layout');
    } else {
        mainContent.classList.remove('vertical-layout');
    }
}

// Create the matrix input grid
function createMatrixInput() {
    matrixSize = parseInt(document.getElementById('matrix-size').value);
    const container = document.getElementById('matrix-input');
    container.style.gridTemplateColumns = `repeat(${matrixSize}, 1fr)`;
    
    // Add class for larger matrices
    if (matrixSize >= 7) {
        container.classList.add('large-matrix');
    } else {
        container.classList.remove('large-matrix');
    }
    
    container.innerHTML = '';
    
    for (let i = 0; i < matrixSize * matrixSize; i++) {
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'matrix-input-cell';
        input.id = `cell-${i}`;
        input.step = 'any';
        input.value = '';
        container.appendChild(input);
    }
    
    // Update layout for larger matrices
    updateLayout();
}

// Get matrix from input
function getMatrix() {
    const matrix = [];
    for (let i = 0; i < matrixSize; i++) {
        matrix[i] = [];
        for (let j = 0; j < matrixSize; j++) {
            const value = document.getElementById(`cell-${i * matrixSize + j}`).value;
            matrix[i][j] = value === '' ? 0 : parseFloat(value);
        }
    }
    return matrix;
}

// Set matrix to input
function setMatrix(matrix) {
    for (let i = 0; i < matrixSize; i++) {
        for (let j = 0; j < matrixSize; j++) {
            document.getElementById(`cell-${i * matrixSize + j}`).value = matrix[i][j];
        }
    }
}

// Create identity matrix
function createIdentityMatrix(n) {
    const identity = [];
    for (let i = 0; i < n; i++) {
        identity[i] = [];
        for (let j = 0; j < n; j++) {
            identity[i][j] = (i === j) ? 1 : 0;
        }
    }
    return identity;
}

// Augment matrix A with identity matrix I: [A | I]
function augmentMatrix(A) {
    const n = A.length;
    const augmented = [];
    for (let i = 0; i < n; i++) {
        augmented[i] = [...A[i], ...createIdentityMatrix(n)[i]];
    }
    return augmented;
}

// Swap two rows
function swapRows(matrix, row1, row2) {
    [matrix[row1], matrix[row2]] = [matrix[row2], matrix[row1]];
}

// Multiply a row by a scalar
function multiplyRow(matrix, row, scalar) {
    for (let j = 0; j < matrix[row].length; j++) {
        matrix[row][j] *= scalar;
    }
}

// Add a multiple of one row to another
function addRowMultiple(matrix, sourceRow, targetRow, scalar) {
    for (let j = 0; j < matrix[targetRow].length; j++) {
        matrix[targetRow][j] += scalar * matrix[sourceRow][j];
    }
}

// Check if a value is close to zero (handling floating point errors)
function isZero(value, tolerance = 1e-10) {
    return Math.abs(value) < tolerance;
}

// Convert matrix to RREF (Reduced Row Echelon Form)
function rref(matrix) {
    // Create a deep copy to avoid mutating the original
    const rows = matrix.length;
    const cols = matrix[0].length;
    const result = matrix.map(row => [...row]);
    
    let lead = 0;
    
    for (let r = 0; r < rows; r++) {
        if (lead >= cols) {
            return result;
        }
        
        // Find pivot
        let i = r;
        while (i < rows && isZero(result[i][lead])) {
            i++;
        }
        
        if (i === rows) {
            // No pivot in this column, move to next column
            lead++;
            r--; // Don't advance row
            continue;
        }
        
        // Swap rows
        if (i !== r) {
            swapRows(result, i, r);
        }
        
        // Normalize pivot row
        const pivot = result[r][lead];
        if (!isZero(pivot)) {
            multiplyRow(result, r, 1 / pivot);
        }
        
        // Eliminate column
        for (let i = 0; i < rows; i++) {
            if (i !== r && !isZero(result[i][lead])) {
                addRowMultiple(result, r, i, -result[i][lead]);
            }
        }
        
        lead++;
    }
    
    return result;
}

// Check if matrix is identity (within tolerance)
function isIdentity(matrix, tolerance = 1e-10) {
    const n = matrix.length;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            const expected = (i === j) ? 1 : 0;
            if (!isZero(matrix[i][j] - expected, tolerance)) {
                return false;
            }
        }
    }
    return true;
}

// Calculate inverse using RREF
function computeInverse(A) {
    const n = A.length;
    
    // Augment matrix: [A | I]
    const augmented = augmentMatrix(A);
    
    // Apply RREF
    const rrefResult = rref(augmented);
    
    // Extract left and right halves
    const leftHalf = [];
    const rightHalf = [];
    
    for (let i = 0; i < n; i++) {
        leftHalf[i] = rrefResult[i].slice(0, n);
        rightHalf[i] = rrefResult[i].slice(n);
    }
    
    // Check if left half is identity matrix
    if (isIdentity(leftHalf)) {
        return rightHalf;
    } else {
        return null; // Matrix is singular
    }
}

// Format number for display
function formatNumber(num) {
    if (isZero(num)) {
        return '0';
    }
    // Round to 6 decimal places to avoid floating point errors
    const rounded = Math.round(num * 1000000) / 1000000;
    return rounded.toString();
}

// Display result
function displayResult(inverse) {
    const container = document.getElementById('result-container');
    
    if (inverse === null) {
        container.innerHTML = '<div class="error-message">The matrix is Singular.</div>';
        return;
    }
    
    let html = '<div class="success-message">✓ Matrix is invertible!</div>';
    html += '<h4 style="margin-bottom: 10px; color: #495057;">Inverse Matrix A⁻¹:</h4>';
    html += '<div class="result-matrix" style="grid-template-columns: repeat(' + matrixSize + ', 1fr);">';
    
    for (let i = 0; i < matrixSize; i++) {
        for (let j = 0; j < matrixSize; j++) {
            html += `<div class="result-cell">${formatNumber(inverse[i][j])}</div>`;
        }
    }
    
    html += '</div>';
    container.innerHTML = html;
}

// Main calculation function
function calculateInverse() {
    try {
        const matrix = getMatrix();
        
        // Validate matrix has values
        let hasValues = false;
        for (let i = 0; i < matrixSize; i++) {
            for (let j = 0; j < matrixSize; j++) {
                if (!isNaN(matrix[i][j]) && matrix[i][j] !== 0) {
                    hasValues = true;
                    break;
                }
            }
            if (hasValues) break;
        }
        
        if (!hasValues) {
            document.getElementById('result-container').innerHTML = 
                '<div class="error-message">Please enter matrix values before calculating.</div>';
            return;
        }
        
        const inverse = computeInverse(matrix);
        displayResult(inverse);
    } catch (error) {
        document.getElementById('result-container').innerHTML = 
            '<div class="error-message">Error: ' + error.message + '</div>';
        console.error('Error calculating inverse:', error);
    }
}

// Clear matrix
function clearMatrix() {
    for (let i = 0; i < matrixSize * matrixSize; i++) {
        document.getElementById(`cell-${i}`).value = '';
    }
    document.getElementById('result-container').innerHTML = 
        '<p class="placeholder">Enter a matrix and click "Calculate Inverse"</p>';
}

// Fill with random matrix
function fillExample() {
    const randomMatrix = [];
    
    // Generate random integers between -10 and 10
    for (let i = 0; i < matrixSize; i++) {
        randomMatrix[i] = [];
        for (let j = 0; j < matrixSize; j++) {
            // Random integer between -10 and 10
            randomMatrix[i][j] = Math.floor(Math.random() * 21) - 10;
        }
    }
    
    setMatrix(randomMatrix);
}
