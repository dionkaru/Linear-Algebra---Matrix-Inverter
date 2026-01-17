// Matrix Inverter using RREF Algorithm

let matrixSize = 3;
let currentInverse = null; // Store the current inverse matrix
let displayFormat = 'decimal'; // 'decimal' or 'fraction'

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
    
    // Helper function to check if a string is a valid number
    function isValidNumber(str) {
        if (str === '' || str === '-' || str === '.') return true; // Allow partial input
        // Match: optional minus, digits, optional decimal point and digits
        // Does not allow: scientific notation (e/E), plus sign, multiple decimal points, etc.
        return /^-?\d*\.?\d*$/.test(str);
    }
    
    // Helper function to sanitize input value
    function sanitizeNumericInput(value) {
        // Remove all non-numeric characters except minus sign and decimal point
        // Minus sign only allowed at the start
        let sanitized = value.replace(/[^\d.-]/g, '');
        // Remove minus signs that are not at the start
        if (sanitized.indexOf('-') > 0) {
            sanitized = sanitized.replace(/-/g, '');
        }
        // Keep only the first decimal point
        const parts = sanitized.split('.');
        if (parts.length > 2) {
            sanitized = parts[0] + '.' + parts.slice(1).join('');
        }
        return sanitized;
    }

    for (let i = 0; i < matrixSize * matrixSize; i++) {
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'matrix-input-cell';
        input.id = `cell-${i}`;
        input.step = 'any';
        input.value = '';
        
        // Prevent entering any non-numeric characters
        input.addEventListener('keydown', function(e) {
            // Allow navigation and control keys
            const allowedKeys = [
                8,   // Backspace
                9,   // Tab
                13,  // Enter
                27,  // Escape
                35,  // End
                36,  // Home
                37,  // Left arrow
                38,  // Up arrow
                39,  // Right arrow
                40,  // Down arrow
                46,  // Delete
                110, // Decimal point (numpad)
                190, // Decimal point
                189, // Minus sign
                109  // Minus sign (numpad)
            ];
            
            // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
            if (e.ctrlKey && [65, 67, 86, 88, 90].includes(e.keyCode)) {
                return;
            }
            
            // Allow navigation keys
            if (allowedKeys.includes(e.keyCode)) {
                // Special handling for minus sign - only allow at start
                if ((e.keyCode === 189 || e.keyCode === 109) && this.selectionStart !== 0) {
                    e.preventDefault();
                    return false;
                }
                return;
            }
            
            // Allow numbers (0-9) from main keyboard and numpad
            if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105)) {
                return;
            }
            
            // Block everything else (letters, special characters, etc.)
            e.preventDefault();
            return false;
        });
        
        // Validate and sanitize on input
        input.addEventListener('input', function(e) {
            let value = e.target.value;
            const cursorPosition = this.selectionStart;
            
            // Sanitize the input
            const sanitized = sanitizeNumericInput(value);
            
            // If value changed, update it
            if (sanitized !== value) {
                this.value = sanitized;
                // Restore cursor position (adjust for removed characters)
                const newPosition = Math.max(0, cursorPosition - (value.length - sanitized.length));
                this.setSelectionRange(newPosition, newPosition);
            }
        });
        
        // Validate pasted content
        input.addEventListener('paste', function(e) {
            e.preventDefault();
            const paste = (e.clipboardData || window.clipboardData).getData('text');
            const pastedValue = paste.trim();
            
            // Check if pasted value is a valid number
            if (pastedValue === '' || isValidNumber(pastedValue)) {
                // Get current value and selection
                const currentValue = this.value;
                const start = this.selectionStart;
                const end = this.selectionEnd;
                
                // Replace selected text with pasted value
                const newValue = currentValue.substring(0, start) + pastedValue + currentValue.substring(end);
                const sanitized = sanitizeNumericInput(newValue);
                
                // Update value
                this.value = sanitized;
                
                // Set cursor position after pasted content
                const newPosition = Math.min(start + pastedValue.length, sanitized.length);
                this.setSelectionRange(newPosition, newPosition);
            }
        });
        
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

// Multiply a row by a scalar (optimized)
function multiplyRow(matrix, row, scalar) {
    const rowArray = matrix[row];
    const length = rowArray.length;
    // Avoid unnecessary operations if scalar is 1
    if (Math.abs(scalar - 1.0) < 1e-15) {
        return;
    }
    for (let j = 0; j < length; j++) {
        rowArray[j] *= scalar;
    }
}

