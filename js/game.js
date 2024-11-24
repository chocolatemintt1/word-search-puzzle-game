// js/game.js
export class WordSearchPuzzle {
    constructor() {
        this.grid = [];
        this.size = 9; // Changed to 9x9
        this.words = [];
        this.foundWords = new Set();
        this.selectedCells = [];
        this.wordList = [
            'REACT', 'VUE', 'HTML', 'CSS',
            'JAVA', 'PHP', 'RUBY', 'NODE',
            'API', 'SQL', 'NEXT', 'WEB'
        ];
        this.directions = [
            [0, 1], // right
            [1, 0], // down
            [1, 1], // diagonal down-right
            [-1, 1], // diagonal up-right
        ];

        this.initializeDOM();
        this.setupEventListeners();
        this.newGame();
    }

    initializeDOM() {
        this.gridElement = document.getElementById('grid');
        this.wordListElement = document.getElementById('wordList');
        this.newGameButton = document.getElementById('newGame');
        this.foundCountElement = document.getElementById('foundCount');
        this.totalWordsElement = document.getElementById('totalWords');
    }

    setupEventListeners() {
        // Mouse events
        this.newGameButton.addEventListener('click', () => this.newGame());
        this.gridElement.addEventListener('mousedown', (e) => this.startSelection(e));
        this.gridElement.addEventListener('mouseover', (e) => this.continueSelection(e));
        document.addEventListener('mouseup', () => this.endSelection());

        // Touch events
        this.gridElement.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const cell = document.elementFromPoint(touch.clientX, touch.clientY);
            if (cell && cell.classList.contains('cell')) {
                this.startSelection({ target: cell });
            }
        });

        this.gridElement.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const cell = document.elementFromPoint(touch.clientX, touch.clientY);
            if (cell && cell.classList.contains('cell')) {
                this.continueSelection({ target: cell });
            }
        });

        this.gridElement.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.endSelection();
        });

        // Prevent zoom on double tap
        this.gridElement.addEventListener('dblclick', (e) => e.preventDefault());

        // Handle responsive layout
        const handleResize = () => {
            const isMobile = window.innerWidth <= 480;
            const isTablet = window.innerWidth <= 768 && window.innerWidth > 480;
            const cellSize = isMobile ? 28 : (isTablet ? 35 : 40);
            this.gridElement.style.gridTemplateColumns = `repeat(${this.size}, ${cellSize}px)`;
        };

        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(handleResize, 250);
        });

        window.addEventListener('orientationchange', () => {
            setTimeout(handleResize, 200);
        });

        // Initial size setup
        handleResize();
    }

    newGame() {
        this.grid = Array(this.size).fill().map(() => Array(this.size).fill(''));
        this.words = [];
        this.foundWords.clear();
        this.selectedCells = [];
        this.isSelecting = false;

        // Select 6 random words
        this.words = this.shuffleArray([...this.wordList]).slice(0, 6);

        // Place words and fill empty cells
        this.words.forEach(word => this.placeWord(word));
        this.fillEmptyCells();
        this.render();
        this.updateStats();
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    placeWord(word) {
        let placed = false;
        let attempts = 0;
        const maxAttempts = 100;

        while (!placed && attempts < maxAttempts) {
            const direction = this.directions[Math.floor(Math.random() * this.directions.length)];
            const startX = Math.floor(Math.random() * this.size);
            const startY = Math.floor(Math.random() * this.size);

            if (this.canPlaceWord(word, startX, startY, direction)) {
                this.placeWordAt(word, startX, startY, direction);
                placed = true;
            }
            attempts++;
        }
    }

    canPlaceWord(word, startX, startY, [dx, dy]) {
        if (startX + dx * (word.length - 1) >= this.size ||
            startX + dx * (word.length - 1) < 0 ||
            startY + dy * (word.length - 1) >= this.size ||
            startY + dy * (word.length - 1) < 0) {
            return false;
        }

        for (let i = 0; i < word.length; i++) {
            const x = startX + dx * i;
            const y = startY + dy * i;
            if (this.grid[y][x] !== '' && this.grid[y][x] !== word[i]) {
                return false;
            }
        }

        return true;
    }

    placeWordAt(word, startX, startY, [dx, dy]) {
        for (let i = 0; i < word.length; i++) {
            const x = startX + dx * i;
            const y = startY + dy * i;
            this.grid[y][x] = word[i];
        }
    }

    fillEmptyCells() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                if (this.grid[y][x] === '') {
                    this.grid[y][x] = letters[Math.floor(Math.random() * letters.length)];
                }
            }
        }
    }

    render() {
        this.gridElement.innerHTML = '';
        this.wordListElement.innerHTML = '';

        // Render grid
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                cell.textContent = this.grid[y][x];
                this.gridElement.appendChild(cell);
            }
        }

        // Render word list
        this.words.forEach(word => {
            const wordItem = document.createElement('div');
            wordItem.className = `word-item${this.foundWords.has(word) ? ' found' : ''}`;
            wordItem.textContent = word;
            this.wordListElement.appendChild(wordItem);
        });
    }

    startSelection(e) {
        const cell = e.target.closest('.cell');
        if (!cell) return;

        this.isSelecting = true;
        this.selectedCells = [cell];
        this.updateSelectedCells();
    }

    continueSelection(e) {
        if (!this.isSelecting) return;

        const cell = e.target.closest('.cell');
        if (!cell || this.selectedCells.includes(cell)) return;

        const firstCell = this.selectedCells[0];
        const dx = cell.dataset.x - firstCell.dataset.x;
        const dy = cell.dataset.y - firstCell.dataset.y;

        if (this.isValidDirection(dx, dy)) {
            this.selectedCells = this.getCellsInLine(
                parseInt(firstCell.dataset.x),
                parseInt(firstCell.dataset.y),
                parseInt(cell.dataset.x),
                parseInt(cell.dataset.y)
            );
            this.updateSelectedCells();
        }
    }

    endSelection() {
        if (!this.isSelecting) return;

        const word = this.getSelectedWord();
        if (this.words.includes(word) && !this.foundWords.has(word)) {
            this.foundWords.add(word);
            this.markFoundWord(word);
            this.updateStats();
        }

        this.isSelecting = false;
        this.selectedCells.forEach(cell => cell.classList.remove('selected'));
        this.selectedCells = [];
    }

    isValidDirection(dx, dy) {
        if (dx === 0 && dy === 0) return false;
        const length = Math.max(Math.abs(dx), Math.abs(dy));
        dx = dx / length || 0;
        dy = dy / length || 0;
        return this.directions.some(([x, y]) => x === dx && y === dy);
    }

    getCellsInLine(x1, y1, x2, y2) {
        const cells = [];
        const dx = Math.sign(x2 - x1);
        const dy = Math.sign(y2 - y1);
        const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));

        for (let i = 0; i <= steps; i++) {
            const x = x1 + dx * i;
            const y = y1 + dy * i;
            const cell = this.gridElement.querySelector(`[data-x="${x}"][data-y="${y}"]`);
            if (cell) cells.push(cell);
        }

        return cells;
    }

    getSelectedWord() {
        return this.selectedCells.map(cell => cell.textContent).join('');
    }

    updateSelectedCells() {
        document.querySelectorAll('.cell.selected').forEach(cell => {
            cell.classList.remove('selected');
        });
        this.selectedCells.forEach(cell => {
            cell.classList.add('selected');
        });
    }

    markFoundWord(word) {
        this.selectedCells.forEach(cell => {
            cell.classList.add('found');
        });
        document.querySelectorAll('.word-item').forEach(item => {
            if (item.textContent === word) {
                item.classList.add('found');
            }
        });
    }

    updateStats() {
        this.foundCountElement.textContent = this.foundWords.size;
        this.totalWordsElement.textContent = this.words.length;
    }
}