/**@type{HTMLCanvasElement} */

class Planet {
  constructor(game) {
    this.game = game;
    this.x = this.game.width * 0.5;
    this.y = this.game.height * 0.5;
    this.radius = 80;

    this.image = document.getElementById("planet");
  }
  draw(context) {
    context.beginPath();
    context.drawImage(this.image, this.x - 100, this.y - 100);
    if (this.game.debug) {
      context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      context.stroke();
    }
  }
}
class Player {
  constructor(game) {
    this.game = game;
    this.x = this.game.width * 0.5;
    this.y = this.game.height * 0.5;
    this.radius = 40;
    this.image = document.getElementById("player");
    this.angle = 0;
    this.aim;
  }
  draw(context) {
    context.save();
    context.beginPath();
    context.translate(this.x, this.y);
    context.rotate(this.angle);
    context.drawImage(this.image, -this.radius, -this.radius);
    if (this.game.debug) {
      context.arc(0, 0, this.radius, 0, Math.PI * 2);
      context.stroke();
    }
    context.restore();
  }
  update() {
    this.aim = this.game.calcAim(this.game.planet, this.game.pointer);
    this.x =
      this.game.planet.x +
      (this.game.planet.radius + this.radius) * this.aim[0];
    this.y =
      this.game.planet.y +
      (this.game.planet.radius + this.radius) * this.aim[1];
    this.angle = Math.atan2(this.aim[3], this.aim[2]);
  }
  shoot() {
    const projectile = this.game.getProjectile();
    if (projectile)
      projectile.start(
        this.x + this.radius * this.aim[0],
        this.y + this.radius * this.aim[1],
        this.aim[0],
        this.aim[1]
      );
  }
}