// Add a multiple of one row to another (optimized with better precision)
function addRowMultiple(matrix, sourceRow, targetRow, scalar) {
    // Avoid unnecessary operations if scalar is 0
    if (Math.abs(scalar) < 1e-15) {
        return;
    }
    const sourceRowArray = matrix[sourceRow];
    const targetRowArray = matrix[targetRow];
    const length = targetRowArray.length;
    for (let j = 0; j < length; j++) {
        const newValue = targetRowArray[j] + scalar * sourceRowArray[j];
        // Round to integer if very close (helps preserve integer arithmetic)
        targetRowArray[j] = roundToInteger(newValue, 1e-12);
    }
}

// Check if a value is close to zero (handling floating point errors)
function isZero(value, tolerance = 1e-10) {
    return Math.abs(value) < tolerance;
}

// Check if a value is very close to an integer and round it
function roundToInteger(value, tolerance = 1e-8) {
    const rounded = Math.round(value);
    if (Math.abs(value - rounded) < tolerance) {
        return rounded;
    }
    return value;
}

// Rationalize a matrix - round values that are very close to integers
function rationalizeMatrix(matrix, tolerance = 1e-8) {
    const result = [];
    for (let i = 0; i < matrix.length; i++) {
        result[i] = [];
        for (let j = 0; j < matrix[i].length; j++) {
            const value = matrix[i][j];
            // First check if it's zero
            if (isZero(value, tolerance)) {
                result[i][j] = 0;
            } else {
                // Round to integer if very close
                result[i][j] = roundToInteger(value, tolerance);
            }
        }
    }
    return result;
}

// Find the best pivot (partial pivoting for numerical stability)
function findPivot(matrix, startRow, col, tolerance = 1e-10) {
    let maxRow = startRow;
    let maxVal = Math.abs(matrix[startRow][col]);
    
    for (let i = startRow + 1; i < matrix.length; i++) {
        const absVal = Math.abs(matrix[i][col]);
        if (absVal > maxVal) {
            maxVal = absVal;
            maxRow = i;
        }
    }
    
    // Return -1 if no valid pivot found
    if (maxVal < tolerance) {
        return -1;
    }
    
    return maxRow;
}

// Check if matrix appears to contain only integers (within tolerance)
function isIntegerMatrix(matrix, tolerance = 1e-8) {
    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[i].length; j++) {
            const value = matrix[i][j];
            if (!isZero(value, tolerance)) {
                const rounded = Math.round(value);
                if (Math.abs(value - rounded) > tolerance) {
                    return false;
                }
            }
        }
    }
    return true;
}

// Convert matrix to RREF (Reduced Row Echelon Form)
function rref(matrix, tolerance = 1e-10) {
    // Create a deep copy to avoid mutating the original
    const rows = matrix.length;
    const cols = matrix[0].length;
    const result = matrix.map(row => [...row]);
    
    // Check if input matrix is integer matrix for better handling
    const isInteger = isIntegerMatrix(result, 1e-8);
    const intTolerance = isInteger ? 1e-10 : tolerance;
    
    let lead = 0;
    
    for (let r = 0; r < rows; r++) {
        if (lead >= cols) {
            break;
        }
        
        // Find pivot using partial pivoting for better numerical stability
        const pivotRow = findPivot(result, r, lead, intTolerance);
        
        if (pivotRow === -1) {
            // No pivot in this column, move to next column
            lead++;
            r--; // Don't advance row
            continue;
        }
        
        // Swap rows if necessary
        if (pivotRow !== r) {
            swapRows(result, pivotRow, r);
        }
        
        // Normalize pivot row
        const pivot = result[r][lead];
        if (Math.abs(pivot) < intTolerance) {
            lead++;
            r--;
            continue;
        }
        
        // Normalize the pivot row to have 1 in the pivot position
        if (Math.abs(pivot - 1.0) > intTolerance) {
            multiplyRow(result, r, 1.0 / pivot);
            // Round to integer if working with integer matrix
            if (isInteger) {
                for (let j = 0; j < result[r].length; j++) {
                    result[r][j] = roundToInteger(result[r][j], 1e-10);
                }
            }
        }
        
        // Eliminate column entries above and below the pivot
        for (let i = 0; i < rows; i++) {
            if (i !== r) {
                const factor = result[i][lead];
                if (Math.abs(factor) > intTolerance) {
                    addRowMultiple(result, r, i, -factor);
                }
            }
        }
        
        lead++;
    }
    
    // Clean up near-zero values and round near-integer values
    const cleanupTolerance = isInteger ? 1e-10 : tolerance;
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const value = result[i][j];
            if (isZero(value, cleanupTolerance)) {
                result[i][j] = 0;
            } else {
                // Round to integer if very close (tighter tolerance for integer matrices)
                result[i][j] = roundToInteger(value, cleanupTolerance);
            }
        }
    }
    
    return result;
}

