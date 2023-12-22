const BLOCK_SIZE = 30
const BOARD_WIDTH = 9
const BOARD_HEIGHT = 9
const MINES_NUMBER = 10
const NUMBER_FONT = 20
const NUMBER_COLOR = [
  { number: 1, color: '#1502fe' },
  { number: 2, color: '#0a7f07' },
  { number: 3, color: '#fb0900' },
  { number: 4, color: '#050080' },
  { number: 5, color: '#800001' },
]

let FLAGS_NUMER = MINES_NUMBER

let flagImage = new Image()
flagImage.src = './red-flag.png'

let mineImage = new Image()
mineImage.src = './mine.png'

let gameOver = false
let gameStart = false
let animacionID

let logicDashBorad
let showDashBorad
let minesPosition = []
let timeInterval

let canvas
let context

let imageFaceIcon = document.getElementById('face-icon')

// Función para encender segmentos según el número
const segmentsUnits = document.getElementsByClassName('segment-units')
const segmentsTens = document.getElementsByClassName('segment-ten')
const segmentsHundreds = document.getElementsByClassName('segment-hundred')

const segmentsFlagsUnits = document.getElementsByClassName('segment-units-flags')
const segmentsFlagsTens = document.getElementsByClassName('segment-ten-flags')
const segmentsFlagsHundreds = document.getElementsByClassName('segment-hundred-flags')

// Mapa de segmentos para cada número del 0 al 9
const segmentMap = [
  [1, 1, 1, 1, 1, 1, 0], // 0
  [0, 1, 1, 0, 0, 0, 0], // 1
  [1, 1, 0, 1, 1, 0, 1], // 2
  [1, 1, 1, 1, 0, 0, 1], // 3
  [0, 1, 1, 0, 0, 1, 1], // 4
  [1, 0, 1, 1, 0, 1, 1], // 5
  [1, 0, 1, 1, 1, 1, 1], // 6
  [1, 1, 1, 0, 0, 0, 0], // 7
  [1, 1, 1, 1, 1, 1, 1], // 8
  [1, 1, 1, 1, 0, 1, 1], // 9
]

// 1. Crear carvas
function createCanvas() {
  canvas = document.getElementById('canvas')
  context = canvas.getContext('2d')
  canvas.width = BLOCK_SIZE * BOARD_WIDTH
  canvas.height = BLOCK_SIZE * BOARD_HEIGHT
}

// 2. Crear tablero lógico
function createDashBorad(isLogic) {
  const newDashBoard = new Array(BOARD_HEIGHT)
    .fill(0)
    .map((col, i) => new Array(BOARD_WIDTH).fill(isLogic ? 0 : -2))
  return newDashBoard
}

// 2. Anadir evento para el click
function onClick(event) {
  if (!gameStart) {
    actualizarDisplay()
  }
  gameStart = true
  let rect = this.getBoundingClientRect()
  let x = event.clientX - rect.left
  let y = event.clientY - rect.top

  const fil = Math.floor(y / BLOCK_SIZE)
  const col = Math.floor(x / BLOCK_SIZE)

  if (showDashBorad[fil][col] == -3) {
    event.preventDefault()
  } else {
    showDashBorad[fil][col] = logicDashBorad[fil][col]
    if (logicDashBorad[fil][col] == 0) {
      cleanBlankPositions(fil, col)
    }
    if (logicDashBorad[fil][col] == -1) {
      logicDashBorad[fil][col] = -10
      gameOver = true
    }
  }
  console.log('showDashBorad: ', showDashBorad)
}

// 3. Agregar banderas al tablero
function onRightClick(event) {
  if (!gameStart) {
    actualizarDisplay()
  }
  gameStart = true

  event.preventDefault()
  let rect = this.getBoundingClientRect()
  let x = event.clientX - rect.left
  let y = event.clientY - rect.top

  const fil = Math.floor(y / BLOCK_SIZE)
  const col = Math.floor(x / BLOCK_SIZE)

  if (showDashBorad[fil][col] == -3) {
    showDashBorad[fil][col] = -2
    FLAGS_NUMER++
  } else {
    if (showDashBorad[fil][col] == -2) {
      if (FLAGS_NUMER) {
        showDashBorad[fil][col] = -3
        FLAGS_NUMER--
      }
    }
  }
}

