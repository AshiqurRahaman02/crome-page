/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable no-tabs */
const date = new Date();
const h = date.getHours();

let greeting;

if (h >= 5 && h < 12) {
	greeting = "Good morning";
} else if (h >= 12 && h < 17) {
	greeting = "Good afternoon";
} else {
	greeting = "Good evening";
}
document.getElementById("greeting").innerText = greeting;

window.addEventListener("DOMContentLoaded", () => {
	const t = new Tree("canvas");
});

class Tree {
	constructor(qs) {
		this.C = document.querySelector(qs);
		this.c = this.C?.getContext("2d");
		this.S = window.devicePixelRatio;
		this.W = 800;
		this.H = 800;
		this.branches = [];
		this.darkTheme = false;
		this.debug = false;
		this.decaying = false;
		this.floorY = 800;
		this.fruit = [];
		this.gravity = 0.0098;
		this.loopDelay = 100;
		this.loopEnd = Utils.dateValue;
		this.maxGenerations = 10;

		if (this.C) this.init();
	}
	get allBranchesComplete() {
		const { branches, maxGenerations } = this;

		return (
			branches.filter((b) => {
				const isLastGen = b.generation === maxGenerations;
				return b.progress >= 1 && isLastGen;
			}).length > 0
		);
	}
	get allFruitComplete() {
		return !!this.fruit.length && this.fruit.every((f) => f.progress === 1);
	}
	get allFruitFalling() {
		return (
			!!this.fruit.length && this.fruit.every((f) => f.timeUntilFall <= 0)
		);
	}
	get debugInfo() {
		return [
			{ item: "Pixel Ratio", value: this.S },
			{ item: "Branches", value: this.branches.length },
			{ item: "Branches Complete", value: this.allBranchesComplete },
			{ item: "Decaying", value: this.decaying },
			{ item: "Fruit", value: this.fruit.length },
			{ item: "Fruit Complete", value: this.allFruitComplete },
		];
	}
	get lastGeneration() {
		const genIntegers = this.branches.map((b) => b.generation);
		return [...new Set(genIntegers)].pop();
	}
	get trunk() {
		return {
			angle: 0,
			angleInc: 20,
			decaySpeed: 0.0625,
			diameter: 10,
			distance: 120,
			distanceFade: 0.2,
			generation: 2,
			growthSpeed: 0.04,
			hadBranches: false,
			progress: 0,
			x1: 400,
			y1: 800,
			x2: 400,
			y2: 580,
		};
	}
	detectTheme(mq) {
		this.darkTheme = mq.matches;
	}
	draw() {
		const { c, W, H, debug, branches, fruit } = this;

		c.clearRect(0, 0, W, H);

		const foreground = `hsl(165, 69%, 55%)`;
		c.fillStyle = foreground;
		c.strokeStyle = foreground;

		// debug info
		if (debug === true) {
			const textX = 24;

			this.debugInfo.forEach((d, i) => {
				c.fillText(`${d.item}: ${d.value}`, textX, 24 * (i + 1));
			});
		}

		// branches
		branches.forEach((b) => {
			c.lineWidth = b.diameter;
			c.beginPath();
			c.moveTo(b.x1, b.y1);
			c.lineTo(
				b.x1 + (b.x2 - b.x1) * b.progress,
				b.y1 + (b.y2 - b.y1) * b.progress
			);
			c.stroke();
			c.closePath();
		});

		// fruit
		fruit.forEach((f) => {
			c.globalAlpha =
				f.decayTime < f.decayFrames ? f.decayTime / f.decayFrames : 1;
			c.beginPath();
			c.arc(f.x, f.y, f.r * f.progress, 0, 2 * Math.PI);
			c.fill();
			c.closePath();
			c.globalAlpha = 1;
		});
	}
	grow() {
		// start with the trunk
		if (
			!this.branches.length &&
			Utils.dateValue - this.loopEnd > this.loopDelay
		) {
			this.branches.push(this.trunk);
		}

		if (!this.allBranchesComplete) {
			this.branches.forEach((b) => {
				if (b.progress < 1) {
					// branch growth
					b.progress += b.growthSpeed;

					if (b.progress > 1) {
						b.progress = 1;

						// grow fruit if the generation is the last
						if (b.generation === this.maxGenerations) {
							this.fruit.push({
								decayFrames: 18,
								decayTime: 250,
								progress: 0,
								speed: 0.04,
								timeUntilFall: Utils.randomInt(0, 300),
								x: b.x2,
								y: b.y2,
								r: Utils.randomInt(4, 6),
								restitution: 0.1 * (1 - b.y2 / this.floorY),
								yVelocity: 0,
							});
						}
					}
				} else if (!b.hadBranches && b.generation < this.maxGenerations) {
					b.hadBranches = true;
					// create two new branches
					const lean = 5;
					const angleLeft =
						b.angle - (b.angleInc + Utils.randomInt(-lean, lean));
					const angleRight =
						b.angle + (b.angleInc + Utils.randomInt(-lean, lean));
					const distance = b.distance * (1 - b.distanceFade);
					const generation = b.generation + 1;

					const leftBranch = {
						angle: angleLeft,
						angleInc: b.angleInc,
						decaySpeed: b.decaySpeed,
						diameter: Math.floor(b.diameter * 0.9),
						distance,
						distanceFade: b.distanceFade,
						generation,
						growthSpeed: b.growthSpeed,
						hadBranches: false,
						progress: 0,
						x1: b.x2,
						y1: b.y2,
						x2: b.x2 + Utils.endPointX(angleLeft, distance),
						y2: b.y2 - Utils.endPointY(angleLeft, distance),
					};

					const rightBranch = { ...leftBranch };
					rightBranch.angle = angleRight;
					rightBranch.x2 = b.x2 + Utils.endPointX(angleRight, distance);
					rightBranch.y2 = b.y2 - Utils.endPointY(angleRight, distance);

					this.branches.push(leftBranch, rightBranch);
				}
			});
		}
		if (!this.allFruitComplete) {
			this.fruit.forEach((f) => {
				if (f.progress < 1) {
					f.progress += f.speed;

					if (f.progress > 1) f.progress = 1;
				}
			});
		}

		if (this.allBranchesComplete && this.allFruitComplete)
			this.decaying = true;
	}
	decay() {
		if (this.fruit.length) {
			// fruit fall
			this.fruit = this.fruit.filter((f) => f.decayTime > 0);

			this.fruit.forEach((f) => {
				if (f.timeUntilFall <= 0) {
					f.y += f.yVelocity;
					f.yVelocity += this.gravity;

					const bottom = this.floorY;

					if (f.y >= bottom) {
						f.y = bottom;
						f.yVelocity *= -f.restitution;
					}

					--f.decayTime;
				} else if (!f.decaying) {
					--f.timeUntilFall;
				}
			});
		}
		if (this.allFruitFalling || !this.fruit.length) {
			// branch decay
			this.branches = this.branches.filter((b) => b.progress > 0);

			this.branches.forEach((b) => {
				if (b.generation === this.lastGeneration)
					b.progress -= b.decaySpeed;
			});
		}
		if (!this.branches.length && !this.fruit.length) {
			// back to the trunk
			this.decaying = false;
			this.loopEnd = Utils.dateValue;
		}
	}
	init() {
		this.setupCanvas();
		this.setupThemeDetection();
		this.run();
	}
	run() {
		this.draw();

		if (this.decaying) this.decay();
		else this.grow();

		requestAnimationFrame(this.run.bind(this));
	}
	setupCanvas() {
		const { C, c, W, H, S } = this;

		// properly scale the canvas based on the pixel ratio
		C.width = W * S;
		C.height = H * S;
		C.style.width = "190px";
		C.style.height = "120%";
		c.scale(S, S);

		// set unchanging styles
		c.font = "16px sans-serif";
		c.lineCap = "round";
		c.lineJoin = "round";
	}
	setupThemeDetection() {
		if (window.matchMedia) {
			const mq = window.matchMedia("(prefers-color-scheme: dark)");
			this.detectTheme(mq);
			mq.addListener(this.detectTheme.bind(this));
		}
	}
}

