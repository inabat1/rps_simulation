class Game {

    constructor() {

        this.points = [];
        this.isRunning = false;
        this.stats = [0, 0, 0];

        EventEmitter.on("collide", (c1, c2) => {

            this.stats[c1.hand]--;
            this.stats[c2.hand]--;

            c1.hand = c2.hand = GameRule.getWinner(c1.hand, c2.hand);

            this.stats[c1.hand] += 2;
        });
    }

    addHandManually(x, y, hand){

        let pos = [x, y];
        let velocity = [Random.getOne([1, -1]), Random.getOne([1, -1])];

        this.points.push(new Particle(pos, velocity, hand));

        this.updateStats();
    }

    addChart(chart) {

        EventEmitter.on("init", () => {
            chart.setScaleForYAxis(0, this.points.length);
            // chart.update(this.stats);
        });

        EventEmitter.on("updatedStats", (stats) => {
            chart.setScaleForYAxis(0, this.points.length);
            chart.update(this.stats);
        });
    }

    updateStats(){

        this.stats = [0, 0, 0];

        for (const point of this.points) {
            this.stats[point.hand]++;
        }

        EventEmitter.emit("updatedStats", this.stats);
    }

    init(canvas, numberOfParticles) {

        this.points = [];

        let w = canvas.canvas.width / (Settings.radius * 2);
        let h = canvas.canvas.height / (Settings.radius * 2);

        for (let i = 1; i < w - 1; i++) {

            for (let j = 1; j < h - 1; j++) {

                let pos = [Settings.radius * 2 * i, Settings.radius * 2 * j];
                let velocity = [Random.getOne([1, -1]), Random.getOne([1, -1])];
                let hand = Random.getRandomInt(0, 2);

                let p = new Particle(pos, velocity, hand);

                this.points.push(p);
            }
        }

        this.points = Random.getSubArray(this.points, numberOfParticles);

        this.updateStats();

        EventEmitter.emit("init", this.stats);
    }

    playOrStop() {
        this.isRunning = !this.isRunning;
    }

    update(i) {

        if (!this.isRunning) {
            return;
        }

        let c1 = this.points[i];

        for (let j = i + 1; j < this.points.length; j++) {

            let c2 = this.points[j];

            Collision.verifyCollision(c1, c2);
        };

        if (Settings.sameSpeed) {

            let c = c1.velocity.norm();
            let a = c1.velocity[0];
            let b = c1.velocity[1];

            let sin = b / c;
            let cos = a / c;

            c1.velocity[0] = Settings.speed * cos;
            c1.velocity[1] = Settings.speed * sin;
        }

        Collision.findAllCollisionsWithWalls(this.points, i, canvas.canvas.width, canvas.canvas.height);

        c1.pos = c1.pos.sum(c1.velocity);

        EventEmitter.emit("updatedStats", this.stats);
    }

    draw(canvas) {

        canvas.cleanScreen();

        if (Settings.showGrid) {
            canvas.drawGrid();
        }

        for (let i = 0; i < this.points.length; i++) {

            this.update(i);
            this.points[i].draw(canvas.ctx);
        };
    }
}

class GameRule {

    static ROCK = 0;

    static PAPER = 1;

    static SCISSOR = 2;

    static getWinner(p1, p2) {

        if ((p1 + 1) % 3 == p2) {
            return p2;
        } else if (p1 == p2) {
            return p1;
        } else {
            return p1;
        }
    }
}

class Particle {

    constructor(pos, velocity, hand) {
        this.pos = pos;
        this.velocity = velocity;
        this.hand = hand;
        this.mass = 1.0;
    }

    draw(ctx) {

        const r = Settings.radius;

        let image = Canvas.ASSETS[this.hand];

        if (image) {
            ctx.drawImage(image, this.pos[0] - r / 2, this.pos[1] - r / 2, r * 2, r * 2);
        }
    }
}

Array.prototype.sum = function (v2) {

    if (this.length !== v2.length) {
        throw new Error("Different Length");
    }

    let r = new Array(this.length);

    for (let i = 0; i < this.length; i++) {
        r[i] = this[i] + v2[i];
    }

    return r;
};

Array.prototype.subtract = function (v2) {

    if (this.length !== v2.length) {
        throw new Error("Different Length");
    }

    let r = new Array(this.length);

    for (let i = 0; i < this.length; i++) {
        r[i] = this[i] - v2[i];
    }

    return r;
};

Array.prototype.norm = function () {

    let sum = 0.0;

    for (let i = 0; i < this.length; i++) {
        sum += Math.pow(this[i], 2);
    }

    return Math.sqrt(sum);
};