// 3. Game Loop
async function update() {
  draw()
  animacionID = window.requestAnimationFrame(update)
  encenderNumero(FLAGS_NUMER % 10, segmentsFlagsUnits)
  encenderNumero(Math.floor(FLAGS_NUMER / 10), segmentsFlagsTens)
  encenderNumero(Math.floor(FLAGS_NUMER / 100), segmentsFlagsHundreds)
  if (gameOver) {
    imageFaceIcon.src = './cross.png'
    drawMinesInDashBoard()
    window.cancelAnimationFrame(animacionID)
    clearInterval(timeInterval)
  }
  const isWameWon = await gameWon()
  if (!isWameWon) {
    imageFaceIcon.src = './sunglasses.png'
    clearInterval(timeInterval)
  }
}

function draw() {
  context.fillStyle = '#c0c0c0'
  context.fillRect(0, 0, BLOCK_SIZE * BOARD_WIDTH, BLOCK_SIZE * BOARD_HEIGHT)
  drawBlocksInDashboard()
}

// 4. Dibujar Bloques en el tablero
function drawBlocksInDashboard() {
  showDashBorad.forEach((row, x) =>
    row.forEach((col, y) => {
      switch (col) {
        // Hit mine
        case -1:
          {
            context.fillStyle = 'red'
            context.fillRect(y * BLOCK_SIZE, x * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE)
            addImgToTheDashboard(mineImage, y, x)
            const explosion = document.getElementById('explosion')
            explosion.volume = 0.25
            explosion.play()
          }
          break
        // Add image flag
        case -3:
          {
            addImgToTheDashboard(flagImage, y, x)
          }
          break
        case 0:
          {
            // TODO
          }
          break
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
          {
            context.fillStyle = '#c0c0c0'
            context.fillRect(y * BLOCK_SIZE, x * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE)
            context.font = `bold ${NUMBER_FONT}px Arial`
            context.textAlign = 'center'
            context.fillStyle = NUMBER_COLOR.find(color => color.number == col).color

            // Dibuja el texto en el canvas
            context.fillText(
              col,
              y * BLOCK_SIZE + BLOCK_SIZE / 2,
              x * BLOCK_SIZE + NUMBER_FONT + 2,
            )
          }
          break
        default: {
          context.fillStyle = '#e6e6e6'
          context.fillRect(y * BLOCK_SIZE, x * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE)
        }
      }
      context.strokeStyle = '#00000080'
      context.strokeRect(y * BLOCK_SIZE, x * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE)
    }),
  )
}

// 5 Generar minas aleatoriamente
function generateMines() {
  for (let i = 0; i < MINES_NUMBER; ) {
    let x = Math.floor(Math.random() * BOARD_WIDTH)
    let y = Math.floor(Math.random() * BOARD_HEIGHT)
    if (logicDashBorad[y][x] !== -1) {
      logicDashBorad[y][x] = -1
      minesPosition.push({ fil: x, col: y })
      // Setea los numeros guía en el tablero
      for (let fil = y - 1; fil <= y + 1; fil++) {
        for (let col = x - 1; col <= x + 1; col++) {
          if (
            fil >= 0 &&
            col >= 0 &&
            fil < BOARD_HEIGHT &&
            col < BOARD_WIDTH &&
            logicDashBorad[fil][col] !== -1
          ) {
            logicDashBorad[fil][col] += 1
          }
        }
      }
      i++
    }
  }
  console.log('logicDashBorad: ', logicDashBorad)
  console.log('minesPosition: ', minesPosition)
}