class Utils {
	static get dateValue() {
		return +new Date();
	}
	static endPointX(angleInDeg, distance) {
		return Math.sin((angleInDeg * Math.PI) / 180) * distance;
	}
	static endPointY(angleInDeg, distance) {
		return Math.cos((angleInDeg * Math.PI) / 180) * distance;
	}
	static randomInt(min, max) {
		return min + Math.round(Math.random() * (max - min));
	}
}

/* =============== CLOCK =============== */
const hour = document.getElementById("clock-hour");
const minutes = document.getElementById("clock-minutes");
const sec = document.getElementById("clock-sec");

const clock = () => {
	const date = new Date();

	const hh = (date.getHours() / 12) * 360;
	const mm = (date.getMinutes() / 60) * 360;
	const ss = (date.getSeconds() / 60) * 360;

	hour.style.transform = `rotateZ(${hh + mm / 12}deg)`;
	minutes.style.transform = `rotateZ(${mm}deg)`;
	sec.style.transform = `rotateZ(${ss}deg)`;
};
setInterval(clock, 1000); // (Updates every 1s) 1000 = 1s

/* =============== TIME AND DATE TEXT =============== */
const dateDayWeek = document.getElementById("date-day-week");
const dateMonth = document.getElementById("date-month");
const dateDay = document.getElementById("date-day");
const dateYear = document.getElementById("date-year");
const textHour = document.getElementById("text-hour");
const textMinutes = document.getElementById("text-minutes");
const textAmPm = document.getElementById("text-ampm");