Array.prototype.unitVector = function () {

    let d = this.norm();

    let r = new Array(this.length);

    if (d != 0) {
        for (let i = 0; i < this.length; i++) {
            r[i] = this[i] / d;
        }
    }

    return r;
};

Array.prototype.scale = function (s) {

    let r = new Array(this.length);

    for (let i = 0; i < this.length; i++) {
        r[i] = this[i] * s;
    }

    return r;
};

Array.prototype.dot = function (v2) {

    if (this.length !== v2.length) {
        throw new Error("Different Length");
    }

    let sum = 0.0;

    for (let i = 0; i < this.length; i++) {
        sum += this[i] * v2[i];
    }

    return sum;
};

Array.prototype.copy = function () {

    let r = new Array(this.length);

    for (let i = 0; i < this.length; i++) {
        r[i] = this[i];
    }

    return r;
};

Array.prototype.range = function (startInclusive, endInclusive, step = 1) {

    let values = [];

    for (let i = startInclusive; i <= endInclusive; i += step) {
        values.push(i);
    }

    return values;
};

Array.prototype.removeByIndex = function (index) {

    if (index < 0 || index >= this.length) {
        throw new Error("Out of index");
    }

    let r = new Array();

    for (let i = 0; i < this.length; i++) {

        if (i !== index) {
            r.push(this[i]);
        }
    }

    return r;
};

Array.prototype.equalsTo = function (array) {

    if (this.length !== array.length) {
        throw new Error("Different Length");
    }

    for (let i = 0; i < this.length; i++) {

        if (this[i] !== array[i]) {
            return false;
        }
    }

    return true;
};

class Canvas {

    static ASSETS = {};

    constructor(canvasId) {

        const that = this;

        this.mouse = {x:0, y:0};
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d");

        this.canvas.addEventListener("mousemove", function (event) {
            that.onMouseMove(event);
        });

        this.canvas.addEventListener("mouseup", function (event) {
            EventEmitter.emit("canvas-mouse-up", that.mouse);
        });
    }

    onMouseMove(evt) {

        let rect = this.canvas.getBoundingClientRect();

        this.mouse = {
            x: (evt.clientX - rect.left),
            y: (evt.clientY - rect.top)
        };
    }

    setWidth(value) {
        this.canvas.width = value;
    }

    setHeight(value) {
        this.canvas.height = value;
    }

    cleanScreen() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    loadAsset(key, src) {
        this.loadImage(src, function (image) {
            Canvas.ASSETS[key] = image;
        });
    }

    loadImage(src, callback) {

        let image = new Image();

        image.src = src;

        image.onload = function () {
            callback(image);
        };
    }

    drawLine(x0, y0, x1, y1) {
        this.ctx.beginPath();
        this.ctx.lineWidth = 1;
        this.ctx.moveTo(x0, y0 + 0.5);
        this.ctx.lineTo(x1, y1 + 0.5);
        this.ctx.stroke();
    }

    drawGrid() {

        let diameter = Settings.radius * 2;

        let vLines = this.canvas.width / diameter;
        let hLines = this.canvas.height / diameter;

        for (let i = 0; i < vLines; i++) {
            this.drawLine(i * diameter, 0, i * diameter, this.canvas.height);
        }

        for (let i = 0; i < hLines; i++) {
            this.drawLine(0, i * diameter, this.canvas.width, i * diameter);
        }
    }
}

class Collision {

    static betweenTwoCircles(p1, p2, r1, r2) {

        let radius = r1 + r2;

        let n = p1.subtract(p2);

        if (n.norm() < radius) {
            return true;
        }

        return false;
    }

    static verifyCollision(c1, c2) {

        if (Collision.betweenTwoCircles(c1.pos, c2.pos, Settings.radius, Settings.radius)) {

            Collision.findCollisions(c1, c2);

            EventEmitter.emit("collide", c1, c2);
        }
    }

    static findCollisions(c1, c2) {


        let p1 = c1.pos;
        let p2 = c2.pos;

        let radius = Settings.radius + Settings.radius;

        let n = p1.subtract(p2);


        let dr = (radius - n.norm()) / 2;

        let un = n.unitVector();

        p1 = p1.sum(un.scale(dr));
        p2 = p2.sum(un.scale(-dr));

        c1.pos = p1;
        c2.pos = p2;

        let ut = [-un[1], un[0]];


        let v1 = c1.velocity;
        let v2 = c2.velocity;

        let v1n = un.dot(v1);
        let v1t = ut.dot(v1);
        let v2n = un.dot(v2);
        let v2t = ut.dot(v2);


        let m1 = c1.mass;
        let m2 = c2.mass;


        let v1nNew = (v1n * (m1 - m2) + 2.0 * m2 * v2n) / (m1 + m2);
        let v2nNew = (v2n * (m2 - m1) + 2.0 * m1 * v1n) / (m1 + m2);


        v1 = un.scale(v1nNew);
        v2 = ut.scale(v1t);

        c1.velocity = v1.sum(v2);

        v1 = un.scale(v2nNew);
        v2 = ut.scale(v2t);

        c2.velocity = v1.sum(v2);
    }