// Check if matrix is identity (within tolerance)
function isIdentity(matrix, tolerance = 1e-8) {
    const n = matrix.length;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            const expected = (i === j) ? 1 : 0;
            const diff = Math.abs(matrix[i][j] - expected);
            if (diff > tolerance) {
                return false;
            }
        }
    }
    return true;
}

// Check if matrix has full rank (all rows have pivots)
function hasFullRank(matrix, tolerance = 1e-8) {
    const n = matrix.length;
    for (let i = 0; i < n; i++) {
        let hasPivot = false;
        for (let j = 0; j < n; j++) {
            if (Math.abs(matrix[i][j]) > tolerance) {
                hasPivot = true;
                break;
            }
        }
        if (!hasPivot) {
            return false;
        }
    }
    return true;
}

// Calculate inverse using RREF
function computeInverse(A) {
    const n = A.length;
    
    // Early check: if matrix is empty or not square
    if (n === 0 || A[0].length !== n) {
        return null;
    }
    
    // Augment matrix: [A | I]
    const augmented = augmentMatrix(A);
    
    // Apply RREF with improved numerical stability
    const rrefResult = rref(augmented, 1e-10);
    
    // Extract left and right halves
    const leftHalf = [];
    const rightHalf = [];
    
    for (let i = 0; i < n; i++) {
        leftHalf[i] = rrefResult[i].slice(0, n);
        rightHalf[i] = rrefResult[i].slice(n);
    }
    
    // Check if left half is identity matrix (more robust check)
    if (isIdentity(leftHalf, 1e-8)) {
        // Rationalize the inverse matrix to handle integer results better
        // Use tighter tolerance for better integer detection
        let cleanedInverse = rationalizeMatrix(rightHalf, 1e-9);
        
        // Additional cleanup: set near-zero values to exactly zero and round integers
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                let value = cleanedInverse[i][j];
                
                // First, check if it's effectively zero
                if (isZero(value, 1e-10)) {
                    cleanedInverse[i][j] = 0;
                } else {
                    // Round to integer if very close (very tight tolerance for final cleanup)
                    value = roundToInteger(value, 1e-9);
                    
                    // One more pass: if still very close to integer, round it
                    const rounded = Math.round(value);
                    if (Math.abs(value - rounded) < 1e-9) {
                        cleanedInverse[i][j] = rounded;
                    } else {
                        cleanedInverse[i][j] = value;
                    }
                }
            }
        }
        
        return cleanedInverse;
    } else {
        // Additional check: verify if matrix has full rank
        if (!hasFullRank(leftHalf, 1e-8)) {
            return null; // Matrix is singular
        }
        return null; // Matrix is singular
    }
}

// Greatest Common Divisor
function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b !== 0) {
        const temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}

// Convert decimal to fraction
function decimalToFraction(decimal, tolerance = 1e-10) {
    if (isZero(decimal)) {
        return { numerator: 0, denominator: 1 };
    }
    
    // Handle very small numbers
    if (Math.abs(decimal) < tolerance) {
        return { numerator: 0, denominator: 1 };
    }
    
    let sign = decimal < 0 ? -1 : 1;
    decimal = Math.abs(decimal);
    
    // Find the best fraction approximation
    let bestNumerator = 0;
    let bestDenominator = 1;
    let bestError = Math.abs(decimal);
    
    const maxDenominator = 10000; // Limit denominator size
    
    for (let den = 1; den <= maxDenominator; den++) {
        const num = Math.round(decimal * den);
        const error = Math.abs(decimal - num / den);
        
        if (error < bestError) {
            bestError = error;
            bestNumerator = num;
            bestDenominator = den;
            
            if (error < tolerance) {
                break;
            }
        }
    }
    
    // Simplify the fraction
    const divisor = gcd(bestNumerator, bestDenominator);
    bestNumerator = bestNumerator / divisor;
    bestDenominator = bestDenominator / divisor;
    
    return {
        numerator: sign * bestNumerator,
        denominator: bestDenominator
    };
}