const clockText = () => {
	// We get the Date object
	const date = new Date();

	// We get the time and date
	const dayWeek = date.getDay();
	const month = date.getMonth();
	const day = date.getDate();
	const year = date.getFullYear();
	let hh = date.getHours();
	let mm = date.getMinutes();
	let ampm;

	// We get the days of the week and the months. (First day of the week Sunday)
	const daysWeek = [
		"Sunday",
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
	];
	const months = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec",
	];

	// We add the corresponding dates
	dateDayWeek.innerHTML = `${daysWeek[dayWeek]}`;
	dateMonth.innerHTML = `${months[month]}`;
	dateDay.innerHTML = `${day}, `;
	dateYear.innerHTML = year;

	// If hours is greater than 12 (afternoon), we subtract -12, so that it starts at 1 (afternoon)
	if (hh >= 12) {
		hh = hh - 12;
		ampm = "PM";
	} else {
		ampm = "AM";
	}

	textAmPm.innerHTML = ampm;

	// When it is 0 hours (early morning), we tell it to change to 12 hours
	if (hh === 0) {
		hh = 12;
	}

	// If hours is less than 10, add a 0 (01,02,03...09)
	if (hh < 10) {
		hh = `0${hh}`;
	}

	textHour.innerHTML = `${hh}:`;

	// If minutes is less than 10, add a 0 (01,02,03...09)
	if (mm < 10) {
		mm = `0${mm}`;
	}

	textMinutes.innerHTML = mm;
};
setInterval(clockText, 1000); // (Updates every 1s) 1000 = 1s

fetch("https://dummyjson.com/quotes/random")
	.then((response) => response.json())
	.then((data) => {
		let text = data.quote;
		const author = data.author;
		const q = author.split(" ");
		document.getElementById("quoteText").innerHTML = text;
		document.getElementById("quoteAuthor").innerHTML =
			"- " +
			`<a href="https://www.google.com/search?q=${q[0]}+${
				q[1]
			}" target="_blank">${q[0] + " " + q[1] || ""}</a>`;
	})
	.catch((error) => {
		console.log("Error:", error);
	});

const temperatureElement = document.getElementById("temperature");

// Replace 'YOUR_API_KEY' with your actual API key from OpenWeatherMap
const apiKey = "8b908a8f4e3018596a0c6ea121b4bd30";
const Location = "malda";

const url = `https://api.openweathermap.org/data/2.5/weather?q=${Location}&appid=${apiKey}&units=metric`;

const weatherImg = document.getElementById("weatherImg");
fetch(url)
	.then((response) => response.json())
	.then((data) => {
		const weather = data.weather[0].main;
		// console.log(weather)
		if (weather === "Clouds") {
			weatherImg.src = "./images/clouds.png";
		} else if (weather === "Clear") {
			weatherImg.src = "./images/clear.png";
		} else if (weather === "Rain") {
			weatherImg.src = "./images/rain.png";
		} else if (weather === "Drizzle") {
			weatherImg.src = "./images/drizzle.png";
		} else if (weather === "Mist") {
			weatherImg.src = "./images/mist.png";
		}
		const temperature = data.main.temp;
		temperatureElement.textContent = `| ${Math.floor(temperature)} °C`;
	})
	.catch((error) => {
		console.log("Error:", error);
		temperatureElement.textContent = "| 30 °C";
	});

