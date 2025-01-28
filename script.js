const canvas = document.getElementById("drawCanvas");
const ctx = canvas.getContext("2d");
ctx.fillStyle = "black";
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.strokeStyle = "white";
ctx.lineWidth = 15;

const gameCanvas = document.getElementById("gameCanvas");
const gameCtx = gameCanvas.getContext("2d");

// Ajuster la taille du canvas du jeu pour qu'il couvre tout l'écran
gameCanvas.width = window.innerWidth;
gameCanvas.height = window.innerHeight;

// Variables du jeu
let asteroids = [];
let score = 0;
let userInput = null;

// Class pour gérer les boules (astéroïdes)
class Asteroid {
	constructor() {
		this.x = Math.random() * gameCanvas.width; // Position aléatoire en X
		this.y = 0; // Position de départ en haut
		this.radius = 20; // Rayon de la boule
		this.number = Math.floor(Math.random() * 10); // Nombre aléatoire entre 0 et 9
		this.speed = Math.random() * 2 + 0.5; // Vitesse de la chute
	}

	// Afficher la boule avec le numéro à l'intérieur
	draw(ctx) {
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
		ctx.fillStyle = "white";
		ctx.fill();
		ctx.stroke();
		ctx.fillStyle = "black";
		ctx.font = "16px Arial";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(this.number, this.x, this.y);
	}

	// Mettre à jour la position de la boule
	update() {
		this.y += this.speed;
	}

	// Vérifier si la boule touche le bas de l'écran
	isOutOfBounds() {
		return this.y - this.radius > gameCanvas.height;
	}

	// Vérifier si la boule a été "touchée" (détruite) par la réponse de l'utilisateur
	isHit(userInput) {
		return this.number === userInput;
	}
}

// Générer une nouvelle boule (astéroïde) toutes les 3 secondes
setInterval(() => {
	asteroids.push(new Asteroid());
}, 3000);

// Fonction pour mettre à jour et dessiner les boules
function updateGame() {
	gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height); // Effacer le canvas

	// Mettre à jour et dessiner toutes les boules
	asteroids.forEach((asteroid, index) => {
		asteroid.update();
		asteroid.draw(gameCtx);

		// Si la boule est sortie de l'écran, game over
		if (asteroid.isOutOfBounds()) {
			console.log("out of bounds");
			score -= 10; // Baisser le score
			asteroids.splice(index, 1); // Enlever la boule détruite
			document.getElementById("score").textContent = `Score: ${score}`;
		}

		// Supprimer les boules qui ont été détruites
		if (asteroid.isHit(userInput)) {
			asteroids.splice(index, 1); // Enlever la boule détruite
			score += 5; // Augmenter le score
			document.getElementById("score").textContent = `Score: ${score}`;
		}
	});

	requestAnimationFrame(updateGame); // Appeler la fonction de mise à jour à chaque frame
}

// Fonction pour commencer le jeu
function startGame() {
	asteroids = [];
	score = 0;
	document.getElementById("score").textContent = `Score: ${score}`;
	updateGame();
}

// Commencer le jeu au début
startGame();

const clearButton = document.getElementById("clearButton");
const predictButton = document.getElementById("predictButton");
const result = document.getElementById("result");
let drawing = false;

canvas.addEventListener("mousedown", () => (drawing = true));
canvas.addEventListener("mouseup", () => (drawing = false));
canvas.addEventListener("mousemove", draw);

clearButton.addEventListener("click", () => {
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
});

predictButton.addEventListener("click", async () => {
	const imageData = preprocessCanvas();
	const prediction = await predict(imageData);
	console.log(prediction);
	result.textContent = `Résultat : ${prediction}`;
});

function draw(event) {
	if (!drawing) return;
	ctx.fillStyle = "white";
	ctx.beginPath();
	ctx.arc(event.offsetX, event.offsetY, 10, 0, Math.PI * 2);
	ctx.fill();
}

function preprocessCanvas() {
	const tempCanvas = document.createElement("canvas");
	tempCanvas.width = 28;
	tempCanvas.height = 28;
	const tempCtx = tempCanvas.getContext("2d");

	tempCtx.drawImage(canvas, 0, 0, 28, 28);
	const imageData = tempCtx.getImageData(0, 0, 28, 28);
	const pixels = imageData.data;

	const input = new Float32Array(28 * 28);
	for (let i = 0; i < pixels.length; i += 4) {
		const grayscale =
			pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
		input[i / 4] = grayscale / 255.0;
	}

	return input;
}

async function predict(input) {
	// modèle ONNX
	const session = await ort.InferenceSession.create("./model.onnx");

	const tensor = new ort.Tensor("float32", input, [1, 1, 28, 28]);
	const outputs = await session.run({ input: tensor });
	console.log(outputs.output.data);
	const output = outputs.output.data;
	userInput = output.indexOf(Math.max(...output));

	return output.indexOf(Math.max(...output));
}