// Format number for display
function formatNumber(num, format = 'decimal') {
    // First, round to integer if very close
    const roundedNum = roundToInteger(num, 1e-10);
    
    if (isZero(roundedNum)) {
        return format === 'fraction' ? '0' : '0';
    }
    
    if (format === 'fraction') {
        const fraction = decimalToFraction(roundedNum);
        if (fraction.denominator === 1) {
            return fraction.numerator.toString();
        }
        // Handle negative fractions
        if (fraction.numerator < 0) {
            return `-${Math.abs(fraction.numerator)}/${fraction.denominator}`;
        }
        return `${fraction.numerator}/${fraction.denominator}`;
    } else {
        // Check if it's effectively an integer
        if (Math.abs(roundedNum - Math.round(roundedNum)) < 1e-10) {
            return Math.round(roundedNum).toString();
        }
        // Round to 6 decimal places to avoid floating point errors
        const rounded = Math.round(roundedNum * 1000000) / 1000000;
        // Remove trailing zeros
        return rounded.toString().replace(/\.?0+$/, '');
    }
}

// Display result
function displayResult(inverse) {
    const container = document.getElementById('result-container');
    const toggleButton = document.getElementById('format-toggle');
    
    if (inverse === null) {
        container.innerHTML = '<div class="error-message">The matrix is Singular.</div>';
        toggleButton.style.display = 'none';
        currentInverse = null;
        return;
    }
    
    // Store the inverse matrix
    currentInverse = inverse;
    
    // Show toggle button
    toggleButton.style.display = 'inline-block';
    updateFormatButton();
    
    renderResult();
}

// Render the result in the current format
function renderResult() {
    if (currentInverse === null) return;
    
    const container = document.getElementById('result-container');
    
    let html = '<div class="success-message">✓ Matrix is invertible!</div>';
    html += '<h4 style="margin-bottom: 10px; color: #495057;">Inverse Matrix A⁻¹:</h4>';
    html += '<div class="result-matrix" style="grid-template-columns: repeat(' + matrixSize + ', 1fr);">';
    
    for (let i = 0; i < matrixSize; i++) {
        for (let j = 0; j < matrixSize; j++) {
            html += `<div class="result-cell">${formatNumber(currentInverse[i][j], displayFormat)}</div>`;
        }
    }
    
    html += '</div>';
    container.innerHTML = html;
}

// Toggle between decimal and fraction format
function toggleFormat() {
    displayFormat = displayFormat === 'decimal' ? 'fraction' : 'decimal';
    updateFormatButton();
    renderResult();
}

// Update the format toggle button text
function updateFormatButton() {
    const toggleButton = document.getElementById('format-toggle');
    if (toggleButton) {
        toggleButton.textContent = displayFormat === 'decimal' ? 'Switch to Fraction' : 'Switch to Decimal';
    }
}

// Validate matrix input
function validateMatrix(matrix) {
    const n = matrix.length;
    
    // Check if matrix is square
    for (let i = 0; i < n; i++) {
        if (!matrix[i] || matrix[i].length !== n) {
            return { valid: false, message: 'Matrix must be square (n×n).' };
        }
    }
    
    // Check if matrix has at least some non-zero values
    let hasValues = false;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            const value = matrix[i][j];
            if (isNaN(value)) {
                return { valid: false, message: 'Matrix contains invalid values (NaN).' };
            }
            if (!isFinite(value)) {
                return { valid: false, message: 'Matrix contains infinite values.' };
            }
            if (value !== 0) {
                hasValues = true;
            }
        }
    }
    
    if (!hasValues) {
        return { valid: false, message: 'Matrix cannot be all zeros.' };
    }
    
    return { valid: true };
}

// Main calculation function
function calculateInverse() {
    try {
        const matrix = getMatrix();
        
        // Validate matrix
        const validation = validateMatrix(matrix);
        if (!validation.valid) {
            document.getElementById('result-container').innerHTML = 
                '<div class="error-message">' + validation.message + '</div>';
            const toggleButton = document.getElementById('format-toggle');
            if (toggleButton) toggleButton.style.display = 'none';
            return;
        }
        
        const inverse = computeInverse(matrix);
        displayResult(inverse);
    } catch (error) {
        document.getElementById('result-container').innerHTML = 
            '<div class="error-message">Error: ' + error.message + '</div>';
        const toggleButton = document.getElementById('format-toggle');
        if (toggleButton) toggleButton.style.display = 'none';
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
    const toggleButton = document.getElementById('format-toggle');
    if (toggleButton) toggleButton.style.display = 'none';
    currentInverse = null;
    displayFormat = 'decimal';
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