class Projectile {
  constructor(game) {
    this.game = game;
    this.x;
    this.y;
    this.radius = 5;
    this.free = true;
    this.speedX = 0;
    this.speedY = 0;
    this.speedModifier = 5;
  }
  start(x, y, speedX, speedY) {
    this.free = false;
    this.x = x;
    this.y = y;
    this.speedX = speedX;
    this.speedY = speedY;
  }
  reset() {
    this.free = true;
  }
  draw(context) {
    context.save();
    if (!this.free) {
      context.fillStyle = "gold";
      context.beginPath();
      context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }
  update() {
    if (!this.free) {
      this.x += this.speedX * this.speedModifier;
      this.y += this.speedY * this.speedModifier;
    }
    //reset projectile if outside canvas
    if (
      this.x > this.game.width ||
      this.x < 0 ||
      this.y > this.game.height ||
      this.y < 0
    ) {
      this.reset();
    }
  }
}

class Enemy {
  constructor(game) {
    this.game = game;
    this.x = 0;
    this.y = 0;
    this.radius = 40;
    this.width = this.radius * 2;
    this.height = this.radius * 2;
    this.free = true;
    this.speedModifier = Math.random() * 0.5 + 0.1;
    this.speedX = 0;
    this.speedY = 0;
    this.angle = 0;
    this.collided = false;
    this.gameOver = false;
  }
  start() {
    this.free = false;
    this.collided = false;
    this.frameX = 0;
    this.lives = this.maxLives;
    this.frameY = Math.floor(Math.random() * 4);
    if (Math.random() < 0.5) {
      this.x = Math.random() * this.game.width;
      this.y =
        Math.random() < 0.5 ? -this.radius : this.game.height + this.radius;
    } else {
      this.x =
        Math.random() < 0.5 ? -this.radius : this.game.width + this.radius;
      this.y = Math.random() * this.game.height + this.radius;
    }
    const aim = this.game.calcAim(this, this.game.planet);
    this.speedX = aim[0] * this.speedModifier;
    this.speedY = aim[1] * this.speedModifier;
    this.angle = Math.atan2(aim[3], aim[2]) + Math.PI * 0.5;
  }
  reset() {
    this.free = true;
  }
  hit(damage) {
    this.lives -= damage;
    if (this.lives >= 1) this.frameX++;
  }
  draw(context) {
    if (!this.free) {
      context.save();
      context.translate(this.x, this.y);
      context.rotate(this.angle);
      context.drawImage(
        this.image,
        this.frameX * this.width,
        this.frameY * this.height,
        this.width,
        this.height,
        -this.radius,
        -this.radius,
        this.width,
        this.height
      );
      if (this.game.debug) {
        context.beginPath();
        context.arc(0, 0, this.radius, 0, Math.PI * 2);
        context.stroke();
        context.fillText(this.lives, 0, 0);
      }
      context.restore();
    }
  }
  update() {
    if (!this.free) {
      this.x += this.speedX;
      this.y += this.speedY;

      //check collision enemy / planet
      if (this.game.checkCollision(this, this.game.planet) && this.lives >= 1) {
        this.lives = 0;
        this.speedX = 0;
        this.speedY = 0;
        this.collided = true;
        this.game.lives--;
      }
      //check collision enemy / player
      if (this.game.checkCollision(this, this.game.player) && this.lives >= 1) {
        this.lives = 0;
        this.collided = true;
        this.game.lives--;
      }
      //check collision enemy / projectile
      this.game.projectilePool.forEach((projectile) => {
        if (
          !projectile.free &&
          this.game.checkCollision(this, projectile) &&
          this.lives >= 1
        ) {
          projectile.reset();
          this.hit(1);
        }
      });
      // sprite animation
      if (this.lives < 1 && this.game.spriteUpdate) {
        this.frameX++;
      }
      if (this.frameX > this.maxFrames) {
        this.reset();
        if (!this.collided && !this.game.gameOver)
          this.game.score += this.maxLives;
      }
    }
  }
}
class Asteroid extends Enemy {
  constructor(game) {
    super(game);
    this.image = document.getElementById("asteroid");
    this.frameX = 0;
    this.frameY = Math.floor(Math.random() * 4);
    this.maxFrames = 7;
    this.lives = 1;
    this.maxLives = this.lives;
  }
}
class LobsterMorph extends Enemy {
  constructor(game) {
    super(game);
    this.image = document.getElementById("lobstermorph");
    this.frameX = 0;
    this.frameY = Math.floor(Math.random() * 4);
    this.maxFrames = 14;
    this.lives = 8;
    this.maxLives = this.lives;
  }
}

class BeetleMorph extends Enemy {
  constructor(game) {
    super(game);
    this.image = document.getElementById("beetlemorph");
    this.frameX = 0;
    this.frameY = Math.floor(Math.random() * 4);
    this.maxFrames = 3;
    this.lives = 1;
    this.maxLives = this.lives;
  }
}

class RhinoMorph extends Enemy {
  constructor(game) {
    super(game);
    this.image = document.getElementById("rhinomorph");
    this.frameX = 0;
    this.frameY = Math.floor(Math.random() * 4);
    this.maxFrames = 6;
    this.lives = 3;
    this.maxLives = this.lives;
  }
}
class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    this.planet = new Planet(this);
    this.player = new Player(this);

    this.debug = false;

    this.projectilePool = [];
    this.numberOfProjectiles = 30;
    this.createProjectilePool();

    this.enemyPool = [];
    this.numberOfEnemies = 20;
    this.createEnemyPool();

    this.enemyPool[0].start();
    this.enemyTimer = 0;
    this.enemyInterval = 1200;

    this.spriteUpdate = false;
    this.spriteTimer = 0;
    this.spriteInterval = 150;
    this.score = 0;
    this.winningScore = 50;
    this.lives = 30;

    this.pointer = {
      x: 0,
      y: 0,
    };

    //Event Listener
    window.addEventListener("click", (e) => {
      this.player.shoot();
    });
    window.addEventListener("pointermove", (e) => {
      this.pointer.x = e.offsetX;
      this.pointer.y = e.offsetY;
    });