const searchInput = document.querySelector("#search>input");
searchInput.addEventListener("change", (e) => {
	let url = e.target.value;

	if (url && isValidURL(url)) {
		window.open(url, "_blank");
	} else if (url) {
		url = url.trim().split(" ").join("+");
		window.open(`https://www.google.com/search?q=${url}`, "_blank");
		console.log(url);
	}
});

function isValidURL(url) {
	// Regular expression to validate URL format
	const urlPattern = new RegExp(
		"^(https?:\\/\\/)?" + // protocol
			"((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
			"((\\d{1,3}\\.){3}\\d{1,3}))" + // IP address
			"(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
			"(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
			"(\\#[-a-z\\d_]*)?$",
		"i"
	); // fragment locator

	return urlPattern.test(url);
}

function openNewTab() {
	const newTab = window.open("", "_blank");
	newTab.focus();
}

const primaryLinks = [
	{
		id: 1,
		href: "https://www.youtube.com/",
		imgSrc: "./images/youtube.svg",
		alt: "YouTube",
		name: "YouTube",
	},
	{
		id: 2,
		href: "https://www.linkedin.com/feed/",
		imgSrc: "./images/linkedin.svg",
		alt: "Linkedin",
		name: "Linkedin",
	},
	{
		id: 3,
		href: "https://github.com/",
		imgSrc: "./images/github.svg",
		alt: "GitHub",
		name: "GitHub",
	},
	{
		id: 4,
		href: "https://leetcode.com/problemset/all/",
		imgSrc: "./images/leetcode.svg",
		alt: "Leetcode",
		name: "Leetcode",
	},
	{
		id: 5,
		href: "https://codepen.io/following",
		imgSrc: "./images/codepen-icon.svg",
		alt: "Codepen",
		name: "Codepen",
	},
	{
		id: 6,
		href: "https://www.figma.com/",
		imgSrc: "./images/figma.png",
		alt: "Figma",
		name: "Figma",
	},
	{
		id: 7,
		href: "https://www.onenote.com/notebooks?auth=1",
		imgSrc: "./images/onenote.png",
		alt: "Onenote",
		name: "Onenote",
	},
	{
		id: 8,
		href: "https://slack.com/intl/en-in/",
		imgSrc: "./images/slack.svg",
		alt: "Slack",
		name: "Slack",
	},
	{
		id: 9,
		href: "https://chat.openai.com/",
		imgSrc: "./images/ChatGPT_logo.svg.png",
		alt: "ChatGPT",
		name: "ChatGPT",
	},
];

const linkContainer = document.getElementById("primary");

let primaryHtml = "";
primaryLinks.forEach((link) => {
	primaryHtml += `<a href=${link.href} id="link" target="_blank">
                <img src=${link.imgSrc} alt=${link.alt}>
                <h3>${link.name}</h3>
            </a>`;
});

linkContainer.innerHTML = primaryHtml;

const secondaryLinks = [
	{
		id: 1,
		href: "https://ashiqurrahaman02.github.io/",
		imgSrc: "./images/ashik.png",
		alt: "Ashiqur Rahaman Portfolio",
	},
	{
		id: 2,
		href: "https://excalidraw.com/",
		imgSrc: "https://excalidraw.com/favicon.ico",
		alt: "Excalidraw",
	},
	{
		id: 3,
		href: "https://web.whatsapp.com",
		imgSrc: "./images/whatsapp.png",
		alt: "WhatsApp",
	},
	{
		id: 4,
		href: "https://web.telegram.org/a/",
		imgSrc: "https://web.telegram.org/a/favicon.svg",
		alt: "Telegram",
	},
	{
		id: 5,
		href: "https://pomofocus.io/",
		imgSrc:
			"https://pomofocus.io/favicon.ico",
		alt: "Pomofocus",
	},
	{
		id: 6,
		href: "https://www.hackerrank.com/dashboard",
		imgSrc: "./images/hackerrank.svg",
		alt: "HackerRank",
	},
	{
		id: 7,
		href: "https://code-path-prep.vercel.app/",
		imgSrc: "./images/codepath-logo.png",
		alt: "CodePath",
	},
	{
		id: 8,
		href: "https://skill-craft.netlify.app/",
		imgSrc: "./images/skilcraft-logo.jpg",
		alt: "Skilcraft",
	},
	{
		id: 9,
		href: "https://sava-india.netlify.app/",
		imgSrc: "./images/sava.png",
		alt: "Sava India",
	},
	{
		id: 10,
		href: "https://textmate-india.netlify.app/",
		imgSrc: "./images/textmate.png",
		alt: "Textmate",
	},
	{
		id: 11,
		href: "https://tranquil-pegasus-5a340e.netlify.app/index.html",
		imgSrc: "./images/snapdeal.png",
		alt: "Snapdeal",
	},
	{
		id: 12,
		href: "https://dashing-hummingbird-6ae958.netlify.app/",
		imgSrc: "./images/mamababy.png",
		alt: "MamaBaby",
	},
];