    static findAllCollisionsWithWalls(points, i, width, height) {

        let c = points[i];

        let radius = Settings.radius;
        let p1 = c.pos;
        let v1 = c.velocity;

        let left = 0;
        let top = 0;
        let right = width;
        let bottom = height;

        if (p1[0] < left + radius) {
            p1[0] = left + radius;
            v1[0] = -v1[0];
        }
        if (p1[1] < top + radius) {
            p1[1] = top + radius;
            v1[1] = -v1[1];
        }
        if (p1[0] > right - radius) {
            p1[0] = right - radius;
            v1[0] = -v1[0];
        }
        if (p1[1] > bottom - radius) {
            p1[1] = bottom - radius;
            v1[1] = -v1[1];
        }

        c.x = p1[0];
        c.y = p1[1];

        c.velocity = v1;
    }
}


class EventEmitter {

    static callbacks = {};

    static on(event, cb) {

        if (!EventEmitter.callbacks[event]) {
            EventEmitter.callbacks[event] = [];
        }

        EventEmitter.callbacks[event].push(cb);
    }

    static emit(event, ...data) {

        let cbs = EventEmitter.callbacks[event];

        if (cbs) {
            cbs.forEach(cb => cb(...data));
        }
    }
}

class MyChart {

    constructor(elementId) {

        const ctx = document.getElementById(elementId);

        this.chart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: ["Rock", "Paper", "Scissor"],
                datasets: [{
                    data: [0, 0, 0],
                    borderWidth: 1
                }]
            },
            options: {
                plugins: {
                    legend: {
                        display: false
                    },
                },
                scales: {
                    y: {
                        min: 0,
                        max: 100,
                    }
                }
            }
        });
    }

    setScaleForYAxis(newMin, newMax) {

        if (this.chart.options.scales.y.min != newMin) {
            this.chart.options.scales.y.min = newMin;
            this.chart.update();
        }
        if (this.chart.options.scales.y.max != newMax) {
            this.chart.options.scales.y.max = newMax;
            this.chart.update();
        }
    }

    update(newData) {

        let currentData = this.chart.data.datasets[0].data;

        if (!currentData.equalsTo(newData)) {
            this.chart.data.datasets[0].data = newData.copy();
            this.chart.update();
        }
    }
}

class Random {

    static chance = new Chance();

    static setSeed(value) {
        Random.chance = new Chance(value);
    }

    static getRandomInt(min, max) {
        return Random.chance.integer({ min, max });
    }

    static getSubArray(array, quantity) {
        return Random.chance.pickset(array, quantity);
    }

    static getOne(array) {
        return Random.chance.pickone(array);
    }
}

class Settings {

    static particles = 50;

    static radius = 10;

    static speed = 3;
   
}

let game;
let canvas;
let chart;
let addManually = -1;
let sound = new Audio("resources/song.mp3");

function resizeWindow() {

    const $mainPanel = $(".main-panel");

    canvas.setWidth($mainPanel.width());
    canvas.setHeight($(window).height() - $mainPanel.offset().top - 16);

    $(".side-panel .card").height(canvas.canvas.height);
}

$(function () {

    chart = new MyChart("chart");

    game = new Game();
    game.addChart(chart);

    canvas = new Canvas("canvas");

    canvas.loadAsset(GameRule.PAPER, "resources/paper.png");
    canvas.loadAsset(GameRule.ROCK, "resources/rock.png");
    canvas.loadAsset(GameRule.SCISSOR, "resources/scissors.png");

    EventEmitter.on("canvas-mouse-up", (mouse) => {

        if(addManually == -1){
            return;
        }

        //game.addHandManually(mouse.x, mouse.y, addManually);
    });

    $(window).resize(resizeWindow).trigger("resize");

    game.init(canvas, Settings.particles);

    function repeatOften() {

        game.draw(canvas);

        requestAnimationFrame(repeatOften);
    }

    requestAnimationFrame(repeatOften);

    $("#btn-play-stop").click(function () {

        game.playOrStop();
        if (!sound.paused){
            sound.pause();
        }else{
            sound.play();
        }
        $(this).find("span").html(game.isRunning ? "Stop" : "Start");

        $(this).find("i")
            .toggleClass("bi-play-fill", !game.isRunning)
            .toggleClass("bi-stop-fill", game.isRunning);
    });

   

});