    window.addEventListener("keyup", (e) => {
      if (e.key === "d") this.debug = !this.debug;
      if (e.key === "f") this.player.shoot();
    });
  }
  render(context, deltaTime) {
    this.planet.draw(context);
    this.drawStatusText(context);
    this.player.draw(context);
    this.player.update();

    this.projectilePool.forEach((projectile) => {
      projectile.draw(context);
      projectile.update();
    });

    this.enemyPool.forEach((enemy) => {
      enemy.draw(context);
      enemy.update();
    });
    //periodically generate enemies
    if (!this.gameOver) {
      if (this.enemyTimer < this.enemyInterval) {
        this.enemyTimer += deltaTime;
        this.spriteUpdate = false;
      } else {
        this.enemyTimer = 0;
        const enemy = this.getEnemy();
        if (enemy) enemy.start();
      }
    }
    //periodically update sprites
    if (this.spriteTimer < this.spriteInterval) {
      this.spriteTimer += deltaTime;
    } else {
      this.spriteTimer = 0;
      this.spriteUpdate = true;
    }

    // win / lose condition
    if (this.score >= this.winningScore || this.lives < 1) {
      this.gameOver = true;
    }
  }
  drawStatusText(context) {
    context.save();
    context.textAlign = "left";
    context.font = "30px Impact";
    context.fillText(`Score ${this.score}`, 20, 30);
    for (let i = 0; i < this.lives; i++) {
      context.fillRect(20 + 15 * i, 60, 10, 30);
    }
    if (this.gameOver) {
      context.textAlign = "center";
      let message1;
      let message2;
      if (this.score >= this.winningScore) {
        message1 = "You Win";
        message2 = `Your Score is ${this.score}`;
      } else {
        message1 = "You lose";
        message2 = "Try again";
      }
      context.font = "100px Impact";
      context.fillText(message1, this.width * 0.5, 200);
      context.font = "50px Impact";
      context.fillText(message2, this.width * 0.5, 550);
    }
    context.restore();
  }
  calcAim(a, b) {
    let dx = a.x - b.x;
    let dy = a.y - b.y;
    let distance = Math.hypot(dx, dy);
    let aimX = (dx / distance) * -1;
    let aimY = (dy / distance) * -1;
    return [aimX, aimY, dx, dy];
  }
  checkCollision(a, b) {
    let sumOfRadii = a.radius + b.radius;
    let dx = a.x - b.x;
    let dy = a.y - b.y;
    let distance = Math.hypot(dx, dy);
    return distance < sumOfRadii;
  }
  createProjectilePool() {
    for (let i = 0; i < this.numberOfProjectiles; i++) {
      this.projectilePool.push(new Projectile(this));
    }
  }
  getProjectile() {
    for (let i = 0; i < this.projectilePool.length; i++) {
      if (this.projectilePool[i].free) {
        return this.projectilePool[i];
      }
    }
  }
  createEnemyPool() {
    for (let i = 0; i < this.numberOfEnemies; i++) {
      let random = Math.random();
      if (random < 0.25) {
        this.enemyPool.push(new Asteroid(this));
      } else if (random < 0.5) {
        this.enemyPool.push(new BeetleMorph(this));
      } else if (random < 0.75) {
        this.enemyPool.push(new RhinoMorph(this));
      } else {
        this.enemyPool.push(new LobsterMorph(this));
      }
    }
  }
  getEnemy() {
    for (let i = 0; i < this.enemyPool.length; i++) {
      if (this.enemyPool[i].free) {
        return this.enemyPool[i];
      }
    }
  }
}

window.addEventListener("load", function () {
  const canvas = document.getElementById("canvas1");
  const ctx = canvas.getContext("2d");
  canvas.width = 800;
  canvas.height = 800;

  ctx.fillStyle = "white";
  ctx.strokeStyle = "white";
  ctx.lineWidth = 3;
  ctx.font = " 30px Helvetica";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const game = new Game(canvas);
  let lastTime = 0;
  function animate(timeStamp) {
    let deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.render(ctx, deltaTime);

    requestAnimationFrame(animate);
  }
  animate(0);
});