const secondaryContainer = document.getElementById("secondary");

let secondaryHtml = "";
secondaryLinks.forEach((link) => {
	secondaryHtml += `
        <a href="${link.href}" target="_blank" title="${link.alt}">
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#ffffff88"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z"/></svg>
            <img src="${link.imgSrc}" alt="${link.alt}" class="${link.alt}">
        </a>`;
});

secondaryContainer.innerHTML = secondaryHtml;

window.addEventListener("keydown", (event) => {
	const key = parseInt(event.key);
	if (key == 0) {
		window.open("https://mail.google.com/mail/u/0/#inbox", "_blank");
	} else if (key >= 1 && key <= 9) {
		if (event.ctrlKey) {
			const link = secondaryLinks.find((link) => link.id === key);
			if (link) {
				window.open(link.href, "_blank");
			}
		} else {
			const link = primaryLinks.find((link) => link.id === key);
			if (link) {
				window.open(link.href, "_blank");
			}
		}
	}
});

// const todoList = document.getElementById("todolist");

// todoList.innerHTML = `<iframe src="http://localhost:3000/todolist/iframe" title="My Iframe Content" width="370px"></iframe>`

const timers = {}; // Object to keep track of each timer's interval and state
let activeTimerKey = null; // Track currently active timer

function toggleTimer(button) {
	const label = button.querySelector(".timer-label");
	const playIcon = button.querySelector(".play-icon");
	const timeKey = button.dataset.time;

	// Check if another timer is running and stop it
	if (activeTimerKey && activeTimerKey !== timeKey) {
		clearInterval(timers[activeTimerKey].interval);
		const activeButton = document.querySelector(
			`[data-time="${activeTimerKey}"]`
		);
		const activeIcon = activeButton.querySelector(".play-icon");
		activeIcon.textContent = "▶️";
		timers[activeTimerKey].isRunning = false;
	}

	// Toggle the selected timer's state
	if (timers[timeKey]?.isRunning) {
		clearInterval(timers[timeKey].interval);
		timers[timeKey].isRunning = false;
		playIcon.textContent = "▶️";
		playIcon.title = "Play timer";
	} else {
		if (!timers[timeKey]) {
			timers[timeKey] = {
				remainingTime: parseInt(timeKey),
				isRunning: true,
			};
		} else {
			timers[timeKey].isRunning = true;
		}
		playIcon.textContent = "⏸️";
		playIcon.title = "Pause timer";
		activeTimerKey = timeKey;

		timers[timeKey].interval = setInterval(() => {
			if (timers[timeKey].remainingTime > 0) {
				timers[timeKey].remainingTime--;
				const minutes = Math.floor(timers[timeKey].remainingTime / 60);
				const seconds = timers[timeKey].remainingTime % 60;
				label.textContent = `${minutes
					.toString()
					.padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
			} else {
				clearInterval(timers[timeKey].interval);
				playIcon.textContent = "▶️";
				label.textContent = "00:00";
				timers[timeKey].isRunning = false;
				activeTimerKey = null;
			}
		}, 1000);
	}
}

function resetTimer(event, resetIcon) {
	event.stopPropagation(); // Prevent triggering the toggle on reset

	const button = resetIcon.closest(".timer-button");
	const label = button.querySelector(".timer-label");
	const playIcon = button.querySelector(".play-icon");
	const timeKey = button.dataset.time;

	// Stop the timer if it's running
	if (timers[timeKey]?.isRunning) {
		clearInterval(timers[timeKey].interval);
		timers[timeKey].isRunning = false;
		activeTimerKey = null;
	}

	// Reset the timer display and icon
	timers[timeKey].remainingTime = parseInt(timeKey);
	playIcon.textContent = "▶️";
	const minutes = Math.floor(timers[timeKey].remainingTime / 60);
	const seconds = timers[timeKey].remainingTime % 60;
	label.textContent = `${minutes.toString().padStart(2, "0")}:${seconds
		.toString()
		.padStart(2, "0")}`;
}