// 7. Dibujar iconos en el tablero
function addImgToTheDashboard(imagen, x, y) {
  context.drawImage(imagen, x * BLOCK_SIZE + 5, y * BLOCK_SIZE + 5, 20, 20)
}

// 8. Dibujar todas las minas en el tablero
function drawMinesInDashBoard() {
  //limpiar las banderas del tablero
  showDashBorad.forEach((row, x) =>
    row.forEach((col, y) => {
      if (col == -3) {
        context.fillStyle = '#c0c0c0'
        context.fillRect(y * BLOCK_SIZE, x * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE)
        context.strokeStyle = '#808080'
        context.strokeRect(y * BLOCK_SIZE, x * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE)
      }
    }),
  )
  // Dibujar las minas
  logicDashBorad.forEach((row, x) =>
    row.forEach((col, y) => {
      if (col == -1) {
        addImgToTheDashboard(mineImage, y, x)
      }
    }),
  )
}

// 9. Iniciar partida
function startGame() {
  createCanvas()
  logicDashBorad = createDashBorad(true)
  showDashBorad = createDashBorad(false)
  document.getElementById('canvas').addEventListener('click', onClick)
  document.getElementById('canvas').addEventListener('contextmenu', onRightClick)
  imageFaceIcon.addEventListener('click', restartGame)
  generateMines()
  update()
}

// 10. Restart Game
function restartGame() {
  clearInterval(timeInterval)
  restartDisplaysegments(segmentsUnits)
  restartDisplaysegments(segmentsTens)
  restartDisplaysegments(segmentsHundreds)
  gameOver = false
  gameStart = false
  FLAGS_NUMER = MINES_NUMBER
  imageFaceIcon.src = './happy.png'
  startGame()
}

// 11. Autocompletar casillas vacías
function cleanBlankPositions(x, y) {
  // Setea los numeros guía en el tablero
  for (let fil = x - 1; fil <= x + 1; fil++) {
    for (let col = y - 1; col <= y + 1; col++) {
      if (fil >= 0 && col >= 0 && fil < BOARD_HEIGHT && col < BOARD_WIDTH) {
        if (logicDashBorad[fil][col] == 0 && showDashBorad[fil][col] !== 0) {
          if (showDashBorad[fil][col] == -3 && logicDashBorad[fil][col] >= 0) {
            FLAGS_NUMER++
          }
          showDashBorad[fil][col] = 0
          cleanBlankPositions(fil, col)
        } else {
          if (logicDashBorad[fil][col] !== -1) {
            if (showDashBorad[fil][col] == -3 && logicDashBorad[fil][col] >= 0) {
              FLAGS_NUMER++
            }
            showDashBorad[fil][col] = logicDashBorad[fil][col]
          }
        }
      }
    }
  }
}

// 12. Ganar el juego
function gameWon() {
  return showDashBorad.find((fil, x) => fil.find((col, y) => col == -2))
}

// 13. mostrar leds en la pantalla
function encenderNumero(numero, segments) {
  segmentMap[numero >= 10 ? numero % 10 : numero].forEach((num, index) => {
    if (num) {
      segments[index].classList.add('segment-on')
    } else {
      segments[index].classList.remove('segment-on')
    }
  })
}

// 14. iniciar y actualizar leds en la pantalla
function actualizarDisplay() {
  let segundos = 1
  timeInterval = setInterval(() => {
    if (segundos < 1000) {
      encenderNumero(segundos % 10, segmentsUnits)
      encenderNumero(Math.floor(segundos / 10), segmentsTens)
      encenderNumero(Math.floor(segundos / 100), segmentsHundreds)
    }
    segundos++
  }, 1000)
}

// 15. inicializar segmentos del display
function restartDisplaysegments(segment) {
  for (let i = 0; i < segment.length; i++) {
    segment[i].classList.add('segment-on')
  }
  segment[segment.length - 1].classList.remove('segment-on')
}

startGame()